import { listJournals, saveInsight, getLatestInsight, saveTimeline, getLatestTimeline } from './firestore.service.js';
import { generatePersonalInsights, generateGrowthSignals } from './gemini.service.js';
import { GEMINI_MODEL } from '../config/gemini.js';

const MIN_JOURNALS_FOR_INSIGHTS = 2;

function endedJournalStats(journals) {
  const ended = journals.filter((j) => j.status === 'ended' && j.summary);
  const totalMessages = ended.reduce((sum, j) => sum + (j.messageCount || 0), 0);
  return { ended, journalCount: ended.length, messageCount: totalMessages };
}

function isStale(cached, stats) {
  if (!cached) return true;
  return cached.sourceJournalCount !== stats.journalCount || cached.sourceMessageCount !== stats.messageCount;
}

export async function getInsightsCacheAware(uid) {
  const journals = await listJournals(uid, { limit: 100 });
  const stats = endedJournalStats(journals);
  const cached = await getLatestInsight(uid);

  if (stats.journalCount < MIN_JOURNALS_FOR_INSIGHTS) {
    return {
      recurringThemes: [],
      recurringChallenges: [],
      growthSignals: [],
      suggestedFocus: 'Complete a couple more journal sessions to unlock personal insights.',
      insufficientData: true,
    };
  }

  if (!isStale(cached, stats)) {
    return cached;
  }

  return buildAndStoreInsights(uid, journals, stats);
}

export async function buildAndStoreInsights(uid, journals, stats) {
  if (!journals) {
    journals = await listJournals(uid, { limit: 100 });
    stats = endedJournalStats(journals);
  }

  if (stats.journalCount < MIN_JOURNALS_FOR_INSIGHTS) {
    return {
      recurringThemes: [],
      recurringChallenges: [],
      growthSignals: [],
      suggestedFocus: 'Complete a couple more journal sessions to unlock personal insights.',
      insufficientData: true,
    };
  }

  // oldest -> newest, and ONLY this uid's own journals
  const chronological = [...stats.ended].reverse();
  const insight = await generatePersonalInsights(chronological);

  const meta = {
    generatedAt: new Date().toISOString(),
    sourceJournalCount: stats.journalCount,
    sourceMessageCount: stats.messageCount,
    model: GEMINI_MODEL,
  };

  await saveInsight(uid, insight, meta);
  return { ...insight, ...meta };
}

export async function getGrowthTimelineCacheAware(uid) {
  const journals = await listJournals(uid, { limit: 100 });
  const stats = endedJournalStats(journals);
  const cached = await getLatestTimeline(uid);

  if (stats.journalCount === 0) {
    return { entries: [], insufficientData: true };
  }

  if (!isStale(cached, stats)) {
    return cached;
  }

  return buildAndStoreTimeline(uid, journals, stats);
}

export async function buildAndStoreTimeline(uid, journals, stats) {
  if (!journals) {
    journals = await listJournals(uid, { limit: 100 });
    stats = endedJournalStats(journals);
  }
  if (stats.journalCount === 0) {
    return { entries: [], insufficientData: true };
  }

  const chronological = [...stats.ended].reverse();
  const signals = await generateGrowthSignals(chronological);

  const entries = chronological.map((journal, index) => {
    const signal = signals.find((s) => s.index === index) || {};
    return {
      journalId: journal.id,
      date: journal.createdAt,
      title: journal.title,
      excerpt: (journal.summary || '').slice(0, 160),
      mood: journal.mood,
      theme: signal.theme || (journal.themes || [])[0] || '',
      reflectionStage: signal.reflectionStage || '',
      growthSignal: signal.growthSignal || '',
      focus: signal.focus || '',
      confidence: typeof signal.confidence === 'number' ? signal.confidence : null,
    };
  });

  const meta = {
    generatedAt: new Date().toISOString(),
    sourceJournalCount: stats.journalCount,
    sourceMessageCount: stats.messageCount,
    model: GEMINI_MODEL,
  };

  await saveTimeline(uid, entries, meta);
  return { entries, ...meta };
}
