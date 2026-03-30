"use client";

import { getColors } from "@/component/general/(Color Manager)/useColors";
import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
  { href: "/listed-courses", label: "COURSE" },
  { href: "/contact", label: "CONTACT" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const Colors = getColors();

  return (
    <header className="sticky top-0 z-50 px-4 pt-5 pb-2 sm:px-6">
      <div className="mx-auto max-w-[75%] min-w-[320px] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl">
        <div className="flex h-14 items-center justify-between rounded-3xl border border-neutral-700 bg-neutral-900 px-4 shadow-sm sm:px-5">
          <Link
            href="/"
            className="flex shrink-0 items-center justify-center text-white hover:opacity-80 cursor-pointer font-bold"
            aria-label="Home"
          >
            <span className={`${Colors.text.special}`}>B</span>{" "}
            <span>itwise Learn</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-wide text-white hover:opacity-80"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <Link
              href="/student-login"
              className="hidden text-sm font-medium text-white hover:opacity-80 sm:inline-block"
            >
              LOGIN
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded p-2 text-neutral-400 md:hidden"
              aria-label="Menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="rounded-b-3xl border border-t-0 border-neutral-700 bg-neutral-900 md:hidden">
          <nav className="flex flex-col gap-2 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 text-neutral-400 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/student-login"
              className="py-2 text-neutral-400 hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              LOGIN
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}


