import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

export default function Privacy() {
  const { user, logOut } = useAuth();
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);

  async function handleExport() {
    setStatus("Preparing your export…");
    setStatusIsError(false);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gemini-reflect-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Export downloaded.");
    } catch {
      setStatus("Could not export your data right now.");
      setStatusIsError(true);
    }
  }

  async function handleDeleteAll() {
    setConfirmingDeleteAll(false);
    setStatus("Deleting all journal data…");
    setStatusIsError(false);
    try {
      const result = await api.deleteAllJournals();
      if (result?.success) {
        setStatus(
          `All journal data has been deleted (${result.journalsDeleted} journal${result.journalsDeleted === 1 ? "" : "s"}, ${result.insightsDeleted} insight${result.insightsDeleted === 1 ? "" : "s"}, ${result.timelinesDeleted} timeline snapshot${result.timelinesDeleted === 1 ? "" : "s"}). Signing you out…`,
        );
        setTimeout(() => logOut(), 1500);
      } else {
        setStatus(
          "Some data could not be deleted. Please try again — nothing was reported as removed unless it actually was.",
        );
        setStatusIsError(true);
      }
    } catch {
      setStatus("Could not delete your data right now.");
      setStatusIsError(true);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-2xl text-ink">Privacy & security</h1>
      <p className="mt-3 max-w-prose text-sm text-ink-soft">
        Your journal data is scoped to your authenticated account, and backend
        authorization prevents any other account from accessing your journal
        resources — that isolation is enforced by the database and the server,
        not just hidden in the interface.
      </p>

      <section className="mt-8 rounded-lg border border-line bg-paper-raised p-4">
        <h2 className="font-serif text-lg text-ink">Account</h2>
        <p className="mt-2 text-sm text-ink-soft">Signed in as {user?.email}</p>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-paper-raised p-4">
        <h2 className="font-serif text-lg text-ink">
          How your data is protected
        </h2>
        <dl className="mt-3 space-y-2 text-sm text-ink-soft">
          <div>
            <dt className="text-ink">Firebase Authentication</dt>
            <dd>
              Verifies your identity on every request — the server never trusts
              an id supplied by the browser.
            </dd>
          </div>
          <div>
            <dt className="text-ink">Firestore</dt>
            <dd>
              Stores your journals under a namespace scoped to your account
              only.
            </dd>
          </div>
          <div>
            <dt className="text-ink">Cloud Run</dt>
            <dd>
              Runs the backend that checks your identity before touching any
              data.
            </dd>
          </div>
          <div>
            <dt className="text-ink">Secret Manager</dt>
            <dd>
              Holds the Gemini credential; it is never sent to your browser.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-paper-raised p-4">
        <h2 className="font-serif text-lg text-ink">Export your data</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Download every journal, message, insight, and growth timeline snapshot
          tied to your account as a JSON file.
        </p>
        <button
          onClick={handleExport}
          className="mt-3 rounded-md border border-line px-4 py-2 text-sm text-ink hover:border-moss"
        >
          Export my data
        </button>
      </section>

      <section className="mt-6 rounded-lg border border-line bg-paper-raised p-4">
        <h2 className="font-serif text-lg text-ink">Delete all journal data</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Permanently remove every journal, message, insight, timeline snapshot,
          and setting in your account. This cannot be undone, and you'll be
          signed out once it completes.
        </p>
        <button
          onClick={() => setConfirmingDeleteAll(true)}
          className="mt-3 rounded-md border border-danger px-4 py-2 text-sm text-danger hover:bg-danger/10"
        >
          Delete all my data
        </button>
      </section>

      {status && (
        <p
          className={`mt-6 text-sm ${statusIsError ? "text-danger" : "text-ink-soft"}`}
        >
          {status}
        </p>
      )}

      <ConfirmModal
        open={confirmingDeleteAll}
        title="Delete all journal data?"
        description="This permanently removes every journal, message, insight, and timeline snapshot in your account. This cannot be undone."
        confirmLabel="Delete everything"
        danger
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmingDeleteAll(false)}
      />
    </div>
  );
}
