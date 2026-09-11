"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { VISIBLE_TOOL_NAV } from "@/lib/tools-nav";
import { cn } from "@/lib/utils";

type AppNavProps = {
  /** Compact bar for radar home; fuller links on tool pages. */
  variant?: "radar" | "tools";
  rightSlot?: ReactNode;
};

export function AppNav({ variant = "tools", rightSlot }: AppNavProps) {
  const pathname = usePathname();
  void variant;

  const linkBase =
    "shrink-0 border-b-2 border-transparent px-2.5 py-1.5 text-[13px] font-medium transition";
  const linkIdle = "text-slate-400 hover:text-slate-100";
  const linkActive =
    "border-[var(--scope-cyan)] text-[var(--scope-cyan)]";

  return (
    <header className="border-b border-[var(--ink-border)] bg-[var(--ink)]">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2">
        <Logo />
        <nav
          aria-label="Flight tools"
          className="ml-2 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex"
        >
          <Link
            href="/"
            className={cn(
              linkBase,
              pathname === "/" ? linkActive : linkIdle
            )}
          >
            Radar
          </Link>
          {VISIBLE_TOOL_NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(linkBase, active ? linkActive : linkIdle)}
              >
                {item.short}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {rightSlot}
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-t border-[var(--ink-border)] px-3 py-1.5 md:hidden">
        <Link
          href="/"
          className={cn(
            "shrink-0 px-2 py-1 text-xs font-medium",
            pathname === "/"
              ? "text-[var(--scope-cyan)]"
              : "text-slate-500"
          )}
        >
          Radar
        </Link>
        {VISIBLE_TOOL_NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "shrink-0 px-2 py-1 text-xs font-medium",
                active ? "text-[var(--scope-cyan)]" : "text-slate-500"
              )}
            >
              {item.short}
            </Link>
          );
        })}
      </div>
    </header>
  );
}