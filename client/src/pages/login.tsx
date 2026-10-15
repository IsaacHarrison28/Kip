import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { KipLogo } from "@/components/kip-logo";
import { GoogleIcon } from "@/components/icons/google-icon";

export function LoginPage() {
  const { session, loading, signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  async function handleEmail() {
    if (!email.trim()) return;
    setSending(true);
    setError(null);

    const { error } = await signInWithEmail(email.trim());
    setSending(false);

    if (error) setError(error);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <KipLogo />
        </div>

        <div className="rounded-kip-lg border border-navy/10 bg-white p-8 shadow-kip-card">
          <h1 className="text-center text-xl font-semibold text-navy">
            Welcome to Kip
          </h1>
          <p className="mt-1 text-center text-sm text-navy/60">
            Save anything. Find everything.
          </p>

          {sent ? (
            <div className="mt-6 rounded-kip-sm border border-electric/20 bg-brand-50 p-4 text-sm text-navy">
              Check your inbox — we sent a sign-in link to{" "}
              <span className="font-medium">{email}</span>.
            </div>
          ) : (
            <>
              <button
                onClick={signInWithGoogle}
                className="kip-btn-secondary mt-6 w-full"
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-navy/10" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-navy/40">
                  or
                </span>
                <div className="h-px flex-1 bg-navy/10" />
              </div>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                  placeholder="you@example.com"
                  className="kip-input pl-10"
                  disabled={sending}
                />
              </div>

              {error && (
                <p className="mt-2 text-xs font-medium text-danger">{error}</p>
              )}

              <button
                onClick={handleEmail}
                disabled={sending || !email.trim()}
                className="kip-btn-primary mt-3 w-full"
              >
                {sending ? "Sending…" : "Send magic link"}
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-navy/40">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-navy">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-navy">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
