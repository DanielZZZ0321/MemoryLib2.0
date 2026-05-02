import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminPage from "@/pages/AdminPage";
import DiaryTemplatesPage from "@/pages/DiaryTemplatesPage";
import EventEditPage from "@/pages/EventEditPage";
import GeneralReviewPage from "@/pages/GeneralReviewPage";
import MemoryLibHistoryPage from "@/pages/MemoryLibHistoryPage";
import WorkspacePage from "@/pages/WorkspacePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MemoryLibHistoryPage />} />
        <Route path="/review" element={<GeneralReviewPage />} />
        <Route path="/events/:id" element={<EventEditPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/diary-templates" element={<DiaryTemplatesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
