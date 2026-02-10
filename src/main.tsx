import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Feed from "@/pages/Feed";
import Generate from "@/pages/Generate";
import Channels from "@/pages/Channels";
import History from "@/pages/History";
import HistoryDetail from "@/pages/HistoryDetail";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
