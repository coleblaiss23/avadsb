/**
 * Original Instrument Rating (Airplane) practice — IRA track.
 *
 * Grounded in 14 CFR, AIM, Instrument Flying Handbook, and
 * Instrument Rating – Airplane ACS (FAA-S-ACS-8C) topic areas.
 * NOT official FAA test items; NOT from commercial banks.
 */

import type { QuizQuestion, QuizSection } from "./types";

export const IRA_SECTIONS: QuizSection[] = [
  {
    id: "ifr-regs",
    title: "IFR Regulations & Currency",
    short: "IFR Regs",
    description: "Part 61/91 IFR privileges, currency, fuel, and alternate rules.",
  },
  {
    id: "instruments",
    title: "Flight Instruments & Systems",
    short: "Instruments",
    description: "Pitot-static, gyros, failure modes, and IFR required equipment.",
  },
  {
    id: "clearance",
    title: "Clearances, Holding & Lost Comms",
    short: "ATC",
    description: "IFR clearances, holding procedures, and lost-communication rules.",
  },
  {
    id: "nav",
    title: "Navigation Systems",
    short: "Nav",
    description: "VOR/GPS/DME tracking, intercepts, and en route IFR navigation.",
  },
  {
    id: "approaches",
    title: "Instrument Approaches",
    short: "Approaches",
    description: "Precision/non-precision, circling, missed approach, and minima.",
  },
  {
    id: "weather",
    title: "IFR Weather & Planning",
    short: "Weather",
    description: "TAF/METAR use, icing, thunderstorms, and IFR flight planning.",
  },
];

