export default function LoadingState({ label = "Loading…" }) {
  return (
    <div
      className="flex items-center gap-2 py-10 text-sm text-ink-soft"
      role="status"
      aria-live="polite"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-moss" />
      <span>{label}</span>
    </div>
  );
}
