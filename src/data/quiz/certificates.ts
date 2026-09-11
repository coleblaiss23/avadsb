/**
 * Airplane knowledge-test tracks shown in the quiz UI.
 *
 * Official codes, question counts, ages, times, and passing scores are from the
 * FAA Airman Knowledge Testing Matrix:
 * https://www.faa.gov/training_testing/testing/testing_matrix
 *
 * ACS document numbers (effective May 31, 2024 per FAA ACS page):
 * https://www.faa.gov/training_testing/testing/acs
 */

import type { QuizCertificateId } from "./types";

export type QuizCertificateMeta = {
  id: QuizCertificateId;
  /** Short chip label */
  short: string;
  /** UI title */
  title: string;
  /** FAA knowledge-test code (airplane category) */
  testCode: string;
  /** Official test name from the FAA matrix */
  testName: string;
  /** Number of questions on the official FAA knowledge test */
  officialQuestions: number;
  /** Minimum eligibility age (years) from the FAA matrix */
  minAge: number;
  /** Allotted time in hours from the FAA matrix */
  allottedHours: number;
  /** Minimum passing score (%) — all listed tests use 70 */
  passingScore: number;
  /** Primary ACS / knowledge reference */
  acs: string;
  /** Related knowledge tests the applicant often also takes */
  relatedTests?: string;
  description: string;
};

/**
 * Common Part 61 airplane knowledge tracks (U.S.).
 * Values verified against the FAA Airman Knowledge Testing Matrix page content.
 */
export const QUIZ_CERTIFICATES: QuizCertificateMeta[] = [
  {
    id: "private",
    short: "Private",
    title: "Private Pilot",
    testCode: "PAR",
    testName: "Private Pilot Airplane",
    officialQuestions: 60,
    minAge: 15,
    allottedHours: 2.0,
    passingScore: 70,
    acs: "FAA-S-ACS-6C (Private Pilot Airplane)",
    description:
      "Airplane private pilot knowledge (PAR). Covers regs, airspace, weather, aero, systems, airports, nav, human factors, and night/emergencies.",
  },
  {
    id: "instrument",
    short: "Instrument",
    title: "Instrument Rating",
    testCode: "IRA",
    testName: "Instrument Rating Airplane",
    officialQuestions: 60,
    minAge: 15,
    allottedHours: 2.0,
    passingScore: 70,
    acs: "FAA-S-ACS-8C (Instrument Rating – Airplane)",
    description:
      "Airplane instrument rating knowledge (IRA). IFR regs, instruments, clearances/holding, navigation, approaches, weather, and IFR emergencies.",
  },
  {
    id: "commercial",
    short: "Commercial",
    title: "Commercial Pilot",
    testCode: "CAX",
    testName: "Commercial Pilot Airplane",
    officialQuestions: 100,
    minAge: 16,
    allottedHours: 2.5,
    passingScore: 70,
    acs: "FAA-S-ACS-7B (Commercial Pilot Airplane)",
    description:
      "Airplane commercial pilot knowledge (CAX). Commercial privileges, performance, complex systems, commercial maneuvers theory, weather, and ADM.",
  },
  {
    id: "cfi",
    short: "CFI",
    title: "Flight Instructor",
    testCode: "FIA",
    testName: "Flight Instructor Airplane",
    officialQuestions: 100,
    minAge: 16,
    allottedHours: 2.5,
    passingScore: 70,
    acs: "FAA-S-ACS-25 (Flight Instructor Airplane)",
    relatedTests:
      "Most CFI applicants also take FOI (Fundamentals of Instructing): 50 questions, age 16, 1.5 hours, pass 70. Instrument instructors take FII (50 questions).",
    description:
      "Airplane flight instructor knowledge (FIA) plus FOI teaching fundamentals. Instructional design, endorsements, technical subjects, and teaching maneuvers.",
  },
];

export const FAA_TESTING_MATRIX_URL =
  "https://www.faa.gov/training_testing/testing/testing_matrix";

export const FAA_ACS_URL =
  "https://www.faa.gov/training_testing/testing/acs";

export function certificateById(
  id: QuizCertificateId
): QuizCertificateMeta | undefined {
  return QUIZ_CERTIFICATES.find((c) => c.id === id);
}
