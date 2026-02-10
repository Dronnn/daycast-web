import { NavLink, Outlet } from "react-router-dom";
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
        <span className="topbar-date">{formatDate()}</span>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
