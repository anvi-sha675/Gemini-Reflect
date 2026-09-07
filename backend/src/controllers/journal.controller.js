import * as db from '../services/firestore.service.js';
import { sendJournalMessage, generateJournalSummary } from '../services/gemini.service.js';
import { LIMITS, enforceConversationLength } from '../middleware/validate.js';
import { logEvent } from '../utils/logger.js';

export async function createJournal(req, res, next) {
  try {
    const journalId = await db.createJournal(req.uid);
    logEvent('journal_created', { uid: req.uid, journalId });
    res.status(201).json({ journalId });
  } catch (err) {
    next(err);
  }
}

export async function listJournals(req, res, next) {
  try {
    const journals = await db.listJournals(req.uid);
    res.json({ journals });
  } catch (err) {
    next(err);
  }
}

export async function getJournal(req, res, next) {
  try {
    const journal = await db.getJournal(req.uid, req.params.journalId);
    if (!journal) return res.status(404).json({ error: 'Journal not found.' });

    const messages = await db.listMessages(req.uid, req.params.journalId);
    res.json({ journal, messages });
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    const { journalId } = req.params;
    const { content } = req.body;

    const journal = await db.getJournal(req.uid, journalId);
    if (!journal) return res.status(404).json({ error: 'Journal not found.' });
    if (journal.status !== 'active') {
      return res.status(400).json({ error: 'This journal session has already ended.' });
    }
    if (!enforceConversationLength(journal.messageCount || 0)) {
      return res.status(400).json({
        error: `This session has reached the ${LIMITS.MAX_MESSAGES_PER_JOURNAL}-message limit. Please end the session.`,
      });
    }

    // Trusted history is whatever is already persisted — nothing optimistic.
    const priorMessages = await db.listMessages(req.uid, journalId);

    let replyText;
    try {
      replyText = await sendJournalMessage(
        priorMessages.map((m) => ({ role: m.role, content: m.content })),
        content
      );
    } catch (geminiErr) {
      const err = new Error('gemini_failure');
      err.statusCode = 502;
      err.publicMessage = 'The reflection assistant is temporarily unavailable. Please try again.';
      return next(err);
    }

    const { userMessageId, modelMessageId } = await db.appendMessagePair(req.uid, journalId, content, replyText);

    res.json({ reply: replyText, userMessageId, modelMessageId });
  } catch (err) {
    err.publicMessage = 'Something went wrong sending your message. Please try again.';
    next(err);
  }
}

export async function endJournal(req, res, next) {
  try {
    const { journalId } = req.params;
    const journal = await db.getJournal(req.uid, journalId);
    if (!journal) return res.status(404).json({ error: 'Journal not found.' });

    const messages = await db.listMessages(req.uid, journalId);
    if (messages.length === 0) {
      return res.status(400).json({ error: 'Cannot summarize an empty journal.' });
    }

    const summary = await generateJournalSummary(
      messages.map((m) => ({ role: m.role, content: m.content }))
    );

    await db.endJournalWithSummary(req.uid, journalId, summary);
    logEvent('journal_ended', { uid: req.uid, journalId });

    res.json({ summary });
  } catch (err) {
    err.publicMessage = 'Could not generate a summary right now. Please try again.';
    next(err);
  }
}

export async function deleteJournal(req, res, next) {
  try {
    await db.deleteJournal(req.uid, req.params.journalId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function deleteAllUserData(req, res, next) {
  try {
    const result = await db.deleteAllUserData(req.uid);
    if (!result.success) {
      // Partial failure — do NOT report success. Log server-side detail,
      // return a safe summary the client can act on.
      logEvent('delete_all_incomplete', { uid: req.uid, errorCount: result.errors.length });
      return res.status(500).json({
        error: 'Some of your data could not be deleted. Please try again.',
        partial: {
          journalsDeleted: result.journalsDeleted,
          insightsDeleted: result.insightsDeleted,
          timelinesDeleted: result.timelinesDeleted,
          settingsDeleted: result.settingsDeleted,
        },
      });
    }
    logEvent('delete_all_complete', { uid: req.uid, ...result, errors: undefined });
    res.json({
      success: true,
      journalsDeleted: result.journalsDeleted,
      messagesDeleted: result.messagesDeleted,
      insightsDeleted: result.insightsDeleted,
      timelinesDeleted: result.timelinesDeleted,
      settingsDeleted: result.settingsDeleted,
    });
  } catch (err) {
    next(err);
  }
}
