import { launchNotices } from "@/lib/launch-config";

const logged = new Set<string>();

/** Dev-only. Production builds render nothing, even if credentials are missing. */
export function DemoDataBanner() {
  if (process.env.NODE_ENV === "production") return null;
  const notices = launchNotices();
  if (notices.length === 0) return null;

  for (const notice of notices) {
    if (logged.has(notice.headline)) continue;
    logged.add(notice.headline);
    const line = `[avadsb] ${notice.headline} ${notice.body}`;
    if (notice.consoleLevel === "info") console.info(line);
    else console.warn(line);
  }

  return (
    <div className="flex flex-col">
      {notices.map((notice) => (
        <div
          key={notice.headline}
          role="status"
          className={
            notice.tone === "status"
              ? "border-b border-sky-500/40 bg-sky-950 px-4 py-2 text-center text-xs leading-relaxed text-sky-100"
              : "border-b border-amber-500/40 bg-amber-950 px-4 py-2 text-center text-xs leading-relaxed text-amber-100"
          }
        >
          <strong className="font-semibold">{notice.headline}</strong> {notice.body}
        </div>
      ))}
    </div>
  );
}
