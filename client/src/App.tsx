import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { FoldersProvider } from "@/lib/folders-context";
import { TagsProvider } from "@/lib/tags-context";
import { ToastProvider } from "@/lib/toast-context";
import { ToastViewport } from "@/components/toast-viewport";
import { ProtectedRoute } from "@/components/protected-route";
import { InboxPage } from "@/pages/inbox";
import { FolderPage } from "@/pages/folder";
import { TagPage } from "@/pages/tag";
import { LoginPage } from "@/pages/login";
import { AuthCallbackPage } from "@/pages/auth-callback";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <FoldersProvider>
            <TagsProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <InboxPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/folder/:id"
                  element={
                    <ProtectedRoute>
                      <FolderPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tag/:id"
                  element={
                    <ProtectedRoute>
                      <TagPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <ToastViewport />
            </TagsProvider>
          </FoldersProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
