const prisma = require('../utils/prisma');
const { generateReceiptNumber, createAuditLog } = require('../utils/helpers');

const getAllDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { campaignId, alumniId } = req.query;

    const where = {};
    if (campaignId) where.campaignId = campaignId;
    if (alumniId) where.alumniId = alumniId;

    const [total, donations] = await Promise.all([
      prisma.donation.count({ where }),
      prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          alumni: {
            include: { user: { select: { name: true, email: true } } }
          },
          campaign: true
        }
      })
    ]);

    return res.json({
      data: donations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAllDonations error:', error);
    return res.status(500).json({ error: 'Failed to fetch donations' });
  }
};

const recordDonation = async (req, res) => {
  try {
    const { alumniId: rawAlumniId, amount, purpose, campaignId, paymentMode = 'ONLINE', isPledge = false, notes } = req.body;

    let alumniId = rawAlumniId;
    if (req.user.role === 'ALUMNI') {
      if (!req.user.alumni) {
        return res.status(400).json({ error: 'Alumni record not linked' });
      }
      alumniId = req.user.alumni.id;
    }

    if (!alumniId || !amount || !purpose) {
      return res.status(400).json({ error: 'Alumni ID, amount, and purpose are required' });
    }

    const receiptNumber = generateReceiptNumber();
    const donationAmount = parseFloat(amount);

    const donation = await prisma.$transaction(async (tx) => {
      const newDonation = await tx.donation.create({
        data: {
          alumniId,
          amount: donationAmount,
          purpose,
          campaignId: campaignId || null,
          paymentMode,
          receiptNumber,
          isPledge: !!isPledge,
          notes: notes || null
        },
        include: {
          alumni: { include: { user: true } },
          campaign: true
        }
      });

      if (campaignId && !isPledge) {
        await tx.donationCampaign.update({
          where: { id: campaignId },
          data: {
            raisedAmount: { increment: donationAmount }
          }
        });
      }

      return newDonation;
    });

    await createAuditLog(prisma, req.user.id, 'RECORD_DONATION', 'Donation', donation.id, {
      amount: donationAmount,
      receiptNumber
    });

    return res.status(201).json(donation);
  } catch (error) {
    console.error('recordDonation error:', error);
    return res.status(500).json({ error: 'Failed to record donation' });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const campaigns = await prisma.donationCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { donations: true } }
      }
    });

    return res.json(campaigns);
  } catch (error) {
    console.error('getCampaigns error:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

const createCampaign = async (req, res) => {
  try {
    const { title, description, goalAmount, startDate, endDate, status = 'ACTIVE' } = req.body;
    if (!title || !goalAmount || !startDate || !endDate) {
      return res.status(400).json({ error: 'Title, goal amount, start date, and end date are required' });
    }

    const campaign = await prisma.donationCampaign.create({
      data: {
        title,
        description: description || null,
        goalAmount: parseFloat(goalAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status
      }
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_CAMPAIGN', 'DonationCampaign', campaign.id);

    return res.status(201).json(campaign);
  } catch (error) {
    console.error('createCampaign error:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, goalAmount, startDate, endDate, status } = req.body;

    const campaign = await prisma.donationCampaign.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        goalAmount: goalAmount ? parseFloat(goalAmount) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || undefined
      }
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_CAMPAIGN', 'DonationCampaign', id);

    return res.json(campaign);
  } catch (error) {
    console.error('updateCampaign error:', error);
    return res.status(500).json({ error: 'Failed to update campaign' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const topDonations = await prisma.donation.groupBy({
      by: ['alumniId'],
      _sum: { amount: true },
      _count: { id: true },
      where: { isPledge: false },
      orderBy: {
        _sum: { amount: 'desc' }
      },
      take: 10
    });

    const enriched = await Promise.all(
      topDonations.map(async (entry) => {
        const alumni = await prisma.alumni.findUnique({
          where: { id: entry.alumniId },
          include: { user: { select: { name: true, avatar: true } } }
        });
        return {
          alumniId: entry.alumniId,
          alumniName: alumni?.user?.name || 'Anonymous',
          avatar: alumni?.user?.avatar || null,
          branch: alumni?.branch,
          batch: alumni?.batch,
          totalDonated: entry._sum.amount,
          donationCount: entry._count.id
        };
      })
    );

    return res.json(enriched);
  } catch (error) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch donor leaderboard' });
  }
};

const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        alumni: {
          include: { user: { select: { name: true, email: true } } }
        },
        campaign: true
      }
    });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    return res.json({
      receiptNumber: donation.receiptNumber,
      donorName: donation.alumni.user.name,
      donorEmail: donation.alumni.user.email,
      rollNumber: donation.alumni.rollNumber,
      amount: donation.amount,
      purpose: donation.purpose,
      campaign: donation.campaign?.title || 'General College Fund',
      date: donation.date,
      paymentMode: donation.paymentMode
    });
  } catch (error) {
    console.error('getReceipt error:', error);
    return res.status(500).json({ error: 'Failed to fetch donation receipt' });
  }
};

module.exports = {
  getAllDonations,
  recordDonation,
  getCampaigns,
  createCampaign,
  updateCampaign,
  getLeaderboard,
  getReceipt
};
