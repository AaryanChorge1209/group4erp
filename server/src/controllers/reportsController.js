const prisma = require('../utils/prisma');

const getLibraryIssuesReport = async (req, res) => {
  try {
    const { startDate, endDate, branch, studentId, export: exportType } = req.query;

    const where = {};
    if (studentId) where.studentId = studentId;
    if (branch) {
      where.student = { branch };
    }
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt.gte = new Date(startDate);
      if (endDate) where.issuedAt.lte = new Date(endDate);
    }

    const issues = await prisma.bookIssue.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: {
        bookCopy: { include: { book: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
        fine: true
      }
    });

    const now = new Date();
    let totalIssues = issues.length;
    let activeIssues = 0;
    let returnedIssues = 0;
    let overdueIssues = 0;

    issues.forEach((issue) => {
      if (!issue.returnedAt) {
        activeIssues++;
        if (now > new Date(issue.dueDate)) {
          overdueIssues++;
        }
      } else {
        returnedIssues++;
      }
    });

    if (exportType === 'csv') {
      const header = 'Issue ID,Book Title,ISBN,Barcode,Student Roll,Student Name,Branch,Issued At,Due Date,Returned At,Fine Amount\n';
      const rows = issues.map((i) => {
        const title = `"${(i.bookCopy.book.title || '').replace(/"/g, '""')}"`;
        const isbn = i.bookCopy.book.isbn || '';
        const barcode = i.bookCopy.barcode || '';
        const roll = i.student.rollNumber || '';
        const name = `"${(i.student.user.name || '').replace(/"/g, '""')}"`;
        const br = i.student.branch || '';
        const issued = i.issuedAt ? i.issuedAt.toISOString().split('T')[0] : '';
        const due = i.dueDate ? i.dueDate.toISOString().split('T')[0] : '';
        const returned = i.returnedAt ? i.returnedAt.toISOString().split('T')[0] : 'Not Returned';
        const fine = i.fine ? i.fine.amount : 0;
        return `${i.id},${title},${isbn},${barcode},${roll},${name},${br},${issued},${due},${returned},${fine}`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="library-issues-report.csv"');
      return res.send(header + rows);
    }

    return res.json({
      summary: {
        totalIssues,
        activeIssues,
        returnedIssues,
        overdueIssues
      },
      data: issues
    });
  } catch (error) {
    console.error('getLibraryIssuesReport error:', error);
    return res.status(500).json({ error: 'Failed to generate library issues report' });
  }
};

const getLibraryFinesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const fines = await prisma.fine.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        bookIssue: { include: { bookCopy: { include: { book: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalCollected = 0;
    let totalPending = 0;
    let totalWaived = 0;

    fines.forEach((f) => {
      if (f.isWaived) {
        totalWaived += f.amount;
      } else if (f.isPaid) {
        totalCollected += f.amount;
      } else {
        totalPending += f.amount;
      }
    });

    return res.json({
      summary: {
        totalFinesCount: fines.length,
        totalCollected,
        totalPending,
        totalWaived
      },
      data: fines
    });
  } catch (error) {
    console.error('getLibraryFinesReport error:', error);
    return res.status(500).json({ error: 'Failed to generate library fines report' });
  }
};

const getPlacementSummary = async (req, res) => {
  try {
    const [totalStudents, totalApplications, selectedApps, drives] = await Promise.all([
      prisma.student.count(),
      prisma.application.count(),
      prisma.application.findMany({
        where: {
          status: { in: ['SELECTED', 'OFFER_ACCEPTED'] }
        },
        include: {
          student: true,
          drive: { include: { company: true } }
        }
      }),
      prisma.placementDrive.findMany({
        include: {
          company: true,
          applications: {
            where: { status: { in: ['SELECTED', 'OFFER_ACCEPTED'] } }
          }
        }
      })
    ]);

    const uniquePlacedStudentIds = new Set(selectedApps.map((a) => a.studentId));
    const placedStudentsCount = uniquePlacedStudentIds.size;
    const placementRate = totalStudents > 0 ? (placedStudentsCount / totalStudents) * 100 : 0;

    // CTC stats
    const driveCtcs = selectedApps.map((a) => a.drive.ctc);
    const highestCtc = driveCtcs.length > 0 ? Math.max(...driveCtcs) : 0;
    const avgCtc = driveCtcs.length > 0 ? driveCtcs.reduce((a, b) => a + b, 0) / driveCtcs.length : 0;

    // Branch-wise stats
    const branchStats = {};
    selectedApps.forEach((app) => {
      const b = app.student.branch;
      if (!branchStats[b]) branchStats[b] = { branch: b, placed: 0 };
      branchStats[b].placed++;
    });

    // Company-wise stats
    const companyStats = drives.map((d) => ({
      companyId: d.company.id,
      companyName: d.company.name,
      role: d.role,
      ctc: d.ctc,
      selectionsCount: d.applications.length
    }));

    return res.json({
      totalStudents,
      totalApplications,
      placedStudentsCount,
      placementRate: parseFloat(placementRate.toFixed(2)),
      highestCtc,
      avgCtc: parseFloat(avgCtc.toFixed(2)),
      branchWise: Object.values(branchStats),
      companyWise: companyStats
    });
  } catch (error) {
    console.error('getPlacementSummary error:', error);
    return res.status(500).json({ error: 'Failed to generate placement summary report' });
  }
};

const getPlacementCompanyWise = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        drives: {
          include: {
            applications: {
              include: {
                student: { include: { user: { select: { name: true, email: true } } } }
              }
            }
          }
        }
      }
    });

    const report = companies.map((c) => {
      let totalApplicants = 0;
      let totalSelections = 0;
      const roles = [];

      c.drives.forEach((d) => {
        totalApplicants += d.applications.length;
        const selections = d.applications.filter((a) => a.status === 'SELECTED' || a.status === 'OFFER_ACCEPTED').length;
        totalSelections += selections;
        roles.push({
          driveId: d.id,
          role: d.role,
          ctc: d.ctc,
          status: d.status,
          applicantsCount: d.applications.length,
          selectionsCount: selections
        });
      });

      return {
        companyId: c.id,
        name: c.name,
        industry: c.industry,
        drivesCount: c.drives.length,
        totalApplicants,
        totalSelections,
        roles
      };
    });

    return res.json(report);
  } catch (error) {
    console.error('getPlacementCompanyWise error:', error);
    return res.status(500).json({ error: 'Failed to generate company-wise placement report' });
  }
};

