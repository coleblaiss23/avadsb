/**
 * Original Flight Instructor (Airplane) + FOI practice — CFI track.
 *
 * Combines Fundamentals of Instructing (FOI) topics with Flight Instructor
 * Airplane (FIA) technical/instructional subjects from public FAA materials:
 * Aviation Instructor’s Handbook, 14 CFR Part 61, AC 61-65, and
 * Flight Instructor Airplane ACS (FAA-S-ACS-25).
 *
 * Official matrix: FOI = 50 questions; FIA = 100 questions (separate tests).
 * NOT official FAA test items; NOT from commercial banks.
 */

import type { QuizQuestion, QuizSection } from "./types";

export const CFI_SECTIONS: QuizSection[] = [
  {
    id: "foi",
    title: "Fundamentals of Instructing",
    short: "FOI",
    description: "Learning theory, human behavior, critique, and instructional design (FOI test).",
  },
  {
    id: "endorsements",
    title: "Endorsements & Privileges",
    short: "Endorse",
    description: "CFI privileges, limitations, and logbook endorsements (AC 61-65).",
  },
  {
    id: "technical",
    title: "Technical Subject Areas",
    short: "Technical",
    description: "Aerodynamics, systems, weather, and regs taught to students.",
  },
  {
    id: "teaching",
    title: "Teaching Maneuvers & Risk",
    short: "Teaching",
    description: "How to demonstrate, brief, and manage risk while instructing.",
  },
  {
    id: "regs",
    title: "Instructor Regulations",
    short: "Regs",
    description: "Part 61 instructor certificates, renewals, and student limitations.",
  },
  {
    id: "spin",
    title: "Spins & Unusual Attitudes",
    short: "Spins",
    description: "Spin awareness, training requirements, and recovery principles.",
  },
];

