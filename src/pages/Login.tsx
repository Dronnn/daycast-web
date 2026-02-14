import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken, setUsername } from "@/api/client";
import { motion } from "framer-motion";
import "./Login.css";

interface AuthResponse {
  token: string;
  username: string;
}

export default function Login() {
  const [username, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const navigate = useNavigate();

  async function handleSubmit(action: "login" | "register") {
    setError("");
    setLoading(true);

    try {
      const resp = await fetch(`/api/v1/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || `HTTP ${resp.status}`);
        return;
      }

      const auth = data as AuthResponse;
      setToken(auth.token);
      setUsername(auth.username);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-mesh" />
      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="login-logo">
          <motion.div
            className="login-logo-icon"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </motion.div>
          <span className="login-logo-text">DayCast</span>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${isLoginMode ? "login-tab--active" : ""}`}
            onClick={() => { setIsLoginMode(true); setError(""); }}
          >
            Log in
          </button>
          <button
            className={`login-tab ${!isLoginMode ? "login-tab--active" : ""}`}
            onClick={() => { setIsLoginMode(false); setError(""); }}
          >
            Register
          </button>
        </div>

        {error && (
          <motion.div
            className="login-error"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(isLoginMode ? "login" : "register"); }}>
          <input
            className="login-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsernameInput(e.target.value)}
            autoComplete="username"
            autoFocus
            minLength={3}
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            minLength={6}
          />
          <motion.button
            type="submit"
            className="login-btn login-btn--primary"
            disabled={loading || username.length < 3 || password.length < 6}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {isLoginMode ? "Log in" : "Register"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