const getAlumniSummary = async (req, res) => {
  try {
    const [totalAlumni, verifiedAlumni, mentorsCount, branchStats, topCompanies] = await Promise.all([
      prisma.alumni.count(),
      prisma.alumni.count({ where: { isVerified: true } }),
      prisma.alumni.count({ where: { offersmentoring: true } }),
      prisma.alumni.groupBy({
        by: ['branch'],
        _count: { id: true }
      }),
      prisma.alumni.groupBy({
        by: ['currentCompany'],
        where: { currentCompany: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);

    return res.json({
      totalAlumni,
      verifiedAlumni,
      mentorsCount,
      branchDistribution: branchStats.map((b) => ({ branch: b.branch, count: b._count.id })),
      topCompanies: topCompanies.map((c) => ({ company: c.currentCompany, count: c._count.id }))
    });
  } catch (error) {
    console.error('getAlumniSummary error:', error);
    return res.status(500).json({ error: 'Failed to generate alumni summary report' });
  }
};

const getDonationsSummary = async (req, res) => {
  try {
    const [totalRaised, totalCount, campaigns, paymentModes] = await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true },
        where: { isPledge: false }
      }),
      prisma.donation.count(),
      prisma.donationCampaign.findMany({
        include: { _count: { select: { donations: true } } }
      }),
      prisma.donation.groupBy({
        by: ['paymentMode'],
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    return res.json({
      totalRaised: totalRaised._sum.amount || 0,
      totalDonationsCount: totalCount,
      campaigns,
      paymentModeBreakdown: paymentModes.map((p) => ({
        mode: p.paymentMode,
        amount: p._sum.amount,
        count: p._count.id
      }))
    });
  } catch (error) {
    console.error('getDonationsSummary error:', error);
    return res.status(500).json({ error: 'Failed to generate donations summary report' });
  }
};

module.exports = {
  getLibraryIssuesReport,
  getLibraryFinesReport,
  getPlacementSummary,
  getPlacementCompanyWise,
  getAlumniSummary,
  getDonationsSummary
};
