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
import { PublicFolderPage } from "@/pages/public-folder";

function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // <-- Add sidebar state

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
        <Route path="/c/:slug" element={<PublicFolderPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <InboxPage
                onSearchClick={() => setSearchOpen(true)}
                onMenuClick={() => setSidebarOpen(true)}
                isSidebarOpen={sidebarOpen}
                onSidebarClose={() => setSidebarOpen(false)}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/folder/:id"
          element={
            <ProtectedRoute>
              <FolderPage
                onSearchClick={() => setSearchOpen(true)}
                onMenuClick={() => setSidebarOpen(true)}
                isSidebarOpen={sidebarOpen}
                onSidebarClose={() => setSidebarOpen(false)}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tag/:id"
          element={
            <ProtectedRoute>
              <TagPage
                onSearchClick={() => setSearchOpen(true)}
                onMenuClick={() => setSidebarOpen(true)}
                isSidebarOpen={sidebarOpen}
                onSidebarClose={() => setSidebarOpen(false)}
              />
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
