import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { EmptyState } from "@/components/empty-state";
import { Footer } from "@/components/footer";

export function InboxPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-navy">
                Inbox
              </h1>
              <p className="mt-1 text-sm text-navy/60">
                Unsorted saves land here. Move them into folders anytime.
              </p>
            </div>

            <EmptyState />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
