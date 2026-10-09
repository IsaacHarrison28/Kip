export function Footer() {
  return (
    <footer className="border-t border-navy/10 bg-white">
      <div className="flex flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-navy/50 sm:flex-row">
        <p>© {new Date().getFullYear()} SateOnline. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="hover:text-navy">
            Privacy
          </a>
          <a href="/terms" className="hover:text-navy">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
