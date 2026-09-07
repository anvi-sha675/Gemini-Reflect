import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Onboarding, { shouldShowOnboarding } from "../components/Onboarding.jsx";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [journals, setJournals] = useState(null);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);

  useEffect(() => {
    Promise.all([api.listJournals(), api.getLatestInsight()])
      .then(([j, i]) => {
        setJournals(j.journals);
        setInsight(i.insight);
      })
      .catch(() => setError("Could not load your dashboard right now."));
  }, []);

  const recent = (journals || [])
    .filter((j) => j.status === "ended")
    .slice(0, 3);
  const themes = [...new Set(recent.flatMap((j) => j.themes || []))].slice(
    0,
    5,
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <p className="text-sm text-ink-soft">
        {greeting()}, {user?.email?.split("@")[0]}
      </p>
      <h1 className="mt-1 font-serif text-3xl text-ink">
        What's on your mind today?
      </h1>

      <Link
        to="/journal/new"
        className="mt-6 inline-block rounded-md bg-moss px-5 py-2.5 text-sm text-white hover:bg-moss-dark"
      >
        Start a new journal
      </Link>

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {journals === null && !error && (
        <LoadingState label="Loading your dashboard…" />
      )}

      {journals !== null && (
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <section>
            <h2 className="font-serif text-lg text-ink">Recent reflections</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                No reflections yet — your first journal will appear here.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {recent.map((j) => (
                  <li key={j.id}>
                    <Link
                      to={`/history`}
                      className="block rounded-md border border-line bg-paper-raised p-3 hover:border-moss"
                    >
                      <p className="text-sm text-ink">{j.title}</p>
                      <p className="mt-1 text-xs text-ink-soft">{j.mood}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-soft">
              {(journals || []).length} total journal
              {(journals || []).length === 1 ? "" : "s"}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-ink">Latest AI insight</h2>
            {insight ? (
              <div className="mt-3 rounded-md border border-line bg-paper-raised p-3">
                <p className="text-sm text-ink">{insight.suggestedFocus}</p>
                {themes.length > 0 && (
                  <p className="mt-2 text-xs text-ink-soft">
                    Recent themes: {themes.join(", ")}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">
                Complete a couple of journals to unlock personal insights.
              </p>
            )}
            <Link
              to="/insights"
              className="mt-3 inline-block text-sm text-moss hover:underline"
            >
              View all insights
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
