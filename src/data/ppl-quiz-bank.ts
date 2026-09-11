/**
 * Original Private Pilot practice questions for AvADSB.
 *
 * LEGAL / SOURCE NOTES
 * --------------------
 * These items are ORIGINAL practice questions written for this app. They are
 * grounded in publicly available U.S. government materials (14 CFR, AIM,
 * Pilot’s Handbook of Aeronautical Knowledge, Airplane Flying Handbook, and
 * the Private Pilot Airplane ACS topic list). They are NOT FAA Airman Knowledge
 * Test Questions, NOT copied from Gleim / ASA / Jeppesen / King / Sheppard Air
 * or any other commercial bank, and are NOT endorsed by the FAA.
 *
 * Facts of law and meteorology are not copyrightable; the wording of active
 * FAA knowledge-test items and commercial study guides is. Do not paste
 * third-party test banks into this file.
 */

export type QuizSectionId =
  | "regs"
  | "airspace"
  | "weather"
  | "aero"
  | "systems"
  | "airport"
  | "nav"
  | "human"
  | "night";

export type QuizQuestion = {
  id: string;
  section: QuizSectionId;
  question: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
  /** Public reference for study (CFR / AIM / handbook chapter). */
  reference: string;
};

export type QuizSection = {
  id: QuizSectionId;
  title: string;
  short: string;
  description: string;
};

export const QUIZ_DISCLAIMER =
  "Practice only — original questions based on public FAA regulations and handbooks. Not official FAA knowledge-test items. Not affiliated with or endorsed by the FAA. Always verify against current 14 CFR, AIM, and your instructor.";

