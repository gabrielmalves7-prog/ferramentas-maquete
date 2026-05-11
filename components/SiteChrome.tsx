import { Suspense } from "react";
import { HeaderNav } from "@/components/HeaderNav";

function NavFallback() {
  return (
    <nav className="tool-nav" aria-hidden>
      <span className="nav-tab" style={{ opacity: 0.4 }}>
        …
      </span>
    </nav>
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-bracket">[</span>
            xTool<span className="logo-accent">Suite</span>
            <span className="logo-bracket">]</span>
          </div>
          <Suspense fallback={<NavFallback />}>
            <HeaderNav />
          </Suspense>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="site-footer">
        <span>xTool Suite</span>
        <span className="footer-dot">·</span>
        <span>Ferramentas para laser</span>
      </footer>
    </>
  );
}
