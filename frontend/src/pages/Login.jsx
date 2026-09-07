import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(
        "Could not sign in. Check your email and password and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await signInWithGoogle();
      navigate("/");
    } catch {
      setError("Google sign-in was not completed.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-2xl text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Sign in to continue your reflections.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-ink-soft">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-ink-soft">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-moss py-2.5 text-sm text-white hover:bg-moss-dark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <button
          onClick={handleGoogle}
          className="mt-3 w-full rounded-md border border-line py-2.5 text-sm text-ink hover:bg-paper-raised"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-ink-soft">
          New here?{" "}
          <Link to="/signup" className="text-moss hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
