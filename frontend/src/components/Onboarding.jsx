import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "pgj_onboarded";

const steps = [
  {
    title: "Welcome to Gemini Reflect",
    body: "A private space to reflect, brainstorm, and think out loud with Gemini.",
  },
  {
    title: "Your journal is private",
    body: "Every entry is tied to your authenticated account — no one else can read it.",
  },
  {
    title: "Gemini helps you reflect",
    body: "Write naturally. Gemini asks useful follow-up questions and helps you organize your thoughts.",
  },
  {
    title: "Patterns emerge over time",
    body: "After a few sessions, AI Insights and your Growth Timeline surface themes and progress across your own entries.",
  },
  {
    title: "You control your data",
    body: "Export or delete everything at any time from Privacy & Security.",
  },
];

export function shouldShowOnboarding() {
  if (typeof window === "undefined") return false;
  return !window.localStorage.getItem(STORAGE_KEY);
}

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;

  function finish() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-sm rounded-lg bg-paper-raised p-6 shadow-lg"
        >
          <p className="text-xs text-ink-soft">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="mt-2 font-serif text-lg text-ink">
            {steps[step].title}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">{steps[step].body}</p>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={finish}
              className="text-sm text-ink-soft hover:underline"
            >
              Skip
            </button>
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="rounded-md bg-moss px-4 py-2 text-sm text-white hover:bg-moss-dark"
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
