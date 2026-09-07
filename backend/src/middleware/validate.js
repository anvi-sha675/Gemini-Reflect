const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES_PER_JOURNAL = 200;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export function validateMessageBody(req, res, next) {
  const { content } = req.body || {};

  if (typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required.' });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message exceeds the ${MAX_MESSAGE_LENGTH}-character limit.` });
  }
  next();
}

export function validateJournalId(req, res, next) {
  const { journalId } = req.params;
  if (!journalId || !ID_PATTERN.test(journalId)) {
    return res.status(400).json({ error: 'Invalid journal id.' });
  }
  next();
}

export function enforceConversationLength(messageCount) {
  return messageCount < MAX_MESSAGES_PER_JOURNAL;
}

export const LIMITS = { MAX_MESSAGE_LENGTH, MAX_MESSAGES_PER_JOURNAL };
