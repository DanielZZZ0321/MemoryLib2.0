import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AdminPage from "@/pages/AdminPage";
import EventEditPage from "@/pages/EventEditPage";
import GeneralReviewPage from "@/pages/GeneralReviewPage";
import WorkspacePage from "@/pages/WorkspacePage";

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Memoria</h1>
      </header>
      <main className="space-y-6 p-6">
        <nav className="flex flex-wrap gap-3">
          <Link
            to="/review"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            General Review
          </Link>
          <Link
            to="/workspace"
            className={cn(buttonVariants({ variant: "secondary" }))}
          >
            工作区
          </Link>
          <Link
            to="/admin"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            后台上传
          </Link>
        </nav>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<GeneralReviewPage />} />
        <Route path="/events/:id" element={<EventEditPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
