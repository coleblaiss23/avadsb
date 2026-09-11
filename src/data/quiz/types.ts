/**
 * Shared quiz types for certificate-track practice banks.
 *
 * Questions are ORIGINAL study aids grounded in public FAA materials
 * (14 CFR, AIM, handbooks, ACS topic lists). They are NOT official FAA
 * Airman Knowledge Test items and are NOT copied from commercial banks.
 */

export type QuizCertificateId =
  | "private"
  | "instrument"
  | "commercial"
  | "cfi";

export type QuizQuestion = {
  id: string;
  section: string;
  question: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
  /** Public reference for study (CFR / AIM / handbook / ACS). */
  reference: string;
};

export type QuizSection = {
  id: string;
  title: string;
  short: string;
  description: string;
};

export type QuizBank = {
  certificateId: QuizCertificateId;
  sections: QuizSection[];
  questions: QuizQuestion[];
};

export const QUIZ_DISCLAIMER =
  "Practice only — original questions based on public FAA regulations and handbooks. Not official FAA knowledge-test items. Not affiliated with or endorsed by the FAA. Always verify against current 14 CFR, AIM, ACS, and your instructor. Official test codes/times come from the FAA Airman Knowledge Testing Matrix.";
