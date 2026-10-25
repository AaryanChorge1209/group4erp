const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const prisma = require('../utils/prisma');
const { parseSkills, createAuditLog } = require('../utils/helpers');

const uploadAndParseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file (.pdf or .docx) is required' });
    }

    let studentId = req.body.studentId;
    if (req.user.role === 'STUDENT') {
      if (!req.user.student) {
        return res.status(400).json({ error: 'Student profile not linked to user' });
      }
      studentId = req.user.student.id;
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(req.file.originalname).toLowerCase();

    let rawText = '';
    if (ext === '.pdf') {
      const parsedPdf = await pdfParse(fileBuffer);
      rawText = parsedPdf.text || '';
    } else if (ext === '.docx' || ext === '.doc') {
      const parsedDocx = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = parsedDocx.value || '';
    } else {
      rawText = fileBuffer.toString('utf8');
    }

    // Extract basic fields
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/);

    const email = emailMatch ? emailMatch[0] : null;
    const phone = phoneMatch ? phoneMatch[0] : null;

    // First line or non-empty line as candidate name guess
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const candidateName = lines.length > 0 ? lines[0].slice(0, 50) : null;

    // Skills
    const skills = parseSkills(rawText);

    // Education extraction (basic regex heuristics)
    const educationLines = [];
    const eduKeywords = ['b.tech', 'bachelor', 'master', 'm.tech', 'degree', 'cgpa', 'cbse', 'college', 'university', 'school'];
    for (const line of lines) {
      if (eduKeywords.some((kw) => line.toLowerCase().includes(kw))) {
        educationLines.push(line);
      }
    }

    // Experience extraction
    const expLines = [];
    const expKeywords = ['intern', 'internship', 'developer', 'engineer', 'project', 'experience', 'worked at'];
    for (const line of lines) {
      if (expKeywords.some((kw) => line.toLowerCase().includes(kw))) {
        expLines.push(line);
      }
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    const parsedData = await prisma.parsedResume.upsert({
      where: { studentId },
      update: {
        rawText,
        name: candidateName,
        email,
        phone,
        skills: JSON.stringify(skills),
        education: JSON.stringify(educationLines.slice(0, 10)),
        experience: JSON.stringify(expLines.slice(0, 10)),
        isConfirmed: false,
        parsedAt: new Date()
      },
      create: {
        studentId,
        rawText,
        name: candidateName,
        email,
        phone,
        skills: JSON.stringify(skills),
        education: JSON.stringify(educationLines.slice(0, 10)),
        experience: JSON.stringify(expLines.slice(0, 10)),
        isConfirmed: false
      }
    });

    // Also update student resumeUrl & skills if needed
    await prisma.student.update({
      where: { id: studentId },
      data: {
        resumeUrl,
        skills: JSON.stringify(skills)
      }
    });

    await createAuditLog(prisma, req.user.id, 'UPLOAD_RESUME', 'ParsedResume', parsedData.id, {
      studentId,
      extractedSkillsCount: skills.length
    });

    return res.status(201).json({
      message: 'Resume parsed successfully',
      data: {
        ...parsedData,
        skills: JSON.parse(parsedData.skills || '[]'),
        education: JSON.parse(parsedData.education || '[]'),
        experience: JSON.parse(parsedData.experience || '[]')
      }
    });
  } catch (error) {
    console.error('uploadAndParseResume error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process resume' });
  }
};

const confirmResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, skills, education, experience } = req.body;

    const data = { isConfirmed: true };
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (skills !== undefined) data.skills = typeof skills === 'string' ? skills : JSON.stringify(skills);
    if (education !== undefined) data.education = typeof education === 'string' ? education : JSON.stringify(education);
    if (experience !== undefined) data.experience = typeof experience === 'string' ? experience : JSON.stringify(experience);

    const updated = await prisma.parsedResume.update({
      where: { id },
      data
    });

    // Sync student skills
    if (skills) {
      await prisma.student.update({
        where: { id: updated.studentId },
        data: {
          skills: typeof skills === 'string' ? skills : JSON.stringify(skills)
        }
      });
    }

    await createAuditLog(prisma, req.user.id, 'CONFIRM_RESUME', 'ParsedResume', id);

    return res.json({
      message: 'Resume data confirmed',
      data: {
        ...updated,
        skills: JSON.parse(updated.skills || '[]'),
        education: JSON.parse(updated.education || '[]'),
        experience: JSON.parse(updated.experience || '[]')
      }
    });
  } catch (error) {
    console.error('confirmResume error:', error);
    return res.status(500).json({ error: 'Failed to confirm resume data' });
  }
};

const searchBySkills = async (req, res) => {
  try {
    const { skill, skills: skillsQuery } = req.query;
    const searchSkills = (skillsQuery ? skillsQuery.split(',') : [skill]).filter(Boolean).map((s) => s.trim().toLowerCase());

    if (searchSkills.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required' });
    }

    const allParsed = await prisma.parsedResume.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, avatar: true } }
          }
        }
      }
    });

    const matches = allParsed.filter((record) => {
      if (!record.skills) return false;
      try {
        const studentSkills = JSON.parse(record.skills).map((s) => s.toLowerCase());
        return searchSkills.some((s) => studentSkills.some((sk) => sk.includes(s)));
      } catch (e) {
        return false;
      }
    });

    return res.json(
      matches.map((m) => ({
        ...m,
        skills: JSON.parse(m.skills || '[]'),
        education: JSON.parse(m.education || '[]'),
        experience: JSON.parse(m.experience || '[]')
      }))
    );
  } catch (error) {
    console.error('searchBySkills error:', error);
    return res.status(500).json({ error: 'Failed to search resumes by skill' });
  }
};

module.exports = {
  uploadAndParseResume,
  confirmResume,
  searchBySkills
};
