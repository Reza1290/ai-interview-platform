import { Outlet } from "react-router-dom";

export default function CandidateLayout() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Minimal header — no nav */}
      <header className="border-b bg-white shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center">
          <span className="font-semibold text-sm text-muted-foreground">AI Interview</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
