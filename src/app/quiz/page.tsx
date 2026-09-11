import type { Metadata } from "next";
import { ToolPageShell } from "@/components/layout/ToolPageShell";
import { FaaQuiz } from "@/components/ui/FaaQuiz";
import { QUIZ_QUESTIONS, QUIZ_SECTIONS } from "@/data/ppl-quiz-bank";

export const metadata: Metadata = {
  title: "FAA Ground School Quiz",
  description:
    "Original Private Pilot knowledge practice across nine ACS-aligned sections — regulations, airspace, weather, aerodynamics, systems, airports, navigation, aeromedical, and night/emergencies. Not official FAA test questions.",
};

export default function QuizPage() {
  return (
    <ToolPageShell
      eyebrow="Ground school"
      title="PPL Knowledge Practice"
      description={`${QUIZ_QUESTIONS.length} original questions in ${QUIZ_SECTIONS.length} sections, written from public 14 CFR / AIM / handbook material — not copied from commercial FAA test banks. Study aid only; verify against current regs and your instructor.`}
      width="wide"
    >
      <FaaQuiz variant="page" />
    </ToolPageShell>
  );
}
