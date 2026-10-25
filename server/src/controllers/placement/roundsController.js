const prisma = require('../../utils/prisma');
const { createAuditLog, createNotification } = require('../../utils/helpers');

const createRound = async (req, res) => {
  try {
    const { driveId, roundNumber, roundType, scheduledAt, venue, notes } = req.body;
    if (!driveId || roundNumber === undefined || !roundType) {
      return res.status(400).json({ error: 'driveId, roundNumber, and roundType are required' });
    }

    const round = await prisma.interviewRound.create({
      data: {
        driveId,
        roundNumber: parseInt(roundNumber),
        roundType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        venue: venue || null,
        notes: notes || null
      }
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_ROUND', 'InterviewRound', round.id, {
      driveId,
      roundNumber,
      roundType
    });

    return res.status(201).json(round);
  } catch (error) {
    console.error('createRound error:', error);
    return res.status(500).json({ error: 'Failed to create interview round' });
  }
};

const updateRound = async (req, res) => {
  try {
    const { id } = req.params;
    const { roundNumber, roundType, scheduledAt, venue, notes } = req.body;

    const round = await prisma.interviewRound.update({
      where: { id },
      data: {
        roundNumber: roundNumber !== undefined ? parseInt(roundNumber) : undefined,
        roundType: roundType || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        venue: venue !== undefined ? venue : undefined,
        notes: notes !== undefined ? notes : undefined
      }
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_ROUND', 'InterviewRound', id);

    return res.json(round);
  } catch (error) {
    console.error('updateRound error:', error);
    return res.status(500).json({ error: 'Failed to update interview round' });
  }
};

const updateBulkRoundResults = async (req, res) => {
  try {
    const { id } = req.params; // roundId
    const { results } = req.body; // array of { applicationId, status: 'SHORTLISTED'|'REJECTED'|'SCHEDULED', feedback, scheduledAt }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Results array is required' });
    }

    const round = await prisma.interviewRound.findUnique({
      where: { id },
      include: { drive: { include: { company: true } } }
    });
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    const updatedResults = [];

    for (const item of results) {
      const { applicationId, status, feedback, scheduledAt } = item;

      const record = await prisma.roundResult.upsert({
        where: {
          roundId_applicationId: {
            roundId: id,
            applicationId
          }
        },
        update: {
          status: status || undefined,
          feedback: feedback !== undefined ? feedback : undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
        },
        create: {
          roundId: id,
          applicationId,
          status: status || 'SCHEDULED',
          feedback: feedback || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null
        },
        include: {
          application: {
            include: { student: { include: { user: true } } }
          }
        }
      });

      // Also update overall application status if round result changes
      let appStatus = record.application.status;
      if (status === 'REJECTED') {
        appStatus = 'REJECTED';
      } else if (status === 'SHORTLISTED') {
        appStatus = 'SHORTLISTED';
      } else if (status === 'SCHEDULED') {
        appStatus = 'INTERVIEW_SCHEDULED';
      }

      await prisma.application.update({
        where: { id: applicationId },
        data: { status: appStatus }
      });

      // Notify candidate
      if (record.application?.student?.userId) {
        await createNotification(
          prisma,
          record.application.student.userId,
          `Round ${round.roundNumber} Result Updated`,
          `Result for Round ${round.roundNumber} (${round.roundType}) at ${round.drive.company.name}: ${status}.`,
          status === 'SHORTLISTED' ? 'SUCCESS' : 'INFO',
          '/placement/my-applications'
        );
      }

      updatedResults.push(record);
    }

    await createAuditLog(prisma, req.user.id, 'UPDATE_ROUND_RESULTS', 'InterviewRound', id, {
      count: updatedResults.length
    });

    return res.json({
      message: 'Round results updated successfully',
      updatedCount: updatedResults.length,
      results: updatedResults
    });
  } catch (error) {
    console.error('updateBulkRoundResults error:', error);
    return res.status(500).json({ error: 'Failed to update round results' });
  }
};

module.exports = {
  createRound,
  updateRound,
  updateBulkRoundResults
};
