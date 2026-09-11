/**
 * Original Commercial Pilot (Airplane) practice — CAX track.
 *
 * Grounded in 14 CFR Part 61/91, AIM, handbooks, and
 * Commercial Pilot Airplane ACS (FAA-S-ACS-7B) topic areas.
 * NOT official FAA test items; NOT from commercial banks.
 */

import type { QuizQuestion, QuizSection } from "./types";

export const CAX_SECTIONS: QuizSection[] = [
  {
    id: "regs",
    title: "Commercial Privileges & Regs",
    short: "Regs",
    description: "Part 61 commercial privileges, limitations, medicals, and currency.",
  },
  {
    id: "performance",
    title: "Performance & Limitations",
    short: "Perf",
    description: "Weight & balance, density altitude, V-speeds, and takeoff/landing data.",
  },
  {
    id: "maneuvers",
    title: "Commercial Maneuvers Theory",
    short: "Maneuvers",
    description: "Steep turns, chandelles, lazy eights, eights-on-pylons, and stalls.",
  },
  {
    id: "systems",
    title: "Complex & Advanced Systems",
    short: "Systems",
    description: "Constant-speed props, retractable gear, flaps, and related failures.",
  },
  {
    id: "weather",
    title: "Weather & Cross-Country",
    short: "Weather",
    description: "Weather services, fronts, and commercial cross-country planning.",
  },
  {
    id: "human",
    title: "Human Factors & ADM",
    short: "Human",
    description: "Aeromedical factors, fatigue, and aeronautical decision-making.",
  },
];

