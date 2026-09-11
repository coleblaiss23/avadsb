import type { ReactNode } from "react";
import { AppNav } from "@/components/layout/AppNav";
import { cn } from "@/lib/utils";

type ToolPageShellProps = {
  title: string;
  /** @deprecated Ignored — hierarchy uses title weight, not eyebrows. */
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  /** Narrow reading width vs wide workspace. */
  width?: "narrow" | "wide" | "full";
  rightSlot?: ReactNode;
  className?: string;
};

/**
 * Shared chrome for dedicated tool pages — ink panel header, instrument
 * atmosphere, and a single content composition.
 */
export function ToolPageShell({
  title,
  description,
  children,
  width = "wide",
  rightSlot,
  className,
}: ToolPageShellProps) {
  const max =
    width === "narrow"
      ? "max-w-2xl"
      : width === "full"
        ? "max-w-[1600px]"
        : "max-w-5xl";

  return (
    <div className="night-ui tool-atmosphere flex min-h-0 flex-1 flex-col">
      <AppNav rightSlot={rightSlot} />
      <main className={cn("relative flex-1 px-4 py-8 sm:py-10", className)}>
        <div className={cn("mx-auto", max)}>
          <header className="mb-8 max-w-2xl">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {description}
              </p>
            ) : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
