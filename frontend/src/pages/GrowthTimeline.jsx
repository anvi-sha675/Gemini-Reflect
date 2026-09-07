import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";

function formatDate(ts) {
  if (!ts?._seconds) return "";
  return new Date(ts._seconds * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function GrowthTimeline() {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getLatestGrowthTimeline()
      .then((r) => setTimeline(r.timeline))
      .catch(() => setError("Could not load your timeline."))
      .finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    try {
      const { timeline } = await api.generateGrowthTimeline();
      setTimeline(timeline);
    } catch (err) {
      setError(
        err.message || "Could not build your growth timeline right now.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <LoadingState label="Loading your timeline…" />;

  const entries = timeline?.entries || [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Growth timeline</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-md bg-moss px-4 py-2 text-sm text-white hover:bg-moss-dark disabled:opacity-60"
        >
          {refreshing ? "Analyzing…" : "Refresh timeline"}
        </button>
      </div>
      <p className="mt-2 max-w-prose text-sm text-ink-soft">
        How your thoughts and priorities have evolved, based only on your own
        journal entries.
      </p>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {entries.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your timeline will grow with you."
            description="Finish a few journal sessions, then click Refresh timeline above to generate it — it doesn't build itself automatically yet."
          />
        </div>
      ) : (
        <ol className="mt-8 border-l border-line pl-6">
          {entries.map((entry, i) => (
            <li key={entry.journalId || i} className="relative mb-10 last:mb-0">
              <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-moss" />
              <p className="text-xs text-ink-soft">
                {formatDate(entry.date)}
                {entry.theme ? ` · ${entry.theme}` : ""}
              </p>
              <p className="mt-1 font-serif text-ink">{entry.title}</p>
              <p className="mt-1 text-sm text-ink-soft">"{entry.excerpt}"</p>
              {(entry.reflectionStage || entry.growthSignal || entry.focus) && (
                <div className="mt-2 space-y-0.5 text-xs text-ink-soft">
                  {entry.reflectionStage && (
                    <p>
                      <span className="text-ink">Reflection stage:</span>{" "}
                      {entry.reflectionStage}
                    </p>
                  )}
                  {entry.growthSignal && (
                    <p>
                      <span className="text-ink">Growth signal:</span>{" "}
                      {entry.growthSignal}
                    </p>
                  )}
                  {entry.focus && (
                    <p>
                      <span className="text-ink">Focus:</span> {entry.focus}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
