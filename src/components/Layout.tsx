import { NavLink, Outlet } from "react-router-dom";
import { logout, getUsername } from "@/api/client";
import "./Layout.css";

const NAV_ITEMS = [
  { to: "/", label: "Feed" },
  { to: "/generate", label: "Generate" },
  { to: "/channels", label: "Channels" },
  { to: "/history", label: "History" },
];

function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <span className="logo-text">DayCast</span>
    </div>
  );
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Layout() {
  const username = getUsername();

  return (
    <div className="layout">
      <header className="topbar">
        <Logo />
        <nav className="segmented-control">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `segment ${isActive ? "segment--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          <span className="topbar-date">{formatDate()}</span>
          <button className="topbar-logout" onClick={logout} title={username ?? ""}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
