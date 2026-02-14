import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { logout, getUsername } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
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

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export default function Layout() {
  const username = getUsername();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const main = document.querySelector(".main");
    if (!main) return;

    function handleScroll() {
      setScrolled((main as HTMLElement).scrollTop > 20);
    }

    main.addEventListener("scroll", handleScroll, { passive: true });
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="layout">
      <motion.header
        className={`topbar ${scrolled ? "topbar--scrolled" : ""}`}
        initial={false}
        animate={{
          height: scrolled ? 52 : 64,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
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
          <motion.button
            className="topbar-logout"
            onClick={logout}
            title={username ?? ""}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </motion.button>
        </div>
      </motion.header>
      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="page-wrapper"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