export const CFI_QUESTIONS: QuizQuestion[] = [
  // ─── FOI ───────────────────────────────────────────────────────────────────
  {
    id: "cfi-foi-01",
    section: "foi",
    question:
      "The laws of learning commonly taught in the Aviation Instructor’s Handbook include",
    options: [
      "Readiness, Exercise, Effect, Primacy, Intensity, and Recency (REEPIR)",
      "Only memorization without practice",
      "Punishment as the sole motivator",
    ],
    correctIndex: 0,
    explanation:
      "REEPIR summarizes classical laws of learning used in FOI material — ready to learn, practice, satisfying effects, first learning sticks, vivid experiences, and recent practice.",
    reference: "Aviation Instructor’s Handbook (AIH)",
  },
  {
    id: "cfi-foi-02",
    section: "foi",
    question:
      "The four levels of learning (ascending) are often listed as",
    options: [
      "Rote, understanding, application, and correlation",
      "Correlation, then rote only",
      "Application without understanding",
    ],
    correctIndex: 0,
    explanation:
      "Students progress from memorizing facts (rote) to understanding, applying skills, and correlating knowledge across situations.",
    reference: "Aviation Instructor’s Handbook",
  },
  {
    id: "cfi-foi-03",
    section: "foi",
    question:
      "Positive transfer of learning occurs when",
    options: [
      "Prior learning helps performance on a new task",
      "Prior learning always interferes with a new task",
      "No previous experience exists",
    ],
    correctIndex: 0,
    explanation:
      "Transfer can be positive (helps) or negative (interferes). Instructors should highlight similarities carefully and correct interference.",
    reference: "Aviation Instructor’s Handbook",
  },
  {
    id: "cfi-foi-04",
    section: "foi",
    question:
      "Defense mechanisms (e.g., rationalization, projection) matter to instructors because they",
    options: [
      "Can hide a student’s real learning difficulties or unsafe attitudes if unrecognized",
      "Always improve skill automatically",
      "Replace the need for lesson plans",
    ],
    correctIndex: 0,
    explanation:
      "Recognizing defense mechanisms helps instructors address underlying issues rather than surface excuses.",
    reference: "Aviation Instructor’s Handbook",
  },
  {
    id: "cfi-foi-05",
    section: "foi",
    question:
      "An effective critique should be",
    options: [
      "Objective, flexible, acceptable, comprehensive, constructive, organized, thoughtful, and specific (as taught in AIH)",
      "Only negative to motivate fear",
      "Delayed indefinitely after the lesson",
    ],
    correctIndex: 0,
    explanation:
      "Good critiques help the student improve. Deliver timely, specific, and constructive feedback tied to standards.",
    reference: "Aviation Instructor’s Handbook",
  },
  {
    id: "cfi-foi-06",
    section: "foi",
    question:
      "A lesson plan’s purpose is to",
    options: [
      "Provide an organized outline of objectives, content, schedule, and equipment so instruction is complete and consistent",
      "Replace the ACS entirely",
      "Avoid stating objectives",
    ],
    correctIndex: 0,
    explanation:
      "Lesson plans keep training systematic: objectives, elements, schedule, equipment, instructor’s actions, student’s actions, completion standards.",
    reference: "Aviation Instructor’s Handbook",
  },
  {
    id: "cfi-foi-07",
    section: "foi",
    question:
      "Guided discussion as a teaching method is most useful when",
    options: [
      "Students have enough background to exchange ideas toward instructional objectives",
      "Students know nothing about the topic",
      "Teaching only motor skills in the airplane",
    ],
    correctIndex: 0,
    explanation:
      "Guided discussion develops understanding through questions; demonstration-performance fits skills training.",
    reference: "Aviation Instructor’s Handbook",
  },
  {
    id: "cfi-foi-08",
    section: "foi",
    question:
      "The demonstration-performance method steps typically include",
    options: [
      "Explanation, demonstration, student performance with supervision, evaluation",
      "Evaluation before any explanation",
      "Student teaches first without demonstration",
    ],
    correctIndex: 0,
    explanation:
      "Tell → show → do (supervised) → evaluate. Especially effective for flight maneuvers.",
    reference: "Aviation Instructor’s Handbook",
  },

  // ─── Endorsements ──────────────────────────────────────────────────────────
  {
    id: "cfi-end-01",
    section: "endorsements",
    question:
      "Recommended endorsement wording for student solo, knowledge tests, flight reviews, etc. is published in",
    options: [
      "AC 61-65 (current revision) — Certification: Pilots and Flight and Ground Instructors",
      "Only the AIM",
      "Part 43 exclusively",
    ],
    correctIndex: 0,
    explanation:
      "Use the current AC 61-65 sample endorsements. Endorsements must meet Part 61 content even if wording varies slightly.",
    reference: "AC 61-65; 14 CFR Part 61",
  },
  {
    id: "cfi-end-02",
    section: "endorsements",
    question:
      "Before a student pilot’s first solo flight, the instructor must endorse (among other requirements)",
    options: [
      "The student pilot certificate and logbook for presolo aeronautical knowledge and presolo flight training on the make/model",
      "Only a verbal OK with no logbook entry",
      "An ATP certificate",
    ],
    correctIndex: 0,
    explanation:
      "61.87 requires specific training and endorsements before solo. Follow AC 61-65 examples for certificate and logbook.",
    reference: "14 CFR 61.87; AC 61-65",
  },
  {
    id: "cfi-end-03",
    section: "endorsements",
    question:
      "A flight review under 61.56 requires",
    options: [
      "At least 1 hour of ground training and 1 hour of flight training (minimums) covering Part 91 review and maneuvers, with logbook endorsement",
      "Only a written quiz with no flight",
      "Three hours of instrument time only",
    ],
    correctIndex: 0,
    explanation:
      "Flight review: minimum 1 hour ground + 1 hour flight (unless substituted by certain practical tests/checks as allowed). Endorse satisfactorily completed.",
    reference: "14 CFR 61.56",
  },
  {
    id: "cfi-end-04",
    section: "endorsements",
    question:
      "To endorse a pilot for a knowledge test, the instructor must determine",
    options: [
      "The applicant completed the required ground instruction / home-study and is prepared to pass the test",
      "Only that the applicant paid for the course",
      "That the applicant already holds ATP",
    ],
    correctIndex: 0,
    explanation:
      "Part 61 knowledge-test endorsements require the instructor’s determination of preparedness after appropriate training.",
    reference: "14 CFR 61.35; 61.65; 61.103; AC 61-65; FAA Testing Matrix",
  },
  {
    id: "cfi-end-05",
    section: "endorsements",
    question:
      "CFI privileges under 14 CFR 61.193 include",
    options: [
      "Giving training and endorsements appropriate to the instructor ratings held, subject to limitations in 61.195",
      "Acting as PIC of any airliner without a type rating",
      "Issuing medical certificates",
    ],
    correctIndex: 0,
    explanation:
      "61.193 lists privileges; 61.195 lists limitations (e.g., ratings held, recent experience, and category/class).",
    reference: "14 CFR 61.193; 61.195",
  },
  {
    id: "cfi-end-06",
    section: "endorsements",
    question:
      "An instrument proficiency check (IPC) endorsement / logbook record is completed when",
    options: [
      "An authorized instructor or examiner finds the pilot proficient to Instrument Rating ACS standards for the tasks required",
      "The pilot flies one approach alone without evaluation",
      "Only ATC radar contact is achieved",
    ],
    correctIndex: 0,
    explanation:
      "IPCs restore IFR PIC privileges after currency lapses. Document per 61.57(d) and ACS tasks.",
    reference: "14 CFR 61.57(d); Instrument ACS",
  },

  // ─── Technical ─────────────────────────────────────────────────────────────
  {
    id: "cfi-tech-01",
    section: "technical",
    question:
      "When teaching angle of attack, emphasize that an airplane can stall",
    options: [
      "At any airspeed / attitude if critical AOA is exceeded",
      "Only at published Vs in level flight",
      "Only with power off",
    ],
    correctIndex: 0,
    explanation:
      "Critical AOA is constant for a given configuration; stall speed changes with weight, G load, and bank. Teach AOA awareness.",
    reference: "PHAK Ch. 5; Airplane Flying Handbook",
  },
  {
    id: "cfi-tech-02",
    section: "technical",
    question:
      "Left-turning tendencies (American engines) at high power / low airspeed include",
    options: [
      "Torque, gyroscopic precession (on tailwheel rotation), P-factor, and slipstream effect",
      "Only magnetic variation",
      "Right-turning forces exclusively",
    ],
    correctIndex: 0,
    explanation:
      "Students must anticipate left yaw on takeoff/climb — teach proper right rudder and explain each factor.",
    reference: "PHAK Ch. 5",
  },
  {
    id: "cfi-tech-03",
    section: "technical",
    question:
      "Density altitude teaching points should include that high DA",
    options: [
      "Reduces performance — longer takeoff, reduced climb, higher TAS for given IAS",
      "Increases climb performance",
      "Has no effect on propeller efficiency",
    ],
    correctIndex: 0,
    explanation:
      "Walk students through DA calculation and AFM charts before mountain/hot-day flights.",
    reference: "PHAK Ch. 11",
  },
  {
    id: "cfi-tech-04",
    section: "technical",
    question:
      "For weight and balance instruction, students must understand",
    options: [
      "CG limits, how loading shifts CG, and that an out-of-limit CG can make the airplane unsafe or uncontrollable",
      "That aft CG is always desirable",
      "That W&B only matters for jets",
    ],
    correctIndex: 0,
    explanation:
      "Require students to compute W&B before dual XC and solos as appropriate; verify method matches AFM.",
    reference: "PHAK Ch. 10; AFM/POH",
  },
  {
    id: "cfi-tech-05",
    section: "technical",
    question:
      "When teaching pitot-static errors, a blocked pitot (drain blocked) typically makes the ASI",
    options: [
      "Behave like an altimeter — read higher in climbs and lower in descents",
      "Read correctly at all times",
      "Affect only the heading indicator",
    ],
    correctIndex: 0,
    explanation:
      "Use this classic failure mode when teaching instrument/system abnormal procedures.",
    reference: "PHAK Ch. 8; Instrument Flying Handbook",
  },
  {
    id: "cfi-tech-06",
    section: "technical",
    question:
      "VFR weather-minimum instruction for Class E below 10,000 MSL typically includes",
    options: [
      "3 SM visibility and 500 below / 1,000 above / 2,000 horizontal cloud clearance",
      "1 SM and clear of clouds only (that is Class G day below 1,200 AGL in many areas)",
      "No visibility requirement",
    ],
    correctIndex: 0,
    explanation:
      "Teach airspace-specific minima from 91.155; don’t conflate Class G day with Class E.",
    reference: "14 CFR 91.155",
  },

  // ─── Teaching ──────────────────────────────────────────────────────────────
  {
    id: "cfi-teach-01",
    section: "teaching",
    question:
      "Before a dual instructional flight, a thorough preflight briefing should cover",
    options: [
      "Objectives, maneuvers, completion standards, risk hazards, and student/instructor responsibilities",
      "Only the destination restaurant",
      "No mention of standards",
    ],
    correctIndex: 0,
    explanation:
      "Briefings set expectations and manage risk. Debrief against ACS/PTS standards afterward.",
    reference: "Aviation Instructor’s Handbook; CFI ACS",
  },
  {
    id: "cfi-teach-02",
    section: "teaching",
    question:
      "During student practice of a maneuver, the instructor should",
    options: [
      "Allow appropriate practice while maintaining vigilance for safety and providing timely coaching",
      "Never allow the student to touch the controls",
      "Withhold all feedback until the checkride",
    ],
    correctIndex: 0,
    explanation:
      "Balance positive transfer and safety. Take controls early enough to prevent an accident, but don’t over-control learning.",
    reference: "Aviation Instructor’s Handbook",
  },
  {
    id: "cfi-teach-03",
    section: "teaching",
    question:
      "Risk management while instructing includes",
    options: [
      "PAVE / CARE / TEAM-type tools, personal minimums, and declining or modifying lessons when risk is unacceptable",
      "Ignoring wind limits to “build toughness”",
      "Skipping checklists to save time",
    ],
    correctIndex: 0,
    explanation:
      "Instructors model ADM. Set and enforce instructional risk limits.",
    reference: "PHAK Ch. 2; AIH; CFI ACS",
  },
  {
    id: "cfi-teach-04",
    section: "teaching",
    question:
      "Collision avoidance teaching should emphasize",
    options: [
      "See-and-avoid, clearing turns before maneuvers, traffic pattern discipline, and proper scan",
      "Relying solely on ADS-B without visual scan",
      "Never using landing lights",
    ],
    correctIndex: 0,
    explanation:
      "Clearing turns and continuous traffic scan are non-negotiable instructional habits.",
    reference: "AIM 4-4-15; Airplane Flying Handbook",
  },
  {
    id: "cfi-teach-05",
    section: "teaching",
    question:
      "When a student becomes overloaded or behind the airplane, the instructor should",
    options: [
      "Simplify the task, take control if needed, and rebuild from a successful standard",
      "Add more new maneuvers immediately",
      "Criticize without changing workload",
    ],
    correctIndex: 0,
    explanation:
      "Manage workload and emotional tone. Return to known skills, then rebuild complexity.",
    reference: "Aviation Instructor’s Handbook",
  },
  {
    id: "cfi-teach-06",
    section: "teaching",
    question:
      "Scenario-based training is valuable because it",
    options: [
      "Develops judgment by placing skills in realistic decision-making contexts",
      "Eliminates the need to teach basic stick-and-rudder skills",
      "Replaces all maneuvers practice",
    ],
    correctIndex: 0,
    explanation:
      "SBT builds correlation-level learning; still teach fundamentals to ACS standards.",
    reference: "Aviation Instructor’s Handbook; ACS",
  },

  // ─── Regs ──────────────────────────────────────────────────────────────────
  {
    id: "cfi-regs-01",
    section: "regs",
    question:
      "A flight instructor certificate expires",
    options: [
      "At the end of the 24th calendar month after the month of issuance/renewal if not renewed or reinstated as provided in Part 61",
      "Never",
      "Every 6 calendar months automatically without action",
    ],
    correctIndex: 0,
    explanation:
      "CFI certificates have a 24-calendar-month expiration and must be renewed under 61.197 or reinstated under 61.199.",
    reference: "14 CFR 61.19; 61.197; 61.199",
  },
  {
    id: "cfi-regs-02",
    section: "regs",
    question:
      "To give instrument instruction for an instrument rating, a CFI generally needs",
    options: [
      "An instrument rating on their pilot certificate and instrument-airplane instructor privileges (CFII) as applicable",
      "Only a private pilot certificate with no instrument rating",
      "An FAA medical examiner certificate",
    ],
    correctIndex: 0,
    explanation:
      "Instrument instruction requires appropriate instructor instrument rating privileges (see 61.195). FOI/FIA alone are not enough for instrument instruction.",
    reference: "14 CFR 61.195; 61.183",
  },
  {
    id: "cfi-regs-03",
    section: "regs",
    question:
      "Student pilots may not act as PIC of an aircraft",
    options: [
      "Carrying passengers or property for compensation/hire, or in furtherance of a business — among other 61.89 limitations",
      "On any solo flight ever",
      "In Class D with endorsements",
    ],
    correctIndex: 0,
    explanation:
      "61.89 lists student limitations: no passengers, no hire, international limits, etc. Instructors must enforce these.",
    reference: "14 CFR 61.89",
  },
  {
    id: "cfi-regs-04",
    section: "regs",
    question:
      "According to the FAA Knowledge Testing Matrix, the Flight Instructor Airplane (FIA) knowledge test has",
    options: [
      "100 questions, minimum age 16, 2.5 hours allotted, passing score 70",
      "60 questions, age 14, 1.0 hours, passing score 50",
      "125 questions, age 18, 3.5 hours only",
    ],
    correctIndex: 0,
    explanation:
      "Per FAA Airman Knowledge Testing Matrix: FIA = 100 Q, age 16, 2.5 hr, pass 70. FOI = 50 Q, 1.5 hr, pass 70.",
    reference: "FAA Airman Knowledge Testing Matrix",
  },
  {
    id: "cfi-regs-05",
    section: "regs",
    question:
      "Fundamentals of Instructing (FOI) knowledge test is generally not required if",
    options: [
      "The applicant already holds a flight or ground instructor certificate, or a teacher’s certificate meeting 61.183 exceptions",
      "The applicant wants to skip learning theory for convenience only without meeting an exception",
      "The applicant holds only a student pilot certificate",
    ],
    correctIndex: 0,
    explanation:
      "61.183 provides FOI exemptions for certain existing instructor/teacher credentials. Otherwise FOI is required for the first instructor certificate.",
    reference: "14 CFR 61.183; FAA Testing Matrix",
  },
  {
    id: "cfi-regs-06",
    section: "regs",
    question:
      "Night instruction for student solo at night requires",
    options: [
      "Specific night training and endorsements under 61.87 before night solo",
      "No extra training beyond day solo",
      "Only a flashlight with no dual night flights",
    ],
    correctIndex: 0,
    explanation:
      "Night solo has additional 61.87 training/endorsement requirements. Don’t authorize night solo without them.",
    reference: "14 CFR 61.87",
  },

  // ─── Spins ─────────────────────────────────────────────────────────────────
  {
    id: "cfi-spin-01",
    section: "spin",
    question:
      "Spin training for a flight instructor airplane applicant is required because",
    options: [
      "Instructors must have spin entry, spins, and spin recovery training in an aircraft or FSTD as specified in 61.183",
      "Spins are optional entertainment",
      "Only ATP applicants need spin training",
    ],
    correctIndex: 0,
    explanation:
      "61.183 requires spin training for airplane/glider instructor applicants (with logged endorsement of proficiency).",
    reference: "14 CFR 61.183(i)",
  },
  {
    id: "cfi-spin-02",
    section: "spin",
    question:
      "A spin is",
    options: [
      "An aggravated stall resulting in autorotation — one wing more stalled than the other",
      "A steep spiral with both wings flying and high airspeed",
      "A coordinated steep turn",
    ],
    correctIndex: 0,
    explanation:
      "Distinguish spins (stalled autorotation) from steep spirals (not stalled, airspeed increasing). Teach recognition early.",
    reference: "Airplane Flying Handbook; PHAK",
  },
  {
    id: "cfi-spin-03",
    section: "spin",
    question:
      "P.A.R.E. spin recovery (commonly taught) stands for",
    options: [
      "Power idle, Ailerons neutral, Rudder opposite yaw, Elevator through neutral to break stall (then recover dive) — follow AFM if different",
      "Power full, Ailerons full into spin, Rudder with spin, Elevator full aft always",
      "Only ailerons to roll out",
    ],
    correctIndex: 0,
    explanation:
      "Use the airplane’s AFM/POH spin recovery if published. PARE is a common training mnemonic for many light airplanes.",
    reference: "Airplane Flying Handbook; AFM/POH",
  },
  {
    id: "cfi-spin-04",
    section: "spin",
    question:
      "Incipient spin recognition training emphasizes",
    options: [
      "Immediate reduction of AOA and stopping yaw at the first indication — before a developed spin",
      "Waiting until several turns develop before acting",
      "Adding aileron into a stalled wing drop aggressively as first action always",
    ],
    correctIndex: 0,
    explanation:
      "Teach early recognition: stall warning, buffet, yaw. Reduce AOA and coordinate — prevent the developed spin.",
    reference: "Airplane Flying Handbook; ACS spin awareness",
  },
  {
    id: "cfi-spin-05",
    section: "spin",
    question:
      "A steep spiral differs from a spin in that during a steep spiral",
    options: [
      "The wings are not stalled; airspeed and load factor may increase rapidly if not recovered",
      "The wings are fully stalled and airspeed is near stall",
      "There is no altitude loss",
    ],
    correctIndex: 0,
    explanation:
      "Steep spiral: high airspeed risk and overstress. Spin: low airspeed, stalled. Recovery techniques differ — teach both.",
    reference: "Airplane Flying Handbook",
  },
  {
    id: "cfi-spin-06",
    section: "spin",
    question:
      "Cross-control (skidding) stalls in the traffic pattern are hazardous because they can",
    options: [
      "Lead to a spin entry at low altitude with little room to recover",
      "Always improve coordination",
      "Only occur above 10,000 feet",
    ],
    correctIndex: 0,
    explanation:
      "Base-to-final skidding stalls are classic accident scenarios. Teach coordinated turns and go-arounds instead of uncoordinated overshoots.",
    reference: "Airplane Flying Handbook; ACS",
  },
];
