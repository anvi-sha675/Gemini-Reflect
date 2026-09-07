import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";

function ThemeBars({ themes }) {
  if (!themes?.length) return null;
  const max = themes.length;
  return (
    <div className="space-y-1.5">
      {themes.map((t, i) => (
        <div key={t} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-xs text-ink-soft">
            {t}
          </span>
          <div className="h-2 flex-1 rounded-full bg-paper">
            <div
              className="h-2 rounded-full bg-moss"
              style={{ width: `${Math.round(((max - i) / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, items, empty, kind }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <h2 className="font-serif text-lg text-ink">{title}</h2>
        {kind && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-soft">
            {kind}
          </span>
        )}
      </div>
      {items?.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">{empty}</p>
      )}
    </section>
  );
}

function formatGeneratedAt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Insights() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getLatestInsight()
      .then((r) => setInsight(r.insight))
      .catch(() => setError("Could not load insights."))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const { insight } = await api.generateInsights();
      setInsight(insight);
    } catch (err) {
      setError(err.message || "Could not generate insights right now.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <LoadingState label="Loading your insights…" />;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">
            Your journal intelligence
          </h1>
          {insight?.generatedAt && (
            <p className="mt-1 text-xs text-ink-soft">
              Generated {formatGeneratedAt(insight.generatedAt)} from{" "}
              {insight.sourceJournalCount} journal
              {insight.sourceJournalCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="shrink-0 rounded-md bg-moss px-4 py-2 text-sm text-white hover:bg-moss-dark disabled:opacity-60"
        >
          {generating ? "Analyzing…" : "Refresh insights"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {!insight ? (
        <div className="mt-8">
          <EmptyState
            title="No insights yet."
            description="Complete a couple of journal sessions, then generate insights to see patterns across your reflections."
          />
        </div>
      ) : insight.insufficientData ? (
        <div className="mt-8">
          <EmptyState
            title="Not quite enough data yet."
            description={insight.suggestedFocus}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <section className="rounded-lg border border-line bg-paper-raised p-4">
            <p className="text-xs uppercase tracking-wide text-ink-soft">
              AI-generated interpretation
            </p>
            <h2 className="mt-1 font-serif text-lg text-ink">
              Suggested focus
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {insight.suggestedFocus}
            </p>
          </section>

          {insight.recurringThemes?.length > 0 && (
            <section>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg text-ink">Top themes</h2>
                <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-soft">
                  Observed from your journal
                </span>
              </div>
              <div className="mt-3">
                <ThemeBars themes={insight.recurringThemes} />
              </div>
            </section>
          )}

          <Section
            title="Recurring challenges"
            items={insight.recurringChallenges}
            empty="No recurring challenges detected yet."
            kind="AI-generated interpretation"
          />
          <Section
            title="Growth signals"
            items={insight.growthSignals}
            empty="Keep journaling to surface growth signals."
            kind="AI-generated interpretation"
          />
        </div>
      )}
    </div>
  );
}
