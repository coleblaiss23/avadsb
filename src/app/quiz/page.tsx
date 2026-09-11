import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { QUIZ_CERTIFICATES } from "@/data/quiz/certificates";

const FaaQuiz = dynamic(
  () =>
    import("@/components/ui/FaaQuiz").then((m) => ({ default: m.FaaQuiz })),
  {
    loading: () => (
      <div className="instrument-panel p-6 text-sm text-slate-500">
        Loading quiz…
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "FAA Ground School Quiz",
  description:
    "Original knowledge practice for Private (PAR), Instrument (IRA), Commercial (CAX), and CFI/FOI — toggle by certificate. ACS-aligned sections from public 14 CFR / AIM / handbook material. Not official FAA test questions.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  const tracks = QUIZ_CERTIFICATES.map((c) => c.short).join(", ");

  return (
    <ToolPageShell
      eyebrow="Ground school"
      title="FAA Knowledge Practice"
      description={`Original questions across ${QUIZ_CERTIFICATES.length} certificate tracks (${tracks}). Toggle the rating you’re studying for, then filter by knowledge section. Written from public 14 CFR / AIM / handbook / ACS material — not copied from commercial FAA test banks. Official test codes and times from the FAA Knowledge Testing Matrix. Study aid only; verify against current regs and your instructor.`}
      width="wide"
    >
      <FaaQuiz variant="page" />
    </ToolPageShell>
  );
}
