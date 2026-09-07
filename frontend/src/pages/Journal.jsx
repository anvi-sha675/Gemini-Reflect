import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, RotateCcw } from "lucide-react";
import { api } from "../services/api.js";
import MessageBubble from "../components/MessageBubble.jsx";
import LoadingState from "../components/LoadingState.jsx";

export default function Journal() {
  const { journalId: paramId } = useParams();
  const navigate = useNavigate();
  const [journalId, setJournalId] = useState(
    paramId === "new" ? null : paramId,
  );
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [failedContent, setFailedContent] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        if (paramId === "new") {
          const { journalId: newId } = await api.createJournal();
          setJournalId(newId);
          navigate(`/journal/${newId}`, { replace: true });
        } else {
          const { messages } = await api.getJournal(paramId);
          setMessages(messages);
        }
      } catch {
        setError("Could not start your journal session.");
      } finally {
        setInitializing(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendContent(content, { isRetry = false } = {}) {
    if (!content || sending || !journalId) return;

    setError("");
    setFailedContent(null);
    if (!isRetry) {
      setMessages((prev) => [...prev, { role: "user", content }]);
      setInput("");
    }
    setSending(true);

    try {
      const { reply } = await api.sendMessage(journalId, content);
      setMessages((prev) => [...prev, { role: "model", content: reply }]);
    } catch (err) {
      setError(err.message || "Generation failed.");
      setFailedContent(content);
    } finally {
      setSending(false);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    sendContent(input.trim());
  }

  function handleRetry() {
    if (failedContent) sendContent(failedContent, { isRetry: true });
  }

  async function handleEnd() {
    if (!journalId || messages.length === 0) return;
    setSending(true);
    try {
      await api.endJournal(journalId);
      navigate(`/history`);
    } catch {
      setError("Could not generate your summary. Please try again.");
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  if (initializing) return <LoadingState label="Opening your journal…" />;

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-2xl flex-col px-6 py-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h1 className="font-serif text-xl text-ink">Journal session</h1>
        <button
          onClick={handleEnd}
          disabled={sending || messages.length === 0}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft hover:border-moss hover:text-ink disabled:opacity-50"
        >
          End journal
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.length === 0 && (
          <p className="text-sm text-ink-soft">
            Write whatever's on your mind — there's no wrong way to start.
          </p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-ink-soft"
          >
            Generating…
          </motion.div>
        )}
        {failedContent && !sending && (
          <div className="flex items-center gap-3 text-sm text-danger">
            <span>Generation failed.</span>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 rounded-md border border-danger px-2 py-1 text-xs hover:bg-danger/10"
            >
              <RotateCcw size={13} /> Retry
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && !failedContent && (
        <p className="pb-2 text-sm text-danger">{error}</p>
      )}

      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-line pt-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={4000}
          placeholder="Type your reflection…"
          className="max-h-40 flex-1 resize-none rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-moss"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send message"
          className="rounded-md bg-moss p-2.5 text-white hover:bg-moss-dark disabled:opacity-50"
        >
          <Send size={18} strokeWidth={1.75} />
        </button>
      </form>
    </div>
  );
}
