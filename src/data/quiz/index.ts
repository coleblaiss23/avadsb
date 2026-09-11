import {
  QUIZ_CERTIFICATES,
  certificateById,
  FAA_ACS_URL,
  FAA_TESTING_MATRIX_URL,
  type QuizCertificateMeta,
} from "./certificates";
import { CAX_QUESTIONS, CAX_SECTIONS } from "./cax-quiz-bank";
import { CFI_QUESTIONS, CFI_SECTIONS } from "./cfi-quiz-bank";
import { IRA_QUESTIONS, IRA_SECTIONS } from "./ira-quiz-bank";
import {
  QUIZ_DISCLAIMER,
  type QuizBank,
  type QuizCertificateId,
  type QuizQuestion,
  type QuizSection,
} from "./types";
import {
  QUIZ_QUESTIONS as PRIVATE_QUESTIONS,
  QUIZ_SECTIONS as PRIVATE_SECTIONS,
} from "../ppl-quiz-bank";

export {
  QUIZ_CERTIFICATES,
  certificateById,
  FAA_ACS_URL,
  FAA_TESTING_MATRIX_URL,
  QUIZ_DISCLAIMER,
};
export type {
  QuizBank,
  QuizCertificateId,
  QuizCertificateMeta,
  QuizQuestion,
  QuizSection,
};

export const QUIZ_BANKS: Record<QuizCertificateId, QuizBank> = {
  private: {
    certificateId: "private",
    sections: PRIVATE_SECTIONS,
    questions: PRIVATE_QUESTIONS,
  },
  instrument: {
    certificateId: "instrument",
    sections: IRA_SECTIONS,
    questions: IRA_QUESTIONS,
  },
  commercial: {
    certificateId: "commercial",
    sections: CAX_SECTIONS,
    questions: CAX_QUESTIONS,
  },
  cfi: {
    certificateId: "cfi",
    sections: CFI_SECTIONS,
    questions: CFI_QUESTIONS,
  },
};

export function bankForCertificate(id: QuizCertificateId): QuizBank {
  return QUIZ_BANKS[id];
}

export function questionsForSection(
  certificateId: QuizCertificateId,
  sectionId: string | "all"
): QuizQuestion[] {
  const bank = QUIZ_BANKS[certificateId];
  if (sectionId === "all") return bank.questions;
  return bank.questions.filter((q) => q.section === sectionId);
}

export function totalQuestionCount(): number {
  return QUIZ_CERTIFICATES.reduce(
    (sum, c) => sum + QUIZ_BANKS[c.id].questions.length,
    0
  );
}
