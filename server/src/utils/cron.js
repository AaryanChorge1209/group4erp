const cron = require('node-cron');
const prisma = require('./prisma');
const { createNotification } = require('./helpers');

/**
 * Trigger overdue and due-date reminders for library issues
 */
async function triggerOverdueReminders() {
  console.log('[CRON] Running library due & overdue reminder job...');
  const now = new Date();
  
  // Start and end of today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  // Start and end of tomorrow
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);

  let notifiedCount = 0;

  try {
    // 1. Due Today
    const dueTodayIssues = await prisma.bookIssue.findMany({
      where: {
        returnedAt: null,
        dueDate: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      include: {
        student: { select: { userId: true, rollNumber: true } },
        bookCopy: { include: { book: { select: { title: true } } } }
      }
    });

    for (const issue of dueTodayIssues) {
      if (issue.student && issue.student.userId) {
        await createNotification(
          prisma,
          issue.student.userId,
          'Book Due Today',
          `Your issued book "${issue.bookCopy.book.title}" is due today. Please return or renew it to avoid overdue fines.`,
          'WARNING',
          '/library/my-books'
        );
        notifiedCount++;
      }
    }

    // 2. Due Tomorrow
    const dueTomorrowIssues = await prisma.bookIssue.findMany({
      where: {
        returnedAt: null,
        dueDate: {
          gte: startOfTomorrow,
          lte: endOfTomorrow
        }
      },
      include: {
        student: { select: { userId: true, rollNumber: true } },
        bookCopy: { include: { book: { select: { title: true } } } }
      }
    });

    for (const issue of dueTomorrowIssues) {
      if (issue.student && issue.student.userId) {
        await createNotification(
          prisma,
          issue.student.userId,
          'Book Due Tomorrow',
          `Your issued book "${issue.bookCopy.book.title}" is due tomorrow. Please plan to return it on time.`,
          'INFO',
          '/library/my-books'
        );
        notifiedCount++;
      }
    }

    // 3. Overdue (dueDate < startOfToday)
    const overdueIssues = await prisma.bookIssue.findMany({
      where: {
        returnedAt: null,
        dueDate: {
          lt: startOfToday
        }
      },
      include: {
        student: { select: { userId: true, rollNumber: true } },
        bookCopy: { include: { book: { select: { title: true } } } }
      }
    });

    for (const issue of overdueIssues) {
      if (issue.student && issue.student.userId) {
        const daysOverdue = Math.ceil((now.getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        await createNotification(
          prisma,
          issue.student.userId,
          'Library Book Overdue',
          `Your issued book "${issue.bookCopy.book.title}" is overdue by ${daysOverdue} day(s). Fines are accumulating daily.`,
          'ERROR',
          '/library/my-books'
        );
        notifiedCount++;
      }
    }

    console.log(`[CRON] Library reminder job finished. Sent ${notifiedCount} notifications.`);
    return {
      success: true,
      dueTodayCount: dueTodayIssues.length,
      dueTomorrowCount: dueTomorrowIssues.length,
      overdueCount: overdueIssues.length,
      totalNotificationsSent: notifiedCount
    };
  } catch (error) {
    console.error('[CRON] Error during library reminders job:', error.message);
    throw error;
  }
}

// Schedule daily at 8:00 AM (0 8 * * *)
cron.schedule('0 8 * * *', async () => {
  try {
    await triggerOverdueReminders();
  } catch (err) {
    console.error('[CRON] Scheduled job failed:', err);
  }
});

module.exports = {
  triggerOverdueReminders
};
