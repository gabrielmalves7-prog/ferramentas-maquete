"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/escala", label: "Escala" },
  { href: "/xtool", label: "Planejador xTool" },
] as const;

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="tool-nav" aria-label="Ferramentas">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={"nav-tab" + (active ? " active" : "")}
            prefetch
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
