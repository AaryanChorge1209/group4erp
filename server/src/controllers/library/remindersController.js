const prisma = require('../../utils/prisma');
const { triggerOverdueReminders } = require('../../utils/cron');
const { createAuditLog } = require('../../utils/helpers');

const triggerReminders = async (req, res) => {
  try {
    const result = await triggerOverdueReminders();
    await createAuditLog(prisma, req.user.id, 'TRIGGER_REMINDERS', 'Notification', 'ALL', result);
    return res.json({
      message: 'Reminder notifications generated successfully',
      result
    });
  } catch (error) {
    console.error('triggerReminders error:', error);
    return res.status(500).json({ error: 'Failed to trigger reminders' });
  }
};

const getReminderLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { title: { contains: 'Due' } },
        { title: { contains: 'Overdue' } }
      ]
    };

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })
    ]);

    return res.json({
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getReminderLogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch reminder logs' });
  }
};

module.exports = {
  triggerReminders,
  getReminderLogs
};
