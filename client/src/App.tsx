import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { FoldersProvider } from "@/lib/folders-context";
import { TagsProvider } from "@/lib/tags-context";
import { ToastProvider } from "@/lib/toast-context";
import { ToastViewport } from "@/components/toast-viewport";
import { SearchPalette } from "@/components/search-pallette";
import { ProtectedRoute } from "@/components/protected-route";
import { InboxPage } from "@/pages/inbox";
import { FolderPage } from "@/pages/folder";
import { TagPage } from "@/pages/tag";
import { LoginPage } from "@/pages/login";
import { AuthCallbackPage } from "@/pages/auth-callback";

function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <InboxPageWithSearch onSearchClick={() => setSearchOpen(true)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/folder/:id"
          element={
            <ProtectedRoute>
              <FolderPageWithSearch onSearchClick={() => setSearchOpen(true)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tag/:id"
          element={
            <ProtectedRoute>
              <TagPageWithSearch onSearchClick={() => setSearchOpen(true)} />
            </ProtectedRoute>
          }
        />
      </Routes>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ToastViewport />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <FoldersProvider>
            <TagsProvider>
              <AppShell />
            </TagsProvider>
          </FoldersProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

// Wrapper pages that receive the search handler

function InboxPageWithSearch({ onSearchClick }: { onSearchClick: () => void }) {
  return <InboxPage onSearchClick={onSearchClick} />;
}

function FolderPageWithSearch({
  onSearchClick,
}: {
  onSearchClick: () => void;
}) {
  return <FolderPage onSearchClick={onSearchClick} />;
}

function TagPageWithSearch({ onSearchClick }: { onSearchClick: () => void }) {
  return <TagPage onSearchClick={onSearchClick} />;
}
