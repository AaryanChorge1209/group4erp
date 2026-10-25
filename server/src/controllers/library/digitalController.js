const fs = require('fs');
const path = require('path');
const prisma = require('../../utils/prisma');
const { createAuditLog } = require('../../utils/helpers');

const getDigitalResources = async (req, res) => {
  try {
    const { category, type, search } = req.query;
    const where = {};
    if (category) where.category = category;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const resources = await prisma.digitalResource.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json(resources);
  } catch (error) {
    console.error('getDigitalResources error:', error);
    return res.status(500).json({ error: 'Failed to fetch digital resources' });
  }
};

const getDigitalResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await prisma.digitalResource.update({
      where: { id },
      data: {
        downloads: { increment: 1 }
      }
    });

    return res.json(resource);
  } catch (error) {
    console.error('getDigitalResourceById error:', error);
    return res.status(500).json({ error: 'Failed to fetch digital resource' });
  }
};

const uploadDigitalResource = async (req, res) => {
  try {
    const { title, author, category, type = 'EBOOK', description } = req.body;
    if (!title || !category || !req.file) {
      return res.status(400).json({ error: 'Title, category, and file upload are required' });
    }

    const fileUrl = `/uploads/digital/${req.file.filename}`;
    const fileSize = req.file.size;

    const resource = await prisma.digitalResource.create({
      data: {
        title,
        author: author || 'Unknown',
        category,
        type,
        fileUrl,
        fileSize,
        description: description || null,
        uploadedBy: req.user.id
      }
    });

    await createAuditLog(prisma, req.user.id, 'UPLOAD_DIGITAL_RESOURCE', 'DigitalResource', resource.id, {
      title
    });

    return res.status(201).json(resource);
  } catch (error) {
    console.error('uploadDigitalResource error:', error);
    return res.status(500).json({ error: 'Failed to save digital resource' });
  }
};

const deleteDigitalResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await prisma.digitalResource.findUnique({ where: { id } });
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Try to remove file from disk
    if (resource.fileUrl) {
      const diskPath = path.join(__dirname, '../../../', resource.fileUrl);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (e) {
          console.warn('Could not remove file from disk:', e.message);
        }
      }
    }

    await prisma.digitalResource.delete({ where: { id } });
    await createAuditLog(prisma, req.user.id, 'DELETE_DIGITAL_RESOURCE', 'DigitalResource', id);

    return res.json({ message: 'Digital resource deleted successfully' });
  } catch (error) {
    console.error('deleteDigitalResource error:', error);
    return res.status(500).json({ error: 'Failed to delete digital resource' });
  }
};

module.exports = {
  getDigitalResources,
  getDigitalResourceById,
  uploadDigitalResource,
  deleteDigitalResource
};