export const QUIZ_SECTIONS: QuizSection[] = [
  {
    id: "regs",
    title: "Regulations & Airworthiness",
    short: "Regs",
    description: "Part 61 / 91 privileges, documents, inspections, and equipment.",
  },
  {
    id: "airspace",
    title: "Airspace & Right-of-Way",
    short: "Airspace",
    description: "Classes A–G, VFR weather mins, speed limits, and collision avoidance.",
  },
  {
    id: "weather",
    title: "Weather Theory & Services",
    short: "Weather",
    description: "Atmosphere, fronts, METAR/TAF/AIRMET, and density altitude effects.",
  },
  {
    id: "aero",
    title: "Aerodynamics & Performance",
    short: "Aero",
    description: "Lift, stalls, spins, load factor, and takeoff/climb performance.",
  },
  {
    id: "systems",
    title: "Systems & Instruments",
    short: "Systems",
    description: "Engine, fuel, electrical, pitot-static, and gyro instruments.",
  },
  {
    id: "airport",
    title: "Airport Ops & Communications",
    short: "Airport",
    description: "Traffic patterns, light-gun signals, runway markings, and radio.",
  },
  {
    id: "nav",
    title: "Navigation & Cross-Country",
    short: "Nav",
    description: "Charts, VOR/GPS basics, fuel planning, and lost procedures.",
  },
  {
    id: "human",
    title: "Aeromedical & Decision-Making",
    short: "Human",
    description: "Hypoxia, illusions, IMSAFE, and ADM / risk management.",
  },
  {
    id: "night",
    title: "Night Ops & Emergencies",
    short: "Night",
    description: "Night currency, lighting, engine failure, and emergency squawks.",
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ─── Regulations & Airworthiness ───────────────────────────────────────────
  {
    id: "regs-01",
    section: "regs",
    question:
      "Which documents must be aboard a U.S.-registered civil airplane for a Part 91 flight?",
    options: [
      "Airworthiness certificate, registration, operating limitations / AFM, and weight-and-balance data",
      "Only the airworthiness certificate and the pilot’s certificate",
      "Insurance binder, registration, and a current medical only",
    ],
    correctIndex: 0,
    explanation:
      "Common mnemonic ARROW: Airworthiness certificate, Registration, Radio station license (international), Operating limitations / AFM, Weight and balance. For domestic Part 91, the radio license is generally not required.",
    reference: "14 CFR 91.203; 91.9",
  },
  {
    id: "regs-02",
    section: "regs",
    question:
      "As a private pilot carrying passengers, what recent flight experience is required?",
    options: [
      "Three takeoffs and three landings within the preceding 90 days in an aircraft of the same category, class, and type (if type rating required)",
      "One hour of dual within the preceding 6 calendar months",
      "A flight review within the preceding 90 days",
    ],
    correctIndex: 0,
    explanation:
      "To carry passengers, 14 CFR 61.57 requires three takeoffs and three landings within the preceding 90 days in the same category/class (and type if a type rating is required). Night passenger currency has additional requirements.",
    reference: "14 CFR 61.57(a)",
  },
  {
    id: "regs-03",
    section: "regs",
    question:
      "How long is a third-class medical certificate valid for a pilot under age 40?",
    options: [
      "60 calendar months",
      "24 calendar months",
      "12 calendar months",
    ],
    correctIndex: 0,
    explanation:
      "Under age 40, a third-class medical is generally valid for 60 calendar months for private/recreational privileges. At 40 or older it is typically 24 calendar months. Always confirm current Part 61 tables.",
    reference: "14 CFR 61.23",
  },
  {
    id: "regs-04",
    section: "regs",
    question:
      "A 100-hour inspection was due at 3,302.5 Hobbs. It was completed at 3,309.5. When is the next 100-hour due?",
    options: [
      "3,402.5 Hobbs (100 hours from the due time, not from when it was late)",
      "3,409.5 Hobbs (100 hours after the completion time)",
      "Whenever the next annual is due",
    ],
    correctIndex: 0,
    explanation:
      "The next 100-hour is measured from the time it was due. Completing it late does not reset the clock forward; excess time after the due point still counts against the next interval.",
    reference: "14 CFR 91.409(b)",
  },
  {
    id: "regs-05",
    section: "regs",
    question:
      "Who is responsible for ensuring each person on board is briefed on seat-belt use before takeoff?",
    options: [
      "The pilot in command",
      "The aircraft owner",
      "Any passenger who sits in the front seats",
    ],
    correctIndex: 0,
    explanation:
      "The PIC must ensure each person on board is briefed on how to fasten and unfasten safety belts and (when required) shoulder harnesses.",
    reference: "14 CFR 91.107",
  },
  {
    id: "regs-06",
    section: "regs",
    question:
      "May a private pilot receive compensation for carrying passengers?",
    options: [
      "Generally no — private pilots may not act as PIC of an aircraft carrying passengers or property for compensation or hire",
      "Yes, if the passengers share pro-rata operating expenses only when the pilot also pays nothing",
      "Yes, for any flight under 50 NM",
    ],
    correctIndex: 0,
    explanation:
      "Private pilot privileges generally prohibit compensation or hire for carrying persons or property. Limited expense-sharing with common purpose is allowed under specific Part 61 rules — not a free pass to fly for hire.",
    reference: "14 CFR 61.113",
  },
  {
    id: "regs-07",
    section: "regs",
    question:
      "What is the minimum fuel reserve required for day VFR flight in an airplane?",
    options: [
      "Enough fuel to fly to the first point of intended landing and thereafter for at least 30 minutes at normal cruising speed",
      "Enough fuel for the planned trip only",
      "Enough fuel to fly to the destination plus 45 minutes at best endurance",
    ],
    correctIndex: 0,
    explanation:
      "Day VFR airplane fuel: fly to the first point of intended landing, then at least 30 minutes at normal cruise. Night VFR requires 45 minutes.",
    reference: "14 CFR 91.151",
  },
  {
    id: "regs-08",
    section: "regs",
    question:
      "An annual inspection was completed on July 12. When does it expire for Part 91 operations?",
    options: [
      "At the end of July 31 of the following year",
      "Exactly 12 months later on July 12",
      "After 100 hours of flight time",
    ],
    correctIndex: 0,
    explanation:
      "An annual is due within the preceding 12 calendar months. Completed July 12, it remains valid through the end of July the next year.",
    reference: "14 CFR 91.409(a)",
  },
  {
    id: "regs-09",
    section: "regs",
    question:
      "Which statement about a special flight permit is correct?",
    options: [
      "It may authorize flight of an aircraft that does not currently meet airworthiness requirements, under specified conditions",
      "It permanently replaces an airworthiness certificate",
      "It is issued automatically whenever an AD is outstanding",
    ],
    correctIndex: 0,
    explanation:
      "A special flight permit (ferry permit) can allow movement of an aircraft that is out of annual or otherwise not airworthy, under limitations set by the FAA.",
    reference: "14 CFR 21.197; 91.203",
  },
  {
    id: "regs-10",
    section: "regs",
    question:
      "For airplane night VFR, which equipment is required in addition to day VFR instruments/equipment?",
    options: [
      "Approved position lights, an anti-collision light system, and adequate source of electrical energy; plus a landing light if operated for hire",
      "Only a landing light",
      "Only an ADF and marker beacon",
    ],
    correctIndex: 0,
    explanation:
      "Night VFR adds position lights and anti-collision lighting (and electrical energy to operate them). A landing light is required if the aircraft is operated for hire.",
    reference: "14 CFR 91.205(c)",
  },
  {
    id: "regs-11",
    section: "regs",
    question:
      "How often must a VFR pilot complete a flight review to act as PIC?",
    options: [
      "Within the preceding 24 calendar months",
      "Within the preceding 12 calendar months",
      "Only when changing aircraft category",
    ],
    correctIndex: 0,
    explanation:
      "A flight review (or qualifying substitute such as a practical test for a certificate/rating) is required within the preceding 24 calendar months to act as PIC.",
    reference: "14 CFR 61.56",
  },
  {
    id: "regs-12",
    section: "regs",
    question:
      "Who is the final authority as to the operation of the aircraft?",
    options: [
      "The pilot in command",
      "ATC",
      "The aircraft owner",
    ],
    correctIndex: 0,
    explanation:
      "The PIC is directly responsible for, and is the final authority as to, the operation of that aircraft. ATC clearances do not relieve the PIC of that duty.",
    reference: "14 CFR 91.3",
  },

  // ─── Airspace & Right-of-Way ───────────────────────────────────────────────
  {
    id: "air-01",
    section: "airspace",
    question:
      "In Class E airspace below 10,000 feet MSL, what are basic VFR weather minimums?",
    options: [
      "3 SM visibility; 500 ft below, 1,000 ft above, and 2,000 ft horizontal from clouds",
      "1 SM visibility and clear of clouds",
      "5 SM visibility; 1,000 ft above/below and 1 SM horizontal from clouds",
    ],
    correctIndex: 0,
    explanation:
      "Class E below 10,000′ MSL uses the familiar 3-152 values: 3 SM visibility and 500/1,000/2,000 cloud clearance.",
    reference: "14 CFR 91.155",
  },
  {
    id: "air-02",
    section: "airspace",
    question:
      "Which airspace generally prohibits VFR flight?",
    options: [
      "Class A",
      "Class C",
      "Class G above 1,200 ft AGL",
    ],
    correctIndex: 0,
    explanation:
      "Class A (typically 18,000′ MSL to FL600) requires an IFR clearance; VFR is not authorized.",
    reference: "14 CFR 91.135; AIM 3-2-2",
  },
  {
    id: "air-03",
    section: "airspace",
    question:
      "Unless otherwise authorized, what is the maximum indicated airspeed below 10,000 feet MSL?",
    options: ["250 knots", "200 knots", "288 knots"],
    correctIndex: 0,
    explanation:
      "Indicated airspeed is limited to 250 knots below 10,000′ MSL, with additional limits in certain terminal airspace.",
    reference: "14 CFR 91.117(a)",
  },
  {
    id: "air-04",
    section: "airspace",
    question:
      "An aircraft in distress has right-of-way over",
    options: [
      "all other air traffic",
      "only powered aircraft",
      "only aircraft of the same category",
    ],
    correctIndex: 0,
    explanation:
      "An aircraft in distress has the right-of-way over all other air traffic.",
    reference: "14 CFR 91.113(c)",
  },
  {
    id: "air-05",
    section: "airspace",
    question:
      "When two aircraft of the same category are converging at approximately the same altitude (and neither is overtaking), which has the right-of-way?",
    options: [
      "The aircraft on the right",
      "The aircraft on the left",
      "The faster aircraft",
    ],
    correctIndex: 0,
    explanation:
      "When aircraft of the same category converge, the one on the other’s right has the right-of-way. Category priority (balloon > glider > airship > airplane/rotorcraft) applies when categories differ.",
    reference: "14 CFR 91.113(d)",
  },
  {
    id: "air-06",
    section: "airspace",
    question:
      "What equipment is generally required to enter Class C airspace?",
    options: [
      "Two-way radio and a Mode C (altitude-reporting) transponder, with ADS-B Out as required by current rules",
      "Only a handheld radio",
      "Only a VOR receiver",
    ],
    correctIndex: 0,
    explanation:
      "Class C requires two-way radio communication and a Mode C transponder; ADS-B Out is required in the Mode C veil / specified airspace under current Part 91 rules.",
    reference: "14 CFR 91.130; 91.215; 91.225",
  },
  {
    id: "air-07",
    section: "airspace",
    question:
      "In Class G airspace at or below 1,200 feet AGL during the day, what are basic VFR minimums for airplanes?",
    options: [
      "1 SM visibility and clear of clouds",
      "3 SM visibility and 500/1,000/2,000 cloud clearance",
      "5 SM visibility and clear of clouds",
    ],
    correctIndex: 0,
    explanation:
      "Day Class G at or below 1,200′ AGL: 1 SM flight visibility and clear of clouds for airplanes.",
    reference: "14 CFR 91.155",
  },
  {
    id: "air-08",
    section: "airspace",
    question:
      "VFR cruising altitudes when more than 3,000 feet AGL are based on",
    options: [
      "magnetic course (odd thousands + 500 eastbound; even thousands + 500 westbound)",
      "true heading only",
      "ATC-assigned flight levels only",
    ],
    correctIndex: 0,
    explanation:
      "Above 3,000′ AGL, VFR cruising altitudes use magnetic course: 0–179° → odd thousands + 500; 180–359° → even thousands + 500.",
    reference: "14 CFR 91.159",
  },
  {
    id: "air-09",
    section: "airspace",
    question:
      "What is the usual vertical extent of Class A airspace in the contiguous U.S.?",
    options: [
      "18,000 feet MSL up to and including FL600",
      "10,000 feet MSL to 18,000 feet MSL",
      "Surface to 10,000 feet MSL",
    ],
    correctIndex: 0,
    explanation:
      "Class A generally extends from 18,000′ MSL up to and including FL600 over the contiguous United States.",
    reference: "AIM 3-2-2",
  },
  {
    id: "air-10",
    section: "airspace",
    question:
      "Before entering Class D airspace, a pilot must",
    options: [
      "establish two-way radio communication with the control tower",
      "receive a discrete squawk code from Center",
      "file an IFR flight plan",
    ],
    correctIndex: 0,
    explanation:
      "For Class D, establish two-way communications with the tower before entry (unless otherwise authorized).",
    reference: "14 CFR 91.129",
  },
  {
    id: "air-11",
    section: "airspace",
    question:
      "Above 10,000 feet MSL in Class E, basic VFR cloud clearance and visibility are",
    options: [
      "5 SM visibility; 1,000 ft above, 1,000 ft below, and 1 SM horizontal from clouds",
      "3 SM visibility; 500/1,000/2,000",
      "1 SM visibility and clear of clouds",
    ],
    correctIndex: 0,
    explanation:
      "At or above 10,000′ MSL in Class E (and certain other airspace), VFR requires 5 SM and 1,000/1,000/1 SM cloud clearance.",
    reference: "14 CFR 91.155",
  },
  {
    id: "air-12",
    section: "airspace",
    question:
      "Within 4 NM of the primary airport in Class C or D airspace under 2,500 feet AGL, indicated airspeed is limited to",
    options: ["200 knots", "250 knots", "156 knots"],
    correctIndex: 0,
    explanation:
      "Unless otherwise authorized, do not exceed 200 KIAS within 4 NM of the primary airport of Class C or Class D airspace at or below 2,500′ AGL.",
    reference: "14 CFR 91.117(b)",
  },

  // ─── Weather ──────────────────────────────────────────────────────────────
  {
    id: "wx-01",
    section: "weather",
    question:
      "What is density altitude?",
    options: [
      "Pressure altitude corrected for nonstandard temperature",
      "True altitude corrected for nonstandard pressure",
      "Indicated altitude with instrument error removed",
    ],
    correctIndex: 0,
    explanation:
      "Density altitude is pressure altitude corrected for nonstandard temperature — a practical measure of air density that drives performance.",
    reference: "PHAK Ch. 4 / 11",
  },
  {
    id: "wx-02",
    section: "weather",
    question:
      "High density altitude most directly causes",
    options: [
      "longer takeoff rolls and reduced climb performance",
      "increased engine horsepower",
      "lower true airspeed for a given indicated airspeed",
    ],
    correctIndex: 0,
    explanation:
      "Thinner air reduces engine power, propeller efficiency, and lift — expect longer takeoffs and weaker climbs.",
    reference: "PHAK Ch. 11",
  },
  {
    id: "wx-03",
    section: "weather",
    question:
      "Using the approximate convective cloud-base rule: surface temperature 80°F and dew point 52°F. Estimated cumulus base?",
    options: [
      "About 6,400 feet AGL",
      "About 2,800 feet AGL",
      "About 12,000 feet AGL",
    ],
    correctIndex: 0,
    explanation:
      "Rule of thumb: (temp − dew point) ÷ 4.4 × 1,000 ft AGL. (80 − 52) / 4.4 ≈ 6,400 ft AGL. This is an estimate only.",
    reference: "PHAK Ch. 12",
  },
  {
    id: "wx-04",
    section: "weather",
    question:
      "What primarily drives day-to-day weather processes?",
    options: [
      "Heat exchange (unequal heating of the Earth’s surface)",
      "The Earth’s magnetic field",
      "Ocean tides alone",
    ],
    correctIndex: 0,
    explanation:
      "Unequal heating creates temperature and pressure differences that drive circulation and weather systems.",
    reference: "PHAK Ch. 12",
  },
  {
    id: "wx-05",
    section: "weather",
    question:
      "A METAR reports “BKN015.” What does that mean?",
    options: [
      "Broken clouds with a ceiling at approximately 1,500 feet AGL",
      "Broken clouds at 15,000 feet MSL",
      "Few clouds at 150 feet",
    ],
    correctIndex: 0,
    explanation:
      "Cloud heights in METARs are hundreds of feet AGL. BKN015 = broken layer at 1,500′ AGL, which constitutes a ceiling.",
    reference: "AIM 7-1-30; Aviation Weather Handbook",
  },
  {
    id: "wx-06",
    section: "weather",
    question:
      "What does an AIRMET Sierra typically address?",
    options: [
      "IFR conditions and/or mountain obscuration",
      "Severe thunderstorms only",
      "Volcanic ash only",
    ],
    correctIndex: 0,
    explanation:
      "AIRMET Sierra covers IFR conditions and mountain obscuration. Tango covers turbulence; Zulu covers icing.",
    reference: "AIM 7-1-5",
  },
  {
    id: "wx-07",
    section: "weather",
    question:
      "Frost on the wing is hazardous primarily because it",
    options: [
      "disrupts the smooth airflow and can substantially increase stall speed",
      "only adds weight with no aerodynamic effect",
      "improves laminar flow",
    ],
    correctIndex: 0,
    explanation:
      "Even thin frost roughens the surface, degrading lift and raising stall speed — remove it before flight.",
    reference: "PHAK Ch. 12; Airplane Flying Handbook",
  },
  {
    id: "wx-08",
    section: "weather",
    question:
      "A cold front often brings",
    options: [
      "narrow-band showers or thunderstorms, then cooler clearer air",
      "prolonged steady rain with little wind shift",
      "fog that never lifts",
    ],
    correctIndex: 0,
    explanation:
      "Cold fronts typically have steeper slopes and more convective activity along a relatively narrow band, followed by cooler air.",
    reference: "PHAK Ch. 12",
  },
  {
    id: "wx-09",
    section: "weather",
    question:
      "Wind shear is most dangerous near the ground because it can",
    options: [
      "suddenly change airspeed and lift during takeoff or landing",
      "only affect jet aircraft above FL300",
      "always increase indicated airspeed safely",
    ],
    correctIndex: 0,
    explanation:
      "Low-level wind shear can remove airspeed/lift in seconds — critical in the takeoff and approach phases.",
    reference: "PHAK Ch. 12; AIM 7-1-25",
  },
  {
    id: "wx-10",
    section: "weather",
    question:
      "Standard atmosphere sea-level temperature and pressure are approximately",
    options: [
      "15°C and 29.92 inHg",
      "0°C and 30.00 inHg",
      "20°C and 1013 mb only with no inHg equivalent",
    ],
    correctIndex: 0,
    explanation:
      "ISA sea level: 15°C (59°F) and 29.92 inHg (1013.2 mb). Standard lapse rate is about 2°C per 1,000 feet in the troposphere.",
    reference: "PHAK Ch. 4",
  },
  {
    id: "wx-11",
    section: "weather",
    question:
      "A TAF is primarily used to",
    options: [
      "forecast expected weather conditions for a terminal area over a defined period",
      "report only past weather at an airport",
      "replace the need for a METAR",
    ],
    correctIndex: 0,
    explanation:
      "TAFs are terminal forecasts. METARs are observations. Use both for planning.",
    reference: "AIM 7-1-30",
  },
  {
    id: "wx-12",
    section: "weather",
    question:
      "Stable air is typically associated with",
    options: [
      "smooth air, layered clouds, and poor visibility (haze/fog)",
      "strong convective turbulence and towering cumulus",
      "rapid vertical cloud development only",
    ],
    correctIndex: 0,
    explanation:
      "Stable air resists vertical motion — expect stratiform clouds, smooth rides, and often reduced visibility.",
    reference: "PHAK Ch. 12",
  },

  // ─── Aerodynamics & Performance ───────────────────────────────────────────
  {
    id: "aero-01",
    section: "aero",
    question:
      "The rudder primarily controls motion about which axis?",
    options: [
      "Yaw about the vertical axis",
      "Roll about the longitudinal axis",
      "Pitch about the lateral axis",
    ],
    correctIndex: 0,
    explanation:
      "Rudder → yaw (vertical axis). Ailerons → roll (longitudinal). Elevator → pitch (lateral).",
    reference: "PHAK Ch. 6",
  },
  {
    id: "aero-02",
    section: "aero",
    question:
      "During a developed spin, which statement is correct?",
    options: [
      "Both wings are stalled; one is more deeply stalled",
      "Neither wing is stalled",
      "Only the outside wing is stalled",
    ],
    correctIndex: 0,
    explanation:
      "A spin is an aggravated stall with autorotation; both wings are stalled, asymmetrically.",
    reference: "Airplane Flying Handbook Ch. 5",
  },
  {
    id: "aero-03",
    section: "aero",
    question:
      "What is one primary purpose of wing flaps on approach?",
    options: [
      "Allow a steeper descent path without a large increase in airspeed",
      "Decrease wing area to reduce drag",
      "Replace the need for a landing checklist",
    ],
    correctIndex: 0,
    explanation:
      "Flaps increase lift and drag, enabling steeper approaches at approach-appropriate speeds.",
    reference: "PHAK Ch. 6",
  },
  {
    id: "aero-04",
    section: "aero",
    question:
      "An airplane’s maximum lift-to-drag ratio (L/Dmax) is associated with",
    options: [
      "best glide speed and (in still air) maximum range for many propeller airplanes",
      "never-exceed speed",
      "maneuvering speed only",
    ],
    correctIndex: 0,
    explanation:
      "L/Dmax occurs at a particular angle of attack / speed used for best glide and often max-range cruise in still air.",
    reference: "PHAK Ch. 5 / 11",
  },
  {
    id: "aero-05",
    section: "aero",
    question:
      "What is VA (design maneuvering speed)?",
    options: [
      "The maximum speed at which full, abrupt control inputs should not overstress the airframe",
      "Never-exceed speed",
      "Best angle-of-climb speed",
    ],
    correctIndex: 0,
    explanation:
      "At or below VA, the airplane should stall before structural limits are exceeded from full control deflection. VA decreases as weight decreases.",
    reference: "PHAK Ch. 5; AFM/POH",
  },
  {
    id: "aero-06",
    section: "aero",
    question:
      "As bank angle increases in a level turn, load factor",
    options: [
      "increases, and stall speed increases",
      "decreases, and stall speed decreases",
      "remains 1 G at any bank",
    ],
    correctIndex: 0,
    explanation:
      "Level turns raise load factor (n = 1/cos φ). Higher load factor raises stall speed.",
    reference: "PHAK Ch. 5",
  },
  {
    id: "aero-07",
    section: "aero",
    question:
      "Ground effect is most pronounced",
    options: [
      "within about one wingspan of the surface, reducing induced drag",
      "only above 5,000 feet AGL",
      "when flying behind a large jet’s wake",
    ],
    correctIndex: 0,
    explanation:
      "Near the ground, wingtip vortices are constrained, induced drag drops, and the airplane may float — manage airspeed carefully.",
    reference: "PHAK Ch. 5",
  },
  {
    id: "aero-08",
    section: "aero",
    question:
      "Left-turning tendencies in a single-engine propeller airplane on takeoff include",
    options: [
      "torque, P-factor, slipstream effect, and gyroscopic precession (as applicable)",
      "only Coriolis force",
      "only magnetic variation",
    ],
    correctIndex: 0,
    explanation:
      "Four classical left-turning tendencies: torque reaction, corkscrewing slipstream, P-factor (asymmetric thrust), and gyroscopic precession (tailwheel / attitude changes).",
    reference: "PHAK Ch. 5",
  },
  {
    id: "aero-09",
    section: "aero",
    question:
      "An increase in weight, with other factors equal, will",
    options: [
      "increase stall speed",
      "decrease stall speed",
      "have no effect on stall speed",
    ],
    correctIndex: 0,
    explanation:
      "Higher weight requires more lift; the stall occurs at a higher indicated airspeed for the same configuration.",
    reference: "PHAK Ch. 5",
  },
  {
    id: "aero-10",
    section: "aero",
    question:
      "Best angle of climb speed (VX) is used to",
    options: [
      "gain the most altitude in the shortest horizontal distance",
      "gain the most altitude in the least time",
      "cruise for maximum endurance",
    ],
    correctIndex: 0,
    explanation:
      "VX = best angle (obstacle clearance). VY = best rate (most altitude per time).",
    reference: "PHAK Ch. 11; AFM/POH",
  },
  {
    id: "aero-11",
    section: "aero",
    question:
      "Center of gravity too far aft is hazardous because it can",
    options: [
      "reduce pitch stability and make recovery from a stall more difficult",
      "always improve cruise speed with no downside",
      "only affect nosewheel steering on the ground",
    ],
    correctIndex: 0,
    explanation:
      "An aft CG reduces static longitudinal stability and can make stall/spin recovery more difficult or impossible.",
    reference: "PHAK Ch. 10",
  },
  {
    id: "aero-12",
    section: "aero",
    question:
      "Induced drag is highest when the airplane is",
    options: [
      "flying slowly at high angles of attack",
      "flying at high speed in a clean cruise configuration",
      "parked with the engine off",
    ],
    correctIndex: 0,
    explanation:
      "Induced drag rises with angle of attack / lift coefficient — greatest at slow speeds, least at high speeds.",
    reference: "PHAK Ch. 5",
  },

  // ─── Systems & Instruments ────────────────────────────────────────────────
  {
    id: "sys-01",
    section: "systems",
    question:
      "If you cannot obtain an altimeter setting before departure, you should",
    options: [
      "set the altimeter to field elevation",
      "set 29.92 inHg regardless of elevation",
      "leave the altimeter at the last cruise setting",
    ],
    correctIndex: 0,
    explanation:
      "With no setting available, set the altimeter to the known field elevation so indicated altitude approximates local MSL height.",
    reference: "14 CFR 91.121; AIM 7-2-3",
  },
  {
    id: "sys-02",
    section: "systems",
    question:
      "With a correct local altimeter setting, the altimeter should indicate approximately",
    options: [
      "true altitude (height above mean sea level) when on the ground at the reporting station",
      "density altitude only",
      "pressure altitude only",
    ],
    correctIndex: 0,
    explanation:
      "Local altimeter setting (QNH) makes the altimeter read approximately MSL altitude / field elevation at that station.",
    reference: "PHAK Ch. 8",
  },
  {
    id: "sys-03",
    section: "systems",
    question:
      "Pitot-tube icing with an open static port typically causes the airspeed indicator to",
    options: [
      "act like an altimeter — readings change with altitude rather than true airspeed",
      "freeze at zero with no other effects",
      "always over-read on climb",
    ],
    correctIndex: 0,
    explanation:
      "Blocked pitot (ram) pressure with clear static: ASI behaves erroneously with altitude changes. Know your AFM emergency procedures and alternate static use.",
    reference: "PHAK Ch. 8",
  },
  {
    id: "sys-04",
    section: "systems",
    question:
      "The attitude indicator is normally powered by",
    options: [
      "the vacuum (or electric) system, depending on aircraft design",
      "the pitot-static system only",
      "GPS satellites only",
    ],
    correctIndex: 0,
    explanation:
      "Traditional steam-gauge attitude indicators are vacuum-driven; many modern units are electric. Know your airplane.",
    reference: "PHAK Ch. 8",
  },
  {
    id: "sys-05",
    section: "systems",
    question:
      "Detonation in an aircraft engine is",
    options: [
      "uncontrolled explosive combustion that can damage the engine",
      "normal smooth burning of the mixture",
      "a magneto timing check procedure",
    ],
    correctIndex: 0,
    explanation:
      "Detonation is explosive combustion — often from excessive heat, wrong fuel grade, or improper mixture/power settings.",
    reference: "PHAK Ch. 7",
  },
  {
    id: "sys-06",
    section: "systems",
    question:
      "Running a carbureted engine at idle for long periods on the ground is undesirable mainly because",
    options: [
      "spark plugs may foul and the engine may overheat unevenly",
      "it always increases airspeed",
      "it charges the battery too quickly",
    ],
    correctIndex: 0,
    explanation:
      "Prolonged idle can foul plugs and provides poor cooling airflow — follow the AFM warm-up and taxi guidance.",
    reference: "PHAK Ch. 7; AFM/POH",
  },
  {
    id: "sys-07",
    section: "systems",
    question:
      "Carburetor ice is most likely when",
    options: [
      "temperatures are moderate and humidity is high, especially at lower power settings",
      "only in arctic conditions below −20°C",
      "only above 10,000 feet",
    ],
    correctIndex: 0,
    explanation:
      "Carb ice can form in surprisingly warm moist air due to fuel vaporization and pressure drop in the venturi — especially at reduced throttle.",
    reference: "PHAK Ch. 7",
  },
  {
    id: "sys-08",
    section: "systems",
    question:
      "An ammeter showing discharge in flight usually indicates",
    options: [
      "the electrical system is drawing more current than the alternator/generator is supplying",
      "the magnetos have failed",
      "the fuel pumps are over-priming",
    ],
    correctIndex: 0,
    explanation:
      "A discharge means battery energy is being used to make up the difference — shed load and troubleshoot per AFM.",
    reference: "PHAK Ch. 7",
  },
  {
    id: "sys-09",
    section: "systems",
    question:
      "Oil temperature high and oil pressure low in cruise is a cue to",
    options: [
      "treat it as a possible serious engine problem and land as soon as practicable per AFM guidance",
      "increase cruise power immediately",
      "ignore it if CHT is normal",
    ],
    correctIndex: 0,
    explanation:
      "Low oil pressure with high oil temp can indicate impending engine failure — follow the AFM and plan an expedient landing.",
    reference: "Airplane Flying Handbook; AFM/POH",
  },
  {
    id: "sys-10",
    section: "systems",
    question:
      "Alternate static source, when opened in an unpressurized cabin, typically causes",
    options: [
      "slightly higher than normal indicated altitude and airspeed because cabin pressure is lower than outside static",
      "zero airspeed",
      "a frozen attitude indicator",
    ],
    correctIndex: 0,
    explanation:
      "Cabin static is usually a bit lower pressure than true outside static, so ASI/altimeter/VSI read slightly high — check AFM corrections.",
    reference: "PHAK Ch. 8",
  },
  {
    id: "sys-11",
    section: "systems",
    question:
      "Magneto ignition systems are designed so that",
    options: [
      "each magneto can fire all cylinders independently if the other fails",
      "both magnetos must always operate or the engine stops instantly with no power",
      "the battery must be on for the magnetos to spark in flight",
    ],
    correctIndex: 0,
    explanation:
      "Dual magnetos provide redundancy; either system alone can keep the engine running (with reduced power/smoothness).",
    reference: "PHAK Ch. 7",
  },
  {
    id: "sys-12",
    section: "systems",
    question:
      "Pressure altitude is obtained by",
    options: [
      "setting the altimeter to 29.92 inHg and reading the indicated altitude",
      "setting field elevation into the Kollsman window",
      "subtracting temperature error only",
    ],
    correctIndex: 0,
    explanation:
      "Pressure altitude is indicated altitude when 29.92 is set — used for performance charts and flight levels.",
    reference: "PHAK Ch. 8 / 11",
  },

  // ─── Airport Ops & Communications ─────────────────────────────────────────
  {
    id: "apt-01",
    section: "airport",
    question:
      "A steady green light-gun signal to an aircraft in flight means",
    options: [
      "cleared to land",
      "return for landing",
      "exercise extreme caution",
    ],
    correctIndex: 0,
    explanation:
      "In-flight steady green = cleared to land. Steady red = give way / continue circling. Flashing red = airport unsafe — do not land.",
    reference: "AIM 4-3-13",
  },
  {
    id: "apt-02",
    section: "airport",
    question:
      "A flashing white light-gun signal to an aircraft on the ground means",
    options: [
      "return to starting point on the airport",
      "cleared for takeoff",
      "taxi clear of the runway immediately",
    ],
    correctIndex: 0,
    explanation:
      "Flashing white (ground) = return to starting point on the airport.",
    reference: "AIM 4-3-13",
  },
  {
    id: "apt-03",
    section: "airport",
    question:
      "When landing behind a heavy aircraft, a good wake-turbulence avoidance technique is to",
    options: [
      "stay above the heavy’s flight path and land beyond its touchdown point",
      "duck under and land short of its touchdown point",
      "plan to touch down exactly on its tire marks",
    ],
    correctIndex: 0,
    explanation:
      "Wake sinks and spreads. Stay above the leader’s path and land beyond its touchdown point; on takeoff, rotate prior to its rotation point and climb above its path.",
    reference: "AIM 7-3-1",
  },
  {
    id: "apt-04",
    section: "airport",
    question:
      "A segmented circle at an uncontrolled airport is used to",
    options: [
      "indicate traffic pattern direction and landing runway information when present with other indicators",
      "mark the exact geographic center of Class B airspace",
      "replace the need for a windsock",
    ],
    correctIndex: 0,
    explanation:
      "The segmented circle system shows pattern direction (and related indicators). Always combine with wind indicators and Chart Supplement procedures.",
    reference: "AIM 4-3-3",
  },
  {
    id: "apt-05",
    section: "airport",
    question:
      "On a standard left-hand traffic pattern, the downwind leg is flown",
    options: [
      "parallel to the landing runway, in the opposite direction of landing, at pattern altitude",
      "perpendicular to the runway at 3,000 feet AGL",
      "only at night",
    ],
    correctIndex: 0,
    explanation:
      "Downwind is parallel and opposite the landing direction, typically about 1,000′ AGL unless Chart Supplement / local procedure says otherwise.",
    reference: "AIM 4-3-3",
  },
  {
    id: "apt-06",
    section: "airport",
    question:
      "A runway with a displaced threshold may be used for",
    options: [
      "taxi, takeoff, and rollout, but not for landing on the displaced portion (unless otherwise authorized)",
      "landing only on the displaced portion",
      "nothing — it is closed pavement",
    ],
    correctIndex: 0,
    explanation:
      "The displaced threshold area is available for taxi/takeoff/rollout but not for landing touchdown (except as specifically authorized).",
    reference: "AIM 2-3-3",
  },
  {
    id: "apt-07",
    section: "airport",
    question:
      "CTAF is used primarily to",
    options: [
      "self-announce position and intentions at nontowered airports",
      "receive IFR clearances only",
      "talk exclusively to Center",
    ],
    correctIndex: 0,
    explanation:
      "Common Traffic Advisory Frequency supports airport advisory / self-announce procedures at nontowered fields.",
    reference: "AIM 4-1-9",
  },
  {
    id: "apt-08",
    section: "airport",
    question:
      "On a PAPI, four white lights generally indicate you are",
    options: [
      "too high on the approach path",
      "on glidepath",
      "too low on the approach path",
    ],
    correctIndex: 0,
    explanation:
      "PAPI: four white = high; two white / two red = on path; four red = low. Confirm the specific system in the AIM/AFM.",
    reference: "AIM 2-1-2",
  },
  {
    id: "apt-09",
    section: "airport",
    question:
      "A VASI showing red over red means",
    options: [
      "below the glide path",
      "on the glide path",
      "above the glide path",
    ],
    correctIndex: 0,
    explanation:
      "Classic memory aid: red over red — you’re dead (too low). White over white — too high. Red over white — on path.",
    reference: "AIM 2-1-2",
  },
  {
    id: "apt-10",
    section: "airport",
    question:
      "Hold-short lines consist of",
    options: [
      "four yellow lines: two solid and two dashed, with the solid lines on the side where you must stop",
      "two white dashed lines only",
      "a single red line across the taxiway",
    ],
    correctIndex: 0,
    explanation:
      "Runway holding position markings: solid lines on the side you must not cross without clearance; dashed on the runway side.",
    reference: "AIM 2-3-5",
  },
  {
    id: "apt-11",
    section: "airport",
    question:
      "When ATC says “line up and wait,” you should",
    options: [
      "taxi onto the departure runway and hold in position for takeoff clearance",
      "take off immediately",
      "exit the runway and contact ground",
    ],
    correctIndex: 0,
    explanation:
      "Line up and wait means enter the runway and hold; takeoff clearance will be issued separately.",
    reference: "AIM 4-3-18",
  },
  {
    id: "apt-12",
    section: "airport",
    question:
      "A large painted “X” at each end of a runway indicates",
    options: [
      "the runway is closed",
      "displaced threshold only",
      "glider operations preferred",
    ],
    correctIndex: 0,
    explanation:
      "A closed runway is marked with an X at each end (and often along the runway).",
    reference: "AIM 2-3-6",
  },

  // ─── Navigation & Cross-Country ───────────────────────────────────────────
  {
    id: "nav-01",
    section: "nav",
    question:
      "Magnetic course differs from true course by",
    options: [
      "magnetic variation (and, when converting heading, also deviation)",
      "only wind correction angle",
      "only compressibility error",
    ],
    correctIndex: 0,
    explanation:
      "True course ± variation = magnetic course. Magnetic heading further applies deviation from the compass card.",
    reference: "PHAK Ch. 16",
  },
  {
    id: "nav-02",
    section: "nav",
    question:
      "A VOR station transmits",
    options: [
      "courses (radials) referenced to magnetic north at the station (with noted exceptions)",
      "GPS latitude/longitude only",
      "ILS glideslope only",
    ],
    correctIndex: 0,
    explanation:
      "VORs provide magnetic radials from the station. Always check NOTAMs and Chart Supplement for unusable radials / outages.",
    reference: "AIM 1-1-3",
  },
  {
    id: "nav-03",
    section: "nav",
    question:
      "On a sectional chart, a magenta shaded area around an airport typically indicates",
    options: [
      "Class E surface area beginning at 700 feet AGL (floor of the Class E transition)",
      "Class A airspace",
      "prohibited area",
    ],
    correctIndex: 0,
    explanation:
      "Faded magenta vignette: Class E floor at 700′ AGL. Hard magenta boundary indicates surface Class E.",
    reference: "Sectional Chart Legend; AIM 3-2-6",
  },
  {
    id: "nav-04",
    section: "nav",
    question:
      "If you become lost VFR, a sound first step is to",
    options: [
      "climb if able for better visibility/radio, confess the situation, comply with ATC/FSS guidance, and conserve fuel",
      "descend immediately into uncontrolled airspace without a plan",
      "squawk 7500 and continue off-course",
    ],
    correctIndex: 0,
    explanation:
      "Classic 4 Cs: Climb, Communicate, Confess, Comply (and conserve). Squawk 7700 only if it’s a true emergency.",
    reference: "Airplane Flying Handbook; AIM",
  },
  {
    id: "nav-05",
    section: "nav",
    question:
      "GPS RAIM prediction is important for IFR GPS approaches because",
    options: [
      "it checks whether enough satellites will support the integrity monitoring needed for the operation",
      "it measures fuel burn",
      "it replaces the need for an altimeter",
    ],
    correctIndex: 0,
    explanation:
      "RAIM predicts whether GPS integrity monitoring will be available. VFR GPS use is more flexible but still verify databases and procedures.",
    reference: "AIM 1-1-17",
  },
  {
    id: "nav-06",
    section: "nav",
    question:
      "True airspeed is generally higher than indicated airspeed at altitude because",
    options: [
      "air density decreases with altitude",
      "the pitot tube always under-reads on the ground only",
      "magnetic variation increases",
    ],
    correctIndex: 0,
    explanation:
      "For a given IAS, TAS increases as density decreases with altitude (and temperature).",
    reference: "PHAK Ch. 8 / 11",
  },
  {
    id: "nav-07",
    section: "nav",
    question:
      "A blue airport symbol on a VFR sectional typically means",
    options: [
      "the airport has a control tower in operation at least part of the time",
      "the airport is abandoned",
      "only seaplane operations",
    ],
    correctIndex: 0,
    explanation:
      "Blue = towered (at least part-time). Magenta = nontowered. Always check Chart Supplement for hours.",
    reference: "Sectional Chart Legend",
  },
  {
    id: "nav-08",
    section: "nav",
    question:
      "When converting from true heading to compass heading you must apply",
    options: [
      "variation and then compass deviation",
      "wind correction only",
      "density altitude only",
    ],
    correctIndex: 0,
    explanation:
      "THdg ± variation = MHdg ± deviation = CHdg. Wind correction is applied when going from course to heading.",
    reference: "PHAK Ch. 16",
  },
  {
    id: "nav-09",
    section: "nav",
    question:
      "Fuel planning for a cross-country should include",
    options: [
      "taxi/run-up, climb, cruise, descent, reserves required by regulation, and contingency for wind",
      "cruise fuel only at brochure TAS",
      "only the fuel required to reach the destination with zero reserve",
    ],
    correctIndex: 0,
    explanation:
      "Real planning covers all phases plus regulatory reserves and wind. Brochure numbers are not a flight plan.",
    reference: "14 CFR 91.151; PHAK Ch. 11",
  },
  {
    id: "nav-10",
    section: "nav",
    question:
      "A Temporary Flight Restriction (TFR) is",
    options: [
      "a short-term restriction published via FDC NOTAM that can prohibit or limit flight in a defined area",
      "a permanent Class B charting change",
      "only advisory and never regulatory",
    ],
    correctIndex: 0,
    explanation:
      "TFRs are regulatory restrictions — check NOTAMs before every flight.",
    reference: "14 CFR 91.137–91.145; AIM 3-5-3",
  },
  {
    id: "nav-11",
    section: "nav",
    question:
      "Dead reckoning navigation primarily uses",
    options: [
      "heading, time, speed, and wind estimates from a known position",
      "only GPS moving map without cross-check",
      "only ADF bearings",
    ],
    correctIndex: 0,
    explanation:
      "Dead reckoning projects position from known fix using heading/time/speed/wind. Cross-check with pilotage and radio aids.",
    reference: "PHAK Ch. 16",
  },
  {
    id: "nav-12",
    section: "nav",
    question:
      "Isogonic lines on a sectional chart show",
    options: [
      "magnetic variation",
      "true courses only",
      "MEAs for IFR airways",
    ],
    correctIndex: 0,
    explanation:
      "Isogonic lines depict magnetic variation — the angular difference between true and magnetic north.",
    reference: "PHAK Ch. 16; sectional legend",
  },

  // ─── Aeromedical & ADM ────────────────────────────────────────────────────
  {
    id: "hum-01",
    section: "human",
    question:
      "Hypoxic hypoxia is caused by",
    options: [
      "insufficient oxygen available to the lungs / blood due to altitude or similar conditions",
      "carbon monoxide binding to hemoglobin only",
      "middle-ear block only",
    ],
    correctIndex: 0,
    explanation:
      "Hypoxic hypoxia: not enough O₂ partial pressure (typical at altitude). Other hypoxia types include hypemic, stagnant, and histotoxic.",
    reference: "PHAK Ch. 17",
  },
  {
    id: "hum-02",
    section: "human",
    question:
      "Without supplemental oxygen, night vision can begin to degrade noticeably around",
    options: [
      "5,000 feet MSL for many pilots",
      "18,000 feet MSL only",
      "sea level only on humid days",
    ],
    correctIndex: 0,
    explanation:
      "Night vision is oxygen-sensitive; many texts note degradation beginning near 5,000′. Regulatory O₂ requirements kick in at higher altitudes for longer exposures.",
    reference: "PHAK Ch. 17; 14 CFR 91.211",
  },
  {
    id: "hum-03",
    section: "human",
    question:
      "The IMSAFE checklist is used to",
    options: [
      "assess Illness, Medication, Stress, Alcohol, Fatigue, and Emotion before flight",
      "inspect magnetos only",
      "file IFR flight plans",
    ],
    correctIndex: 0,
    explanation:
      "IMSAFE is a personal minimums / aeromedical self-assessment mnemonic.",
    reference: "PHAK Ch. 2",
  },
  {
    id: "hum-04",
    section: "human",
    question:
      "Spatial disorientation is most likely when",
    options: [
      "visual references are lost and the vestibular system gives conflicting cues",
      "flying in clear VFR over familiar terrain with a good horizon",
      "taxiing slowly in a straight line",
    ],
    correctIndex: 0,
    explanation:
      "Without a reliable visual horizon, inner-ear illusions can overpower instrument scan if you are not proficient.",
    reference: "PHAK Ch. 17",
  },
  {
    id: "hum-05",
    section: "human",
    question:
      "Carbon monoxide poisoning is dangerous because CO",
    options: [
      "binds to hemoglobin more readily than oxygen, reducing oxygen delivery to tissues",
      "only causes ear pain",
      "improves night vision",
    ],
    correctIndex: 0,
    explanation:
      "CO causes hypemic hypoxia. Exhaust leaks into the cabin are a classic source — use a detector and ventilate.",
    reference: "PHAK Ch. 17",
  },
  {
    id: "hum-06",
    section: "human",
    question:
      "The “5P” ADM model commonly includes",
    options: [
      "Plan, Plane, Pilot, Passengers, Programming",
      "Power, Props, Mixture, Magnets, Master",
      "Pitch, Power, Trim, Talk, Transponder",
    ],
    correctIndex: 0,
    explanation:
      "5Ps: Plan, Plane, Pilot, Passengers, Programming — a structured way to reassess risk during a flight.",
    reference: "PHAK Ch. 2",
  },
  {
    id: "hum-07",
    section: "human",
    question:
      "Alcohol’s effect on flying is aggravated by altitude because",
    options: [
      "hypoxia and alcohol combine to impair judgment and performance more severely",
      "alcohol evaporates instantly above 3,000 feet",
      "regulations allow one drink per thousand feet",
    ],
    correctIndex: 0,
    explanation:
      "Altitude hypoxia compounds alcohol impairment. Part 91 also sets an 8-hour bottle-to-throttle rule and 0.04% BAC limit — personal minima should be stricter.",
    reference: "14 CFR 91.17; PHAK Ch. 17",
  },
  {
    id: "hum-08",
    section: "human",
    question:
      "Hyperventilation symptoms can mimic hypoxia. A useful distinction/response is to",
    options: [
      "slow the breathing rate and restore normal CO₂ levels; if unsure, treat as hypoxia and use oxygen if available",
      "always descend immediately with no other action",
      "hold your breath for five minutes",
    ],
    correctIndex: 0,
    explanation:
      "Hyperventilation blows off CO₂. Controlled breathing helps; when in doubt at altitude, use oxygen and fly the airplane.",
    reference: "PHAK Ch. 17",
  },
  {
    id: "hum-09",
    section: "human",
    question:
      "Empty-field myopia refers to",
    options: [
      "the eyes’ tendency to focus a few feet ahead when looking at a featureless sky or fog",
      "nearsightedness cured by climbing",
      "a type of runway illusion",
    ],
    correctIndex: 0,
    explanation:
      "Without distant visual targets, focus rests nearby — actively scan and look for distant references, especially in haze.",
    reference: "PHAK Ch. 17",
  },
  {
    id: "hum-10",
    section: "human",
    question:
      "Hazardous attitudes in ADM include",
    options: [
      "anti-authority, impulsivity, invulnerability, macho, and resignation",
      "only fear of flying",
      "only perfectionism",
    ],
    correctIndex: 0,
    explanation:
      "Recognize hazardous attitudes and apply antidotes (e.g., anti-authority → “Follow the rules; they are usually right”).",
    reference: "PHAK Ch. 2",
  },
  {
    id: "hum-11",
    section: "human",
    question:
      "Scuba diving before flying increases the risk of",
    options: [
      "decompression sickness (“the bends”) as cabin altitude rises",
      "carburetor ice",
      "VOR interference",
    ],
    correctIndex: 0,
    explanation:
      "Wait after diving before flying — commonly 12–24 hours depending on dive profile (see AIM / diving tables).",
    reference: "AIM 8-1-2; PHAK Ch. 17",
  },
  {
    id: "hum-12",
    section: "human",
    question:
      "A wide runway can create the illusion that you are",
    options: [
      "lower than you actually are, leading to a higher-than-normal approach",
      "higher than you actually are",
      "exactly on glidepath always",
    ],
    correctIndex: 0,
    explanation:
      "Wide runway → illusion of being low → tendency to fly a high approach. Narrow runway → opposite illusion.",
    reference: "PHAK Ch. 17",
  },

  // ─── Night Ops & Emergencies ──────────────────────────────────────────────
  {
    id: "nite-01",
    section: "night",
    question:
      "To carry passengers at night, a private pilot must have made",
    options: [
      "three takeoffs and three landings to a full stop during the period beginning 1 hour after sunset to 1 hour before sunrise within the preceding 90 days, in the same category/class (and type if required)",
      "any three landings in the preceding 30 days during daylight",
      "one night landing in the preceding year",
    ],
    correctIndex: 0,
    explanation:
      "Night passenger currency requires three full-stop landings in the defined night period within 90 days.",
    reference: "14 CFR 61.57(b)",
  },
  {
    id: "nite-02",
    section: "night",
    question:
      "Position lights are required to be on",
    options: [
      "during the period from sunset to sunrise (and when operating under IFR as required)",
      "only above 10,000 feet",
      "only in Class B",
    ],
    correctIndex: 0,
    explanation:
      "Aircraft position lights must be lighted from sunset to sunrise (with related anti-collision light rules).",
    reference: "14 CFR 91.209",
  },
  {
    id: "nite-03",
    section: "night",
    question:
      "Squawk 7700 means",
    options: [
      "general emergency",
      "radio failure",
      "unlawful interference (hijack)",
    ],
    correctIndex: 0,
    explanation:
      "7700 = emergency; 7600 = communications failure; 7500 = unlawful interference.",
    reference: "AIM 6-2 / 6-3; 14 CFR 91.209 context for lighting — squawk via AIM",
  },
  {
    id: "nite-04",
    section: "night",
    question:
      "Squawk 7600 means",
    options: [
      "lost communications",
      "general emergency",
      "VFR",
    ],
    correctIndex: 0,
    explanation:
      "7600 indicates communications failure. Follow AIM / FAR lost-comm procedures appropriate to VFR or IFR.",
    reference: "AIM 6-4-1; 14 CFR 91.185 (IFR)",
  },
  {
    id: "nite-05",
    section: "night",
    question:
      "After an engine failure in a single-engine airplane immediately after takeoff, the first priority is usually to",
    options: [
      "maintain aircraft control and establish best-glide / appropriate pitch attitude; land ahead if below a safe turn-back height",
      "immediately turn back to the runway regardless of altitude",
      "troubleshoot radios first",
    ],
    correctIndex: 0,
    explanation:
      "Aviate first. Low-altitude turn-backs are often fatal; land ahead within the available field of view unless trained and above a safe altitude.",
    reference: "Airplane Flying Handbook Ch. 18",
  },
  {
    id: "nite-06",
    section: "night",
    question:
      "Night visual illusions can make a cloud layer or featureless terrain appear",
    options: [
      "closer or differently oriented than it is — reinforce with instruments and a disciplined scan",
      "impossible to misjudge",
      "only a problem for jet aircraft",
    ],
    correctIndex: 0,
    explanation:
      "Autokinesis, black-hole approaches, and false horizons are classic night hazards — use instruments and lighting wisely.",
    reference: "PHAK Ch. 17",
  },
  {
    id: "nite-07",
    section: "night",
    question:
      "A rotating beacon at a civilian land airport normally shows",
    options: [
      "white and green",
      "white and yellow",
      "green and yellow only",
    ],
    correctIndex: 0,
    explanation:
      "Civilian land airport: white-green. Water airport: white-yellow. Heliport: white-green-yellow. Military: dual peaked white + green.",
    reference: "AIM 2-1-8",
  },
  {
    id: "nite-08",
    section: "night",
    question:
      "If you experience a radio failure in VFR conditions near a towered airport, you should",
    options: [
      "squawk 7600, remain outside/enter per light-gun signals, and look for light-gun instructions",
      "enter Class B without clearance and land anywhere",
      "squawk 7500",
    ],
    correctIndex: 0,
    explanation:
      "Lost-comm VFR: squawk 7600 and follow light-gun signals / AIM procedures. Do not confuse with 7500.",
    reference: "AIM 6-4-1; 4-3-13",
  },
  {
    id: "nite-09",
    section: "night",
    question:
      "Minimum night VFR fuel reserve for airplanes is",
    options: [
      "45 minutes at normal cruising speed after reaching the first point of intended landing",
      "30 minutes",
      "15 minutes",
    ],
    correctIndex: 0,
    explanation:
      "Night VFR airplane reserve is 45 minutes; day is 30 minutes.",
    reference: "14 CFR 91.151(a)",
  },
  {
    id: "nite-10",
    section: "night",
    question:
      "An electrical fire in flight should be handled by",
    options: [
      "following the AFM checklist — typically isolating electrical power and using the appropriate extinguisher while maintaining aircraft control",
      "opening all windows immediately regardless of checklist",
      "increasing alternator output",
    ],
    correctIndex: 0,
    explanation:
      "Use the AFM/POH emergency checklist. Control the airplane first; then isolate and extinguish as directed.",
    reference: "Airplane Flying Handbook; AFM/POH",
  },
  {
    id: "nite-11",
    section: "night",
    question:
      "Partial panel (vacuum failure) practice emphasizes",
    options: [
      "using remaining instruments — typically turn coordinator, ASI, altimeter, and VSI — with careful pitch/bank control",
      "relying solely on the attitude indicator",
      "ignoring the turn coordinator",
    ],
    correctIndex: 0,
    explanation:
      "Know which instruments remain after vacuum or electrical failure in your airplane and practice partial-panel control.",
    reference: "Instrument Flying Handbook; PHAK Ch. 8",
  },
  {
    id: "nite-12",
    section: "night",
    question:
      "A black-hole approach illusion occurs when",
    options: [
      "dark featureless terrain between you and runway lights makes you feel higher than you are, risking a low approach",
      "the sun is directly ahead at noon",
      "flying over brightly lit cities only",
    ],
    correctIndex: 0,
    explanation:
      "Black-hole approaches lack peripheral ground cues — use an electronic glidepath or VASI/PAPI and trust instruments.",
    reference: "PHAK Ch. 17",
  },
];

export function questionsForSection(
  sectionId: QuizSectionId | "all"
): QuizQuestion[] {
  if (sectionId === "all") return QUIZ_QUESTIONS;
  return QUIZ_QUESTIONS.filter((q) => q.section === sectionId);
}

export function sectionById(id: QuizSectionId): QuizSection | undefined {
  return QUIZ_SECTIONS.find((s) => s.id === id);
}
