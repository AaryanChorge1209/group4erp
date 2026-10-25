const prisma = require('../../utils/prisma');
const { createAuditLog } = require('../../utils/helpers');

const getAllCompanies = async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { industry: { contains: search } }
      ];
    }

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { drives: true } }
        }
      })
    ]);

    return res.json({
      data: companies,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('getAllCompanies error:', error);
    return res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        drives: {
          orderBy: { driveDate: 'desc' },
          include: {
            _count: { select: { applications: true } }
          }
        },
        users: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json(company);
  } catch (error) {
    console.error('getCompanyById error:', error);
    return res.status(500).json({ error: 'Failed to fetch company' });
  }
};

const createCompany = async (req, res) => {
  try {
    const { name, industry, website, email, phone, description, logoUrl } = req.body;
    if (!name || !industry || !email) {
      return res.status(400).json({ error: 'Name, industry, and email are required' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        industry,
        website: website || null,
        email,
        phone: phone || null,
        description: description || null,
        logoUrl: logoUrl || null,
        registeredBy: req.user.id,
        status: req.user.role === 'ADMIN' || req.user.role === 'PLACEMENT_OFFICER' ? 'APPROVED' : 'PENDING'
      }
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_COMPANY', 'Company', company.id, { name });

    return res.status(201).json(company);
  } catch (error) {
    console.error('createCompany error:', error);
    return res.status(500).json({ error: 'Failed to create company' });
  }
};

const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, industry, website, email, phone, description, logoUrl, status } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: name || undefined,
        industry: industry || undefined,
        website: website !== undefined ? website : undefined,
        email: email || undefined,
        phone: phone !== undefined ? phone : undefined,
        description: description !== undefined ? description : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        status: status || undefined
      }
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_COMPANY', 'Company', id);

    return res.json(company);
  } catch (error) {
    console.error('updateCompany error:', error);
    return res.status(500).json({ error: 'Failed to update company' });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.company.delete({ where: { id } });

    await createAuditLog(prisma, req.user.id, 'DELETE_COMPANY', 'Company', id);

    return res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('deleteCompany error:', error);
    return res.status(500).json({ error: 'Failed to delete company' });
  }
};

const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    await createAuditLog(prisma, req.user.id, 'APPROVE_COMPANY', 'Company', id);

    return res.json({ message: 'Company approved', company });
  } catch (error) {
    console.error('approveCompany error:', error);
    return res.status(500).json({ error: 'Failed to approve company' });
  }
};

const rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    await createAuditLog(prisma, req.user.id, 'REJECT_COMPANY', 'Company', id);

    return res.json({ message: 'Company rejected', company });
  } catch (error) {
    console.error('rejectCompany error:', error);
    return res.status(500).json({ error: 'Failed to reject company' });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  approveCompany,
  rejectCompany
};
