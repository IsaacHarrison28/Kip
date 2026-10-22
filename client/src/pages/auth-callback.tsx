import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { KipLoader } from "@/components/kip-loader";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses the URL fragment automatically via detectSessionInUrl
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <KipLoader />
    </div>
  );
}
