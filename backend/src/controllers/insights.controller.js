import { getInsightsCacheAware, getGrowthTimelineCacheAware } from '../services/insights.service.js';
import { getLatestInsight, getLatestTimeline } from '../services/firestore.service.js';

export async function getInsights(req, res, next) {
  try {
    const insight = await getInsightsCacheAware(req.uid);
    res.json({ insight });
  } catch (err) {
    err.publicMessage = 'Could not generate insights right now. Please try again.';
    next(err);
  }
}

export async function getLatest(req, res, next) {
  try {
    const insight = await getLatestInsight(req.uid);
    res.json({ insight });
  } catch (err) {
    next(err);
  }
}

export async function getGrowthTimeline(req, res, next) {
  try {
    const timeline = await getGrowthTimelineCacheAware(req.uid);
    res.json({ timeline });
  } catch (err) {
    err.publicMessage = 'Could not build your growth timeline right now. Please try again.';
    next(err);
  }
}

// GET /insights/timeline/latest — cheap read of the cached timeline.
export async function getLatestTimelineHandler(req, res, next) {
  try {
    const timeline = await getLatestTimeline(req.uid);
    res.json({ timeline });
  } catch (err) {
    next(err);
  }
}
