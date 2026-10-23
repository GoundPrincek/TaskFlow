import { CalendarCheck2, LayoutDashboard, ListChecks } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
];

function NavigationLinks({ onNavigate }) {
  return (
    <ul className="space-y-1">
      {links.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            className={({ isActive }) =>
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition " +
              (isActive
                ? "bg-indigo-50 text-brand"
                : "text-slate-600 hover:bg-slate-50 hover:text-ink")
            }
            to={to}
            end={end}
            onClick={onNavigate}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function WorkspaceTip() {
  return (
    <div className="absolute inset-x-4 bottom-5 hidden rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 lg:block">
      <span className="grid size-9 place-items-center rounded-xl bg-white text-brand shadow-sm">
        <CalendarCheck2 className="size-[18px]" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">A clearer day starts here</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Keep your priorities visible and take one task at a time.
      </p>
    </div>
  );
}

function NavigationContent({ onNavigate }) {
  return (
    <>
      <div className="px-3 pb-3 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Workspace
        </p>
      </div>
      <NavigationLinks onNavigate={onNavigate} />
    </>
  );
}

export default function Sidebar({ isOpen, onNavigate }) {
  return (
    <>
      <nav
        id="desktop-navigation"
        aria-label="Primary navigation"
        className="relative hidden w-72 shrink-0 border-r border-line bg-white p-4 lg:block"
      >
        <NavigationContent onNavigate={onNavigate} />
        <WorkspaceTip />
      </nav>

      <nav
        id="mobile-navigation"
        aria-label="Primary navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={
          "fixed bottom-0 left-0 top-[72px] z-50 w-72 border-r border-line bg-white p-4 shadow-card transition-transform duration-200 motion-reduce:transition-none lg:hidden " +
          (isOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <NavigationContent onNavigate={onNavigate} />
      </nav>
    </>
  );
}