export const IRA_QUESTIONS: QuizQuestion[] = [
  // ─── IFR Regs ──────────────────────────────────────────────────────────────
  {
    id: "ira-regs-01",
    section: "ifr-regs",
    question:
      "To act as PIC under IFR (or in weather less than VFR minimums), a private or commercial pilot must have",
    options: [
      "An instrument rating on that category/class (and type if required) and meet instrument currency",
      "Only a current third-class medical",
      "A flight instructor endorsement within the preceding 30 days",
    ],
    correctIndex: 0,
    explanation:
      "14 CFR 61.3 requires the appropriate instrument rating to operate under IFR. Currency under 61.57(c) is also required to act as PIC under IFR.",
    reference: "14 CFR 61.3(e); 61.57(c)",
  },
  {
    id: "ira-regs-02",
    section: "ifr-regs",
    question:
      "Instrument currency under 14 CFR 61.57(c) within the preceding 6 calendar months requires, in the appropriate category,",
    options: [
      "Six instrument approaches, holding procedures, and intercepting/tracking courses through the use of navigational electronic systems",
      "Three takeoffs and landings only",
      "One hour of dual instruction in IMC",
    ],
    correctIndex: 0,
    explanation:
      "To act as PIC under IFR, you need within the preceding 6 calendar months: ≥6 instrument approaches, holding procedures and tasks, and intercepting and tracking courses via nav systems — in actual or simulated instrument conditions, or in an approved FSTD/ATD as allowed.",
    reference: "14 CFR 61.57(c)",
  },
  {
    id: "ira-regs-03",
    section: "ifr-regs",
    question:
      "If you are not instrument current and more than 6 calendar months have passed since meeting 61.57(c), before acting as PIC under IFR you generally need",
    options: [
      "An instrument proficiency check (IPC) by an authorized instructor or examiner in the appropriate category",
      "Only three simulated approaches in a desktop simulator",
      "A new instrument rating knowledge test",
    ],
    correctIndex: 0,
    explanation:
      "After the 6-month grace period without meeting currency, an IPC under 61.57(d) is required before acting as PIC under IFR.",
    reference: "14 CFR 61.57(d)",
  },
  {
    id: "ira-regs-04",
    section: "ifr-regs",
    question:
      "For an IFR flight in a civil airplane, fuel requirements under 14 CFR 91.167 include enough fuel to",
    options: [
      "Fly to the first airport of intended landing, then to the alternate (if required), then for 45 minutes at normal cruising speed",
      "Fly only to the destination with no reserve",
      "Fly to the destination plus 30 minutes day / 45 minutes night VFR reserve only",
    ],
    correctIndex: 0,
    explanation:
      "IFR fuel: destination + alternate (when required) + 45 minutes at normal cruising speed (turbine rules differ slightly in wording but piston/reciprocating use this structure).",
    reference: "14 CFR 91.167",
  },
  {
    id: "ira-regs-05",
    section: "ifr-regs",
    question:
      "An alternate airport is generally required for an IFR flight plan when, for at least 1 hour before to 1 hour after ETA,",
    options: [
      "The destination ceiling is forecast less than 2,000 feet above airport elevation OR visibility less than 3 statute miles (the “1-2-3” rule)",
      "Any cloud is forecast within 50 miles",
      "Winds are forecast above 10 knots",
    ],
    correctIndex: 0,
    explanation:
      "14 CFR 91.169: if from 1 hour before to 1 hour after ETA the ceiling is forecast < 2,000 ft AGL or visibility < 3 SM, file an alternate (with exceptions for certain approaches/airports as specified).",
    reference: "14 CFR 91.169(a)–(b)",
  },
  {
    id: "ira-regs-06",
    section: "ifr-regs",
    question:
      "Under Part 91, civil airplane takeoff minimums for IFR are",
    options: [
      "Not prescribed by Part 91 in the same way as Parts 121/135 — pilots still must comply with any published procedure, AFM limits, and good judgment / Ops Specs if applicable",
      "Always exactly 0/0 by regulation for every Part 91 flight",
      "Always 3 SM and 1,000 feet for every takeoff",
    ],
    correctIndex: 0,
    explanation:
      "14 CFR Part 91 does not set numeric IFR takeoff minimums for most civil operations (unlike 121/135). You must still follow ODPs/SIDs, AFM limitations, and any applicable commercial Ops Specs. Never take off into conditions you cannot safely escape.",
    reference: "14 CFR 91.175; AIM departure procedures",
  },

  // ─── Instruments ───────────────────────────────────────────────────────────
  {
    id: "ira-inst-01",
    section: "instruments",
    question:
      "In a typical light airplane, a vacuum-pump failure most directly affects",
    options: [
      "Attitude indicator and heading indicator (gyro instruments powered by vacuum)",
      "Airspeed, altimeter, and VSI only",
      "Only the turn coordinator",
    ],
    correctIndex: 0,
    explanation:
      "Many trainers power the attitude and heading indicators with vacuum/pressure; the turn coordinator is often electric. Know your POH.",
    reference: "Instrument Flying Handbook; PHAK Ch. 8",
  },
  {
    id: "ira-inst-02",
    section: "instruments",
    question:
      "If the pitot tube ices over with the drain hole also blocked, the airspeed indicator tends to",
    options: [
      "Act like an altimeter — indicating higher speed in a climb and lower in a descent",
      "Always read zero",
      "Continue to read correctly",
    ],
    correctIndex: 0,
    explanation:
      "With pitot and drain blocked, trapped pressure makes ASI behave like an altimeter. A blocked pitot with open drain may read zero.",
    reference: "Instrument Flying Handbook; PHAK Ch. 8",
  },
  {
    id: "ira-inst-03",
    section: "instruments",
    question:
      "Aircraft used for IFR flight must have instruments and equipment required by",
    options: [
      "14 CFR 91.205(d) for IFR, plus any required for the specific operation/airspace",
      "Only a magnetic compass",
      "VFR-day equipment only",
    ],
    correctIndex: 0,
    explanation:
      "91.205(d) lists IFR instruments and equipment (generator/alternator, adjustable altimeter, etc.) in addition to VFR requirements.",
    reference: "14 CFR 91.205(d)",
  },
  {
    id: "ira-inst-04",
    section: "instruments",
    question:
      "A skidding turn on the turn coordinator / inclinometer is corrected primarily by",
    options: [
      "Reducing rudder (or adding opposite rudder) so the ball moves toward center — “step on the ball”",
      "Increasing bank only",
      "Raising the nose abruptly",
    ],
    correctIndex: 0,
    explanation:
      "The ball indicates quality of turn. Step on the ball (apply rudder toward the ball) to center it.",
    reference: "Instrument Flying Handbook",
  },
  {
    id: "ira-inst-05",
    section: "instruments",
    question:
      "Unusual-attitude recovery emphasizing “pitch, power, bank” (or equivalent) is intended to",
    options: [
      "Return to controlled flight using available instruments without overstressing the airplane",
      "Maximize airspeed before leveling",
      "Ignore the attitude indicator entirely in every case",
    ],
    correctIndex: 0,
    explanation:
      "Recover from nose-high/low unusual attitudes with an orderly process: recognize, correct pitch/bank/power per training (IFH procedures).",
    reference: "Instrument Flying Handbook; IRA ACS Area IV",
  },
  {
    id: "ira-inst-06",
    section: "instruments",
    question:
      "Static-port blockage typically causes the altimeter and VSI to",
    options: [
      "Freeze / show incorrect altitude and zero vertical speed while ASI errors appear in climbs/descents",
      "Work normally in all phases",
      "Only affect the heading indicator",
    ],
    correctIndex: 0,
    explanation:
      "Blocked static: altimeter freezes, VSI reads zero, ASI reads high in descent and low in climb (typical training description).",
    reference: "Instrument Flying Handbook; PHAK Ch. 8",
  },

  // ─── Clearance / Holding / Lost Comms ──────────────────────────────────────
  {
    id: "ira-atc-01",
    section: "clearance",
    question:
      "A standard holding pattern uses",
    options: [
      "Right turns unless otherwise specified by ATC or the chart",
      "Left turns only",
      "No timing or distance legs",
    ],
    correctIndex: 0,
    explanation:
      "Standard holds: right turns; nonstandard holds specify left turns. Timing (typically 1 min inbound at/below 14,000) or DME/RNAV legs as published.",
    reference: "AIM 5-3-8",
  },
  {
    id: "ira-atc-02",
    section: "clearance",
    question:
      "At or below 14,000 feet MSL, the inbound leg of a timed holding pattern is normally",
    options: [
      "1 minute",
      "2 minutes",
      "30 seconds",
    ],
    correctIndex: 0,
    explanation:
      "AIM: adjust outbound so inbound is 1 minute at or below 14,000 MSL; 1½ minutes above 14,000 MSL (unless charted otherwise).",
    reference: "AIM 5-3-8",
  },
  {
    id: "ira-atc-03",
    section: "clearance",
    question:
      "Under 14 CFR 91.185, if two-way radio fails in IFR conditions, the route to fly (in priority) is",
    options: [
      "Assigned route; if none, vectored route last assigned; if none, expected route; if none, filed route",
      "Any VFR route of your choosing immediately",
      "Direct to the nearest airport always",
    ],
    correctIndex: 0,
    explanation:
      "Lost comms route (AVEF): Assigned, Vectored, Expected, Filed. Altitude: highest of assigned, MEA, or expected (MEA mnemonic often taught as “AME”).",
    reference: "14 CFR 91.185",
  },
  {
    id: "ira-atc-04",
    section: "clearance",
    question:
      "If IFR two-way communications fail and you are in VFR conditions, you should",
    options: [
      "Continue the flight under VFR and land as soon as practicable",
      "Always climb to FL180",
      "Squawk 7700 and remain IFR in IMC by preference",
    ],
    correctIndex: 0,
    explanation:
      "91.185(b): if VFR conditions are encountered, continue under VFR and land as soon as practicable.",
    reference: "14 CFR 91.185(b)",
  },
  {
    id: "ira-atc-05",
    section: "clearance",
    question:
      "The preferred lost-communications transponder code for IFR radio failure is",
    options: [
      "7600",
      "7500",
      "7700",
    ],
    correctIndex: 0,
    explanation:
      "7600 = radio failure; 7700 = emergency; 7500 = unlawful interference. Use 7600 for lost comms unless an emergency warrants 7700.",
    reference: "AIM 6-4-2; 14 CFR 91.185",
  },
  {
    id: "ira-atc-06",
    section: "clearance",
    question:
      "When cleared for an approach, you may descend",
    options: [
      "In accordance with the published procedure — typically maintain last assigned altitude until on a published segment that allows descent, then comply with charted altitudes",
      "Immediately to MDA/DA from any point",
      "Only after landing clearance",
    ],
    correctIndex: 0,
    explanation:
      "Do not descend below assigned altitude until established on a published route/segment that authorizes a lower altitude, then meet charted constraints.",
    reference: "AIM 5-4-1; 5-5-4",
  },

  // ─── Navigation ────────────────────────────────────────────────────────────
  {
    id: "ira-nav-01",
    section: "nav",
    question:
      "To intercept an inbound VOR radial, you typically",
    options: [
      "Set the inbound course in the OBS, note CDI deflection, and turn toward the needle to center it with a proper intercept angle",
      "Always fly away from the needle",
      "Ignore the TO/FROM flag",
    ],
    correctIndex: 0,
    explanation:
      "Center the CDI with a TO indication for inbound tracking on the selected course; use an intercept heading that brings you to the course without excessive overshoot.",
    reference: "Instrument Flying Handbook",
  },
  {
    id: "ira-nav-02",
    section: "nav",
    question:
      "VOR receiver checks (e.g., VOT, ground checkpoint, dual VOR check) are required",
    options: [
      "Within the preceding 30 days for IFR use of VOR navigation",
      "Only once per year",
      "Never for IFR",
    ],
    correctIndex: 0,
    explanation:
      "14 CFR 91.171: VOR equipment used under IFR must have been operationally checked within the preceding 30 days and found within limits; log the check.",
    reference: "14 CFR 91.171",
  },
  {
    id: "ira-nav-03",
    section: "nav",
    question:
      "A VOR changeover point (COP) on an airway is where",
    options: [
      "You change navigation reference from the behind VOR to the ahead VOR",
      "You must always hold",
      "ATC radar ends",
    ],
    correctIndex: 0,
    explanation:
      "The COP marks where frequency/nav guidance switches from the rearward facility to the forward facility along the route.",
    reference: "AIM 5-3-4",
  },
  {
    id: "ira-nav-04",
    section: "nav",
    question:
      "DME distance measures",
    options: [
      "Slant-range distance to the DME facility",
      "Exact horizontal ground distance always",
      "Only time to the station",
    ],
    correctIndex: 0,
    explanation:
      "DME is slant range; error is more noticeable near the station at high altitude.",
    reference: "Instrument Flying Handbook; AIM",
  },
  {
    id: "ira-nav-05",
    section: "nav",
    question:
      "RNAV (GPS) approaches require",
    options: [
      "A properly installed and operational GPS/RNAV system meeting the approach’s navigation specification, with current database as required",
      "Only a VOR receiver",
      "ADF equipment",
    ],
    correctIndex: 0,
    explanation:
      "Fly GPS approaches only with approved equipment, correct RAIM/integrity as applicable, and a current navigation database for the procedure.",
    reference: "AIM 1-1-17; 5-4-5; AFM/AFMS",
  },
  {
    id: "ira-nav-06",
    section: "nav",
    question:
      "Minimum En Route Altitude (MEA) guarantees",
    options: [
      "Obstruction clearance and acceptable navigation signal coverage for the route segment (with noted exceptions)",
      "VFR cloud clearance only",
      "Radar contact",
    ],
    correctIndex: 0,
    explanation:
      "MEA provides obstruction clearance and nav signal coverage. MOCA provides obstruction clearance and nav coverage only within 22 NM of the VOR (generally).",
    reference: "AIM 5-3-4; 14 CFR 91.177",
  },

  // ─── Approaches ────────────────────────────────────────────────────────────
  {
    id: "ira-appr-01",
    section: "approaches",
    question:
      "Decision Altitude (DA) on a precision approach is",
    options: [
      "A specified altitude in the approach at which a missed approach must be initiated if the required visual references are not in sight",
      "The same as MDA for all approaches",
      "Only used for circling",
    ],
    correctIndex: 0,
    explanation:
      "At DA (precision / APV with DA), decide to land or go missed immediately if visual references under 91.175 are not distinctly visible and identifiable.",
    reference: "14 CFR 91.175; AIM 5-4-5",
  },
  {
    id: "ira-appr-02",
    section: "approaches",
    question:
      "Minimum Descent Altitude (MDA) on a non-precision approach means",
    options: [
      "You may descend to MDA and maintain it until the missed-approach point if visual references are not acquired",
      "You must go missed the instant you reach MDA even with the runway in sight",
      "You may descend below MDA without visual references",
    ],
    correctIndex: 0,
    explanation:
      "Non-precision: descend to MDA, fly level to the MAP if needed, then miss if visuals aren’t acquired. Do not descend below MDA without meeting 91.175.",
    reference: "14 CFR 91.175; AIM 5-4-5",
  },
  {
    id: "ira-appr-03",
    section: "approaches",
    question:
      "Before descending below DA/MDA, 14 CFR 91.175 generally requires",
    options: [
      "The aircraft is continuously in a position to land using normal maneuvers, flight visibility not less than prescribed, and required visual references distinctly visible and identifiable",
      "Only ATC saying “cleared to land”",
      "Any light visible anywhere on the airport",
    ],
    correctIndex: 0,
    explanation:
      "91.175(c) lists the conditions to operate below DA/DH or MDA, including the runway environment visual references in 91.175(c)(3).",
    reference: "14 CFR 91.175(c)",
  },
  {
    id: "ira-appr-04",
    section: "approaches",
    question:
      "Approach category (A–E) is based on",
    options: [
      "1.3 times the stall speed in the landing configuration at maximum certificated landing weight (VREF if published)",
      "Maximum cruise speed only",
      "Engine horsepower only",
    ],
    correctIndex: 0,
    explanation:
      "Categories use 1.3 VSO (or VREF). Use the category for your speed; if you maneuver faster, use the higher category minima.",
    reference: "AIM 5-4-5; 14 CFR 97.3",
  },
  {
    id: "ira-appr-05",
    section: "approaches",
    question:
      "A circling approach minimum provides",
    options: [
      "Obstacle clearance while circling to land on a runway not aligned with the final approach course, at published circling MDA and visibility",
      "A precision glideslope to every runway",
      "No obstacle clearance",
    ],
    correctIndex: 0,
    explanation:
      "Circling minima protect a defined circling radius by category. Remain within protected airspace; go missed if you lose visuals.",
    reference: "AIM 5-4-20",
  },
  {
    id: "ira-appr-06",
    section: "approaches",
    question:
      "When executing a missed approach, you should",
    options: [
      "Climb and navigate as published (or as assigned), starting at the MAP/DA as appropriate — do not descend further",
      "Turn in any direction immediately without reference to the procedure",
      "Remain at MDA indefinitely",
    ],
    correctIndex: 0,
    explanation:
      "Missed approach: power/attitude for climb, configure, and fly the published missed or ATC clearance from the correct point.",
    reference: "AIM 5-4-21; IRA ACS Area VI",
  },

  // ─── Weather ───────────────────────────────────────────────────────────────
  {
    id: "ira-wx-01",
    section: "weather",
    question:
      "A TAF’s TEMPO group indicates",
    options: [
      "Temporary fluctuations expected for less than half the time period, each lasting generally less than an hour",
      "Permanent weather for the entire TAF period",
      "Weather only above FL180",
    ],
    correctIndex: 0,
    explanation:
      "TEMPO: temporary conditions expected to last less than one hour at a time and cover less than half of the forecast period.",
    reference: "Aviation Weather Handbook / AC 00-45; AIM 7-1",
  },
  {
    id: "ira-wx-02",
    section: "weather",
    question:
      "Structural icing is most likely when flying in",
    options: [
      "Visible moisture with temperatures at or below freezing at the airframe",
      "Clear dry air at any temperature",
      "Only above FL300",
    ],
    correctIndex: 0,
    explanation:
      "Icing requires visible moisture and airframe temperatures ≤ 0°C (approx.). Avoid known icing unless the aircraft is approved and equipped.",
    reference: "Aviation Weather Handbook; AIM 7-1-21",
  },
  {
    id: "ira-wx-03",
    section: "weather",
    question:
      "Freezing rain is especially hazardous because",
    options: [
      "Supercooled water freezes on impact and can accumulate rapidly, often with ice forming aft of protected surfaces",
      "It only occurs above FL300",
      "It cannot stick to the airframe",
    ],
    correctIndex: 0,
    explanation:
      "Freezing rain implies warmer air aloft over cold air — severe icing risk. Exit the conditions promptly.",
    reference: "Aviation Weather Handbook; AIM 7-1-21",
  },
  {
    id: "ira-wx-04",
    section: "weather",
    question:
      "For IFR alternate planning, standard alternate minimums (when standard applies) for a precision approach are often",
    options: [
      "600-foot ceiling and 2 SM visibility (nonprecision 800-2), unless non-standard alternate minimums are published",
      "200-½ for all airports",
      "VFR only",
    ],
    correctIndex: 0,
    explanation:
      "Standard alternate minima commonly taught: precision 600-2, nonprecision 800-2. Always check the approach chart for “A” NA or non-standard alternate minimums.",
    reference: "14 CFR 91.169; AIM / TPP legend",
  },
  {
    id: "ira-wx-05",
    section: "weather",
    question:
      "Thunderstorm penetration in light aircraft is",
    options: [
      "To be avoided — divert or delay; do not knowingly penetrate a thunderstorm",
      "Recommended for turbulence training",
      "Safe if you climb above the tops in a trainer",
    ],
    correctIndex: 0,
    explanation:
      "Thunderstorms contain extreme turbulence, hail, icing, and wind shear. Avoid by a wide margin; never intentionally penetrate.",
    reference: "AIM 7-1-28; Aviation Weather Handbook",
  },
  {
    id: "ira-wx-06",
    section: "weather",
    question:
      "Bracketing a cold front on an IFR flight often means expecting",
    options: [
      "Wind shift, possible turbulence, showers/thunderstorms, and rapid weather changes near the front",
      "No weather changes",
      "Only improving visibility always",
    ],
    correctIndex: 0,
    explanation:
      "Fronts bring wind shifts and weather hazards. Plan fuel, alternates, and deviations for convective and icing risks.",
    reference: "Aviation Weather Handbook; PHAK Ch. 12",
  },
];
