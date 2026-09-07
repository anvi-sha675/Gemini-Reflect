import { NavLink } from "react-router-dom";
import {
  BookOpen,
  LayoutGrid,
  History,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/journal/new", label: "New Journal", icon: BookOpen },
  { to: "/history", label: "Journal History", icon: History },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/growth", label: "Growth Timeline", icon: TrendingUp },
  { to: "/privacy", label: "Privacy & Security", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { logOut, user } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-paper-raised md:flex">
      <div className="px-6 py-6">
        <p className="font-serif text-lg text-ink">Gemini Reflect</p>
        <p className="text-[11px] text-ink-soft">Secure AI-powered journal</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-moss text-white"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              }`
            }
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line px-4 py-4">
        <p className="truncate px-1 text-xs text-ink-soft">{user?.email}</p>
        <button
          onClick={logOut}
          className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
