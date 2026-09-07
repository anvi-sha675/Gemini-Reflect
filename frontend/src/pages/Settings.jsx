import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { user, logOut } = useAuth();
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-serif text-2xl text-ink">Settings</h1>
      <section className="mt-8 rounded-lg border border-line bg-paper-raised p-4">
        <h2 className="font-serif text-lg text-ink">Account</h2>
        <p className="mt-2 text-sm text-ink-soft">{user?.email}</p>
        <button
          onClick={logOut}
          className="mt-4 rounded-md border border-line px-4 py-2 text-sm text-ink hover:border-moss"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