export const CAX_QUESTIONS: QuizQuestion[] = [
  // ─── Regs ──────────────────────────────────────────────────────────────────
  {
    id: "cax-regs-01",
    section: "regs",
    question:
      "A commercial pilot certificate (airplane) allows the holder, with appropriate ratings and qualifications, to",
    options: [
      "Act as PIC of an aircraft carrying persons or property for compensation or hire (subject to Part 61/91/119/135 limitations)",
      "Operate any jet without a type rating",
      "Ignore medical certificate requirements",
    ],
    correctIndex: 0,
    explanation:
      "14 CFR 61.133 describes commercial privileges. Carriage for compensation/hire is further limited by Parts 119/135 and aircraft/operation rules.",
    reference: "14 CFR 61.133",
  },
  {
    id: "cax-regs-02",
    section: "regs",
    question:
      "To exercise the privileges of a commercial pilot certificate (airplane) as PIC, 14 CFR 61.23 generally requires at least a",
    options: [
      "Second-class medical certificate",
      "No medical certificate of any kind",
      "Only a student pilot certificate",
    ],
    correctIndex: 0,
    explanation:
      "Under 61.23, exercising commercial pilot privileges typically requires at least a second-class medical. (Glider/balloon exceptions and BasicMed limits are separate — BasicMed does not cover exercising commercial privileges for compensation/hire.)",
    reference: "14 CFR 61.23",
  },
  {
    id: "cax-regs-03",
    section: "regs",
    question:
      "Under 14 CFR 61.129, an applicant for a commercial ASEL certificate must log (among other requirements)",
    options: [
      "At least 250 hours of flight time as a pilot meeting the specific cross-country, night, instrument, and solo/PIC training breakdowns in 61.129",
      "Only 40 hours total time",
      "No cross-country experience",
    ],
    correctIndex: 0,
    explanation:
      "Commercial ASEL aeronautical experience is detailed in 61.129 (250 hours total with specific training and XC requirements, including dual and PIC segments).",
    reference: "14 CFR 61.129",
  },
  {
    id: "cax-regs-04",
    section: "regs",
    question:
      "A high-performance airplane endorsement (61.31(f)) is required to act as PIC of a high-performance airplane, meaning",
    options: [
      "An airplane with an engine of more than 200 horsepower",
      "Any airplane with flaps",
      "Only airplanes over 12,500 lb",
    ],
    correctIndex: 0,
    explanation:
      "High-performance: more than 200 horsepower. Complex: retractable landing gear, flaps, and controllable-pitch propeller (61.31(e)).",
    reference: "14 CFR 61.31(e)–(f)",
  },
  {
    id: "cax-regs-05",
    section: "regs",
    question:
      "To carry passengers as PIC, commercial (and private) pilots must meet recent flight experience under 61.57, including",
    options: [
      "Three takeoffs and three landings within the preceding 90 days in the same category/class (and type if required)",
      "One landing in the preceding year only",
      "No currency requirements",
    ],
    correctIndex: 0,
    explanation:
      "Passenger-carrying currency: 3 takeoffs and 3 landings in preceding 90 days (night has additional full-stop requirements).",
    reference: "14 CFR 61.57(a)–(b)",
  },
  {
    id: "cax-regs-06",
    section: "regs",
    question:
      "A second-in-command (SIC) professional development program or type-specific SIC qualification may be required when",
    options: [
      "Operating aircraft that require a type rating / two pilots by certification or operation rules",
      "Flying any Cessna 172 solo VFR",
      "Only for ultralights",
    ],
    correctIndex: 0,
    explanation:
      "Aircraft certification and operating rules (e.g., type certificate, Part 135/121) determine when two pilots or a type rating are required. Know 61.55/61.31 and your OpSpecs.",
    reference: "14 CFR 61.31; 61.55; aircraft TCDS",
  },

  // ─── Performance ───────────────────────────────────────────────────────────
  {
    id: "cax-perf-01",
    section: "performance",
    question:
      "Increasing density altitude causes",
    options: [
      "Reduced engine/propeller/rotor performance and longer takeoff distances / reduced climb",
      "Shorter takeoff rolls always",
      "Increased engine horsepower available",
    ],
    correctIndex: 0,
    explanation:
      "High density altitude (hot, high, humid) reduces air density → less power, less thrust/lift → longer takeoff and poorer climb.",
    reference: "PHAK Ch. 11; AFM/POH",
  },
  {
    id: "cax-perf-02",
    section: "performance",
    question:
      "Maneuvering speed (Va) is",
    options: [
      "The maximum speed at which the airplane can be stalled without exceeding limit load factor; Va decreases as weight decreases",
      "Never-exceed speed",
      "Best glide speed only",
    ],
    correctIndex: 0,
    explanation:
      "Va protects from full-control deflection loads. At lighter weights Va is lower — use the AFM chart/table for weight.",
    reference: "PHAK Ch. 5; AFM/POH",
  },
  {
    id: "cax-perf-03",
    section: "performance",
    question:
      "Center of gravity aft of the aft limit is dangerous because it can",
    options: [
      "Reduce pitch stability and stall recovery margin, and may make the airplane uncontrollable",
      "Always improve cruise speed safely beyond limits",
      "Have no effect on stability",
    ],
    correctIndex: 0,
    explanation:
      "Aft CG reduces static longitudinal stability and can lead to stall/spin recovery difficulty. Stay within published envelope.",
    reference: "PHAK Ch. 10; AFM/POH",
  },
  {
    id: "cax-perf-04",
    section: "performance",
    question:
      "VX is used to obtain",
    options: [
      "Best angle of climb — most altitude in shortest horizontal distance",
      "Best rate of climb — most altitude per time",
      "Maximum cruise speed",
    ],
    correctIndex: 0,
    explanation:
      "VX = best angle; VY = best rate. Use AFM speeds for configuration and conditions.",
    reference: "PHAK Ch. 11; AFM/POH",
  },
  {
    id: "cax-perf-05",
    section: "performance",
    question:
      "On a short-field takeoff, commercial technique typically emphasizes",
    options: [
      "Using AFM procedures — often flaps as specified, full power before brake release, rotate at specified speed, and climb at VX until obstacles are cleared",
      "Rotating well below stall speed",
      "Ignoring obstacle clearance speed",
    ],
    correctIndex: 0,
    explanation:
      "Follow the AFM/POH short-field procedure exactly; commercial ACS evaluates short-field takeoff and maximum performance climb.",
    reference: "Airplane Flying Handbook; AFM/POH; CAX ACS",
  },
  {
    id: "cax-perf-06",
    section: "performance",
    question:
      "Pressure altitude is",
    options: [
      "Altitude read when the altimeter is set to 29.92 inHg (standard datum)",
      "Always the same as density altitude",
      "Height above ground only",
    ],
    correctIndex: 0,
    explanation:
      "Pressure altitude = height above the standard datum plane (29.92). Density altitude corrects pressure altitude for nonstandard temperature.",
    reference: "PHAK Ch. 4 & 11",
  },

  // ─── Maneuvers ─────────────────────────────────────────────────────────────
  {
    id: "cax-man-01",
    section: "maneuvers",
    question:
      "In the Commercial Airplane ACS, steep turns are generally performed at",
    options: [
      "A bank of approximately 50° (commercial) while maintaining altitude and coordination",
      "15° of bank only",
      "90° of bank continuously",
    ],
    correctIndex: 0,
    explanation:
      "Commercial steep turns use a steeper bank than private (commercial ACS specifies about 50°). Divide attention and use coordinated rudder/back pressure as needed.",
    reference: "FAA-S-ACS-7B; Airplane Flying Handbook",
  },
  {
    id: "cax-man-02",
    section: "maneuvers",
    question:
      "A chandelle is",
    options: [
      "A maximum-performance climbing turn of about 180° ending near stall speed in level flight",
      "A spin entry demonstration",
      "A descent-only maneuver",
    ],
    correctIndex: 0,
    explanation:
      "Chandelle: climbing 180° turn to a precise heading near minimum controllable airspeed. Smooth coordination throughout.",
    reference: "Airplane Flying Handbook; CAX ACS Area V",
  },
  {
    id: "cax-man-03",
    section: "maneuvers",
    question:
      "Lazy eights emphasize",
    options: [
      "Constantly changing pitch, bank, and airspeed through two symmetrical 180° turns forming a figure-eight path over the ground reference",
      "Holding a fixed 60° bank",
      "Only climbs with no turns",
    ],
    correctIndex: 0,
    explanation:
      "Lazy eights develop coordination and planning through continuously changing control pressures; symmetry left/right is graded.",
    reference: "Airplane Flying Handbook; CAX ACS",
  },
  {
    id: "cax-man-04",
    section: "maneuvers",
    question:
      "Eights on pylons are flown so that",
    options: [
      "The airplane’s lateral axis remains aligned with the pylon using the pivotal altitude concept",
      "You always fly at pattern altitude regardless of groundspeed",
      "Bank never changes",
    ],
    correctIndex: 0,
    explanation:
      "Pivotal altitude varies with groundspeed. Maintain line-of-sight on the pylon by adjusting altitude/bank as groundspeed changes.",
    reference: "Airplane Flying Handbook; CAX ACS",
  },
  {
    id: "cax-man-05",
    section: "maneuvers",
    question:
      "Accelerated stalls can occur at",
    options: [
      "Higher indicated airspeeds when load factor is increased (e.g., steep turns or abrupt pull-ups)",
      "Only at published Vs speed in level flight",
      "Only with flaps extended",
    ],
    correctIndex: 0,
    explanation:
      "Stall speed increases with the square root of load factor. High-G maneuvering raises stall speed.",
    reference: "PHAK Ch. 5; Airplane Flying Handbook",
  },
  {
    id: "cax-man-06",
    section: "maneuvers",
    question:
      "Power-off stalls (approach) practice recovers by",
    options: [
      "Reducing AOA, adding power as appropriate, and returning to coordinated climb/level flight with minimal altitude loss",
      "Pulling harder aft yoke without reducing AOA",
      "Applying only aileron against a wing drop",
    ],
    correctIndex: 0,
    explanation:
      "Primary stall recovery: reduce angle of attack. Then add power, coordinate, and configure per AFM — ailerons carefully if a wing drops.",
    reference: "Airplane Flying Handbook; ACS",
  },

  // ─── Systems ───────────────────────────────────────────────────────────────
  {
    id: "cax-sys-01",
    section: "systems",
    question:
      "A constant-speed propeller allows the pilot to",
    options: [
      "Select RPM with the prop control while the governor varies blade angle to maintain that RPM",
      "Only change RPM with the throttle",
      "Eliminate the need for mixture control",
    ],
    correctIndex: 0,
    explanation:
      "Prop lever sets RPM; governor adjusts blade pitch. Throttle sets manifold pressure (power). Follow AFM for MP/RPM combinations.",
    reference: "PHAK Ch. 7; AFM/POH",
  },
  {
    id: "cax-sys-02",
    section: "systems",
    question:
      "If oil pressure is lost to a typical single-engine constant-speed propeller governor, many designs",
    options: [
      "Drive the propeller toward high pitch / low RPM (fail-safe toward feather-like coarse pitch on some; know your AFM — often low RPM/coarse)",
      "Always go to maximum RPM automatically for safety in every model",
      "Have no change in blade angle",
    ],
    correctIndex: 0,
    explanation:
      "Most light-aircraft constant-speed props use oil pressure to decrease pitch (increase RPM). Oil loss → springs/counterweights move toward high pitch/low RPM. Confirm your AFM — multiengine feathering systems differ.",
    reference: "PHAK Ch. 7; AFM/POH",
  },
  {
    id: "cax-sys-03",
    section: "systems",
    question:
      "Before retracting landing gear after takeoff, ensure",
    options: [
      "Positive rate of climb and safe altitude/airspeed per AFM — and that gear will clear obstacles",
      "Immediate retraction the instant the nosewheel lifts regardless of climb",
      "Gear up before rotating",
    ],
    correctIndex: 0,
    explanation:
      "Confirm positive climb and follow AFM gear-cycle speeds (Vlo/Vle). Premature retraction risks sink-back onto the runway.",
    reference: "Airplane Flying Handbook; AFM/POH",
  },
  {
    id: "cax-sys-04",
    section: "systems",
    question:
      "VLE is",
    options: [
      "Maximum landing gear extended speed",
      "Never-exceed speed",
      "Best glide only",
    ],
    correctIndex: 0,
    explanation:
      "VLE = max speed with gear extended; VLO = max speed for operating the gear. Exceeding them can damage gear doors/mechanisms.",
    reference: "PHAK Ch. 11; AFM/POH",
  },
  {
    id: "cax-sys-05",
    section: "systems",
    question:
      "Detonation in an aircraft engine is",
    options: [
      "Explosive/uneven combustion that can damage pistons — often from low octane, high MP, high temp, or overly lean mixture at high power",
      "Normal smooth combustion",
      "Only an electrical issue",
    ],
    correctIndex: 0,
    explanation:
      "Avoid detonation: proper fuel grade, MP/RPM limits, mixture, and cowl flaps/temps per AFM.",
    reference: "PHAK Ch. 7",
  },
  {
    id: "cax-sys-06",
    section: "systems",
    question:
      "A complex airplane under 14 CFR 61.31(e) has",
    options: [
      "A retractable landing gear, flaps, and a controllable-pitch propeller",
      "Any GPS installation",
      "Only a fixed-pitch prop and fixed gear",
    ],
    correctIndex: 0,
    explanation:
      "Complex = retractable gear + flaps + controllable-pitch prop. Endorsement required to act as PIC (with exceptions in the rule).",
    reference: "14 CFR 61.31(e)",
  },

  // ─── Weather ───────────────────────────────────────────────────────────────
  {
    id: "cax-wx-01",
    section: "weather",
    question:
      "AIRMET Sierra describes",
    options: [
      "IFR conditions and/or extensive mountain obscuration",
      "Severe icing only",
      "Tropical cyclone forecasts only",
    ],
    correctIndex: 0,
    explanation:
      "AIRMET S: IFR and mountain obscuration; T: turbulence; Z: icing. SIGMETs cover more severe phenomena.",
    reference: "AIM 7-1-6; Aviation Weather Handbook",
  },
  {
    id: "cax-wx-02",
    section: "weather",
    question:
      "Wind shear on final approach is hazardous because it can cause",
    options: [
      "Sudden airspeed/altitude losses (or gains) that may exceed residual performance capability",
      "Only a slight heading change with no performance effect",
      "Improved climb always",
    ],
    correctIndex: 0,
    explanation:
      "Recognize shear cues; be prepared to go around / escape. Low-level shear near thunderstorms or frontal zones is critical.",
    reference: "AIM 7-1-26; Airplane Flying Handbook",
  },
  {
    id: "cax-wx-03",
    section: "weather",
    question:
      "When planning a commercial cross-country, legal weather minimums alone are insufficient — you should also",
    options: [
      "Apply personal/company minimums, alternates, fuel reserves, and risk management for the entire flight",
      "Launch whenever airports are reporting exactly minimums with no reserve plan",
      "Ignore METARs if a TAF looks good",
    ],
    correctIndex: 0,
    explanation:
      "ACS/ADM expect scenario-based risk management beyond bare legal minima — fuel, daylight, fatigue, and go/no-go criteria.",
    reference: "PHAK Ch. 2; CAX ACS Area I",
  },
  {
    id: "cax-wx-04",
    section: "weather",
    question:
      "Frost on the wings before takeoff",
    options: [
      "Must be removed — frost disrupts airflow and can prevent takeoff / cause control problems",
      "Is aerodynamic decoration and can be ignored",
      "Only affects jet aircraft",
    ],
    correctIndex: 0,
    explanation:
      "Even thin frost can seriously degrade lift. 91.527 / clean aircraft concept — do not take off with frost, ice, or snow adhering to critical surfaces.",
    reference: "AIM 7-1-21; AFM/POH limitations; clean aircraft concept",
  },
  {
    id: "cax-wx-05",
    section: "weather",
    question:
      "A warm front often brings",
    options: [
      "Widespread stratiform clouds, steady precipitation, and possible IFR over a large area ahead of the front",
      "Only a narrow line of thunderstorms with clear air immediately after always",
      "No icing risk ever",
    ],
    correctIndex: 0,
    explanation:
      "Warm fronts: gradual slope, large IFR areas, possible freezing rain. Plan fuel and alternates accordingly.",
    reference: "Aviation Weather Handbook; PHAK Ch. 12",
  },
  {
    id: "cax-wx-06",
    section: "weather",
    question:
      "Convective SIGMETs imply",
    options: [
      "Severe or embedded thunderstorms, lines of thunderstorms, or heavy precipitation affecting large areas — avoid",
      "Mild haze only",
      "VFR only conditions guaranteed",
    ],
    correctIndex: 0,
    explanation:
      "Convective SIGMETs are serious convective warnings. Delay, divert, or deviate well clear.",
    reference: "AIM 7-1-6",
  },

  // ─── Human ─────────────────────────────────────────────────────────────────
  {
    id: "cax-hum-01",
    section: "human",
    question:
      "Hypoxia symptoms may include",
    options: [
      "Impaired judgment, euphoria, headache, tingling, and cyanosis — especially at altitude",
      "Improved night vision only",
      "Only muscle cramps in the legs",
    ],
    correctIndex: 0,
    explanation:
      "Know your symptoms; use oxygen per 91.211 and AFM. Time of useful consciousness decreases with altitude.",
    reference: "PHAK Ch. 17; 14 CFR 91.211",
  },
  {
    id: "cax-hum-02",
    section: "human",
    question:
      "The IMSAFE checklist screens for",
    options: [
      "Illness, Medication, Stress, Alcohol, Fatigue, Emotion — personal readiness to fly",
      "Only aircraft fuel status",
      "ATC route preferences",
    ],
    correctIndex: 0,
    explanation:
      "IMSAFE is a standard personal minimums / fitness-to-fly self-assessment before acting as PIC.",
    reference: "PHAK Ch. 2",
  },
  {
    id: "cax-hum-03",
    section: "human",
    question:
      "Alcohol rules under 14 CFR 91.17 prohibit acting as crewmember",
    options: [
      "Within 8 hours of consuming alcohol, while under the influence, or with BAC 0.04% or more",
      "Only within 2 hours of drinking",
      "With no quantitative BAC limit",
    ],
    correctIndex: 0,
    explanation:
      "8 hours bottle-to-throttle; no acting under the influence; BAC ≥ 0.04% prohibited. Hangover effects also impair.",
    reference: "14 CFR 91.17",
  },
  {
    id: "cax-hum-04",
    section: "human",
    question:
      "Hazardous attitudes in ADM include",
    options: [
      "Anti-authority, impulsivity, invulnerability, macho, and resignation — each with antidotes",
      "Only meticulous checklist use",
      "Strict adherence to SOPs",
    ],
    correctIndex: 0,
    explanation:
      "Recognize hazardous attitudes and apply antidotes (e.g., anti-authority → “follow the rules; they are usually right”).",
    reference: "PHAK Ch. 2",
  },
  {
    id: "cax-hum-05",
    section: "human",
    question:
      "Spatial disorientation is more likely when",
    options: [
      "Visual references are lost and the vestibular system provides conflicting sensations",
      "Flying in clear VMC with a defined horizon",
      "Sitting still on the ramp",
    ],
    correctIndex: 0,
    explanation:
      "Trust instruments in IMC or at night without horizon. Avoid abrupt head movements in instrument conditions.",
    reference: "PHAK Ch. 17; Instrument Flying Handbook",
  },
  {
    id: "cax-hum-06",
    section: "human",
    question:
      "Fatigue management for commercial operations should include",
    options: [
      "Adequate sleep, recognizing acute/chronic fatigue, and declining flights when unsafe",
      "Relying on caffeine as a complete substitute for sleep",
      "Flying consecutive all-nighters without rest",
    ],
    correctIndex: 0,
    explanation:
      "Fatigue degrades judgment and reaction time. Professional pilots use rest discipline and personal minimums.",
    reference: "PHAK Ch. 17; CAX ACS human factors",
  },
];
