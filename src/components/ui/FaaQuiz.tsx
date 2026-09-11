"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  QUIZ_DISCLAIMER,
  QUIZ_QUESTIONS,
  QUIZ_SECTIONS,
  questionsForSection,
  type QuizQuestion,
  type QuizSectionId,
} from "@/data/ppl-quiz-bank";
import { cn } from "@/lib/utils";

type SectionFilter = QuizSectionId | "all";

type FaaQuizProps = {
  variant?: "panel" | "page";
  className?: string;
};

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Private Pilot knowledge practice — original bank by ACS-aligned sections.
 */
export function FaaQuiz({ variant = "page", className }: FaaQuizProps) {
  const [section, setSection] = useState<SectionFilter>("all");
  const [deck, setDeck] = useState<QuizQuestion[]>(() =>
    shuffle(QUIZ_QUESTIONS)
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [explainOpen, setExplainOpen] = useState(false);

  const q = deck[index] ?? deck[0];
  const locked = selected != null;
  const isCorrect = selected === q?.correctIndex;

  const scoreLabel = useMemo(() => {
    if (answered === 0) return "0 / 0";
    const pct = Math.round((correctCount / answered) * 100);
    return `${correctCount} / ${answered} (${pct}%)`;
  }, [answered, correctCount]);

  const sectionMeta = QUIZ_SECTIONS.find((s) => s.id === section);

  function loadSection(next: SectionFilter) {
    setSection(next);
    setDeck(shuffle(questionsForSection(next)));
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setAnswered(0);
    setExplainOpen(false);
  }

  function reshuffle() {
    setDeck(shuffle(questionsForSection(section)));
    setIndex(0);
    setSelected(null);
    setExplainOpen(false);
  }

  function choose(optionIndex: number) {
    if (locked || !q) return;
    setSelected(optionIndex);
    setAnswered((n) => n + 1);
    if (optionIndex === q.correctIndex) setCorrectCount((n) => n + 1);
    setExplainOpen(true);
  }

  function next() {
    if (!deck.length) return;
    setSelected(null);
    setExplainOpen(false);
    setIndex((i) => (i + 1) % deck.length);
  }

  const page = variant === "page";

  if (!q) {
    return (
      <p className="text-sm text-slate-400">No questions in this section.</p>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      <p className="rounded-lg border border-[var(--ink-border)] bg-[var(--ink-elevated)]/80 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
        {QUIZ_DISCLAIMER}
      </p>

      <div className="flex flex-wrap gap-1.5">
        <SectionChip
          active={section === "all"}
          onClick={() => loadSection("all")}
          label={`All (${QUIZ_QUESTIONS.length})`}
        />
        {QUIZ_SECTIONS.map((s) => {
          const count = QUIZ_QUESTIONS.filter((x) => x.section === s.id).length;
          return (
            <SectionChip
              key={s.id}
              active={section === s.id}
              onClick={() => loadSection(s.id)}
              label={`${s.short} (${count})`}
            />
          );
        })}
      </div>

      {section !== "all" && sectionMeta ? (
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-300">{sectionMeta.title}</span>
          {" — "}
          {sectionMeta.description}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Mixed deck across all nine ACS-aligned knowledge sections. Shuffle
          anytime.
        </p>
      )}

      <div
        className={cn(
          "space-y-4",
          page && "instrument-panel p-5 sm:p-6"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono tabular-nums text-[var(--scope-cyan)]">
            Q {index + 1} / {deck.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono tabular-nums text-slate-400">
              Score {scoreLabel}
            </span>
            <button
              type="button"
              onClick={reshuffle}
              className="inline-flex items-center gap-1 text-slate-500 transition hover:text-slate-200"
              title="Shuffle deck"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Shuffle
            </button>
          </div>
        </div>

        <p className="text-base font-medium leading-relaxed text-slate-100">
          {q.question}
        </p>

        <ul className="space-y-2">
          {q.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            let state: "idle" | "correct" | "wrong" | "missed" = "idle";
            if (locked) {
              if (i === q.correctIndex) state = "correct";
              else if (i === selected) state = "wrong";
              else state = "missed";
            }
            return (
              <li key={`${q.id}-${i}`}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-xl border px-3 py-3 text-left text-sm transition",
                    state === "idle" &&
                      "border-[var(--ink-border)] bg-[var(--ink-elevated)] text-slate-200 hover:border-[var(--scope-cyan)]/35 hover:bg-[#1a2028]",
                    state === "correct" &&
                      "border-emerald-500/50 bg-emerald-950/45 text-emerald-100",
                    state === "wrong" &&
                      "border-red-500/50 bg-red-950/35 text-red-100",
                    state === "missed" &&
                      "border-[var(--ink-border)] bg-[#0a0d13] text-slate-600"
                  )}
                >
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {letter}.
                  </span>
                  <span className="flex-1">{opt}</span>
                  {state === "correct" && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                  {state === "wrong" && (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {locked && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-[var(--ink-border)] bg-transparent text-slate-200 hover:bg-[var(--ink-elevated)]"
              onClick={() => setExplainOpen(true)}
            >
              Explanation
            </Button>
            <Button
              type="button"
              onClick={next}
              className="bg-[var(--accent)] hover:bg-emerald-700"
            >
              Next Question
            </Button>
          </div>
        )}
      </div>

      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent className="max-w-md border-[var(--ink-border)] bg-[var(--ink)] text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Correct
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-400" />
                  Incorrect
                </>
              )}
            </DialogTitle>
            <DialogDescription className="space-y-2 text-left text-sm text-slate-400">
              <span className="block">{q.explanation}</span>
              <span className="block font-mono text-[11px] text-[var(--scope-cyan)]">
                Ref: {q.reference}
              </span>
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            onClick={next}
            className="w-full bg-[var(--accent)] hover:bg-emerald-700"
          >
            Next Question
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-sm border px-2.5 py-1 text-[10px] font-semibold transition",
        active
          ? "border-[var(--scope-cyan)]/50 bg-[var(--scope-cyan)]/10 text-[var(--scope-cyan)]"
          : "border-[var(--ink-border)] bg-[var(--ink)] text-slate-500 hover:border-slate-600 hover:text-slate-300"
      )}
    >
      {label}
    </button>
  );
}
