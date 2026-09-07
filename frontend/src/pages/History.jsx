import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

export default function History() {
  const [journals, setJournals] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [pendingDelete, setPendingDelete] = useState(null);

  function load() {
    api
      .listJournals()
      .then((r) => setJournals(r.journals))
      .catch(() => setError("Could not load your journal history."));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!journals) return [];
    let list = journals.filter((j) => j.status === "ended");
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.summary?.toLowerCase().includes(q) ||
          (j.themes || []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (sort === "oldest") list = [...list].reverse();
    return list;
  }, [journals, query, sort]);

  async function confirmDelete() {
    const id = pendingDelete;
    setPendingDelete(null);
    try {
      await api.deleteJournal(id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
    } catch {
      setError("Could not delete that journal.");
    }
  }

  if (journals === null && !error)
    return <LoadingState label="Loading your journal history…" />;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-2xl text-ink">Journal history</h1>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, theme, or summary…"
          className="flex-1 rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-moss"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-line bg-paper-raised px-3 py-2 text-sm"
        >
          <option value="recent">Most recent</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Start your first reflection"
            description="Write about your day, an idea, a challenge, or anything on your mind. Your journal becomes the foundation for your personal AI insights."
            action={
              <Link
                to="/journal/new"
                className="rounded-md bg-moss px-4 py-2 text-sm text-white hover:bg-moss-dark"
              >
                Start a journal
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((j) => (
            <li
              key={j.id}
              className="rounded-lg border border-line bg-paper-raised p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    to={`/journal/${j.id}`}
                    className="font-serif text-lg text-ink hover:text-moss"
                  >
                    {j.title}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">{j.summary}</p>
                  {j.themes?.length > 0 && (
                    <p className="mt-2 text-xs text-ink-soft">
                      {j.themes.join(" · ")}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-ink-soft">
                  <p>{j.mood}</p>
                  <p className="mt-1">{j.messageCount} messages</p>
                  <button
                    onClick={() => setPendingDelete(j.id)}
                    className="mt-3 text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this journal?"
        description="This permanently removes the conversation and its summary. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
