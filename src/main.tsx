import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "@/api/client";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Feed from "@/pages/Feed";
import Generate from "@/pages/Generate";
import Channels from "@/pages/Channels";
import History from "@/pages/History";
import HistoryDetail from "@/pages/HistoryDetail";
import "./index.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Feed />} />
          <Route path="generate" element={<Generate />} />
          <Route path="channels" element={<Channels />} />
          <Route path="history" element={<History />} />
          <Route path="history/:date" element={<HistoryDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
