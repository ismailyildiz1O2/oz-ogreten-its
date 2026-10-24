export type PlanetId = "earth" | "moon" | "mars" | "jupiter" | "space";

export interface PlanetInfo {
  id: PlanetId;
  name: string;
  gravity: number; // m/s^2
  color: string;
  accentColor: string;
  skyGradient: [string, string];
  surfaceColor: string;
  description: string;
  badgeText: string;
}

export interface BKTParams {
  pL: number; // Mevcut öğrenme olasılığı P(L_n)
  pT: number; // Öğrenme geçiş olasılığı P(T) - Örn: 0.15
  pS: number; // Dikkatsizlik hatası (Slip) P(S) - Örn: 0.10
  pG: number; // Tahmin etme (Guess) P(G) - Örn: 0.20
}

export interface SkillMastery {
  skillId: string;
  code: string;
  title: string;
  description: string;
  processComponents?: string[];
  params: BKTParams;
  attempts: number;
  lastUpdated?: string;
}

export interface MisconceptionItem {
  id: string;
  code: string;
  title: string;
  studentPattern: string;
  scientificTruth: string;
  socraticHint: string;
  relatedSkillId: string;
  recommendedExperiment: {
    planet: PlanetId;
    mass: number;
    focusPrompt: string;
  };
}

export interface SimulationUpdatePayload {
  planet?: PlanetId;
  mass?: number;
}

export interface BKTUpdatePayload {
  skillId: string;
  isCorrect: boolean;
  reason?: string;
}

export interface BKTHistoryEntry {
  id: string;
  timestamp: string;
  skillId: string;
  skillTitle: string;
  previousPL: number;
  newPL: number;
  isCorrect: boolean;
  reason: string;
}

export type SolutionMode = "proactive" | "reactive";

export interface ReactiveSolutionCard {
  correctAnswer: string;
  stepByStep: string[];
  distractorAnalysis: string;
  examTip: string;
  outcomeCode: string;
}

export interface ChatMessage {
  id: string;
  role: "tutor" | "student" | "system";
  content: string;
  timestamp: string;
  mode?: SolutionMode;
  imageDataUrl?: string | null;
  reactiveSolution?: ReactiveSolutionCard | null;
  detectedMisconception?: string | null;
  simulationApplied?: SimulationUpdatePayload | null;
  bktDelta?: {
    skillId: string;
    previousPL: number;
    newPL: number;
    isCorrect: boolean;
  } | null;
}

// ============================================================================
// Türkiye Yüzyılı Maarif Modeli (TYMM) Veri Tipleri (catalog.json, codes.json, units/*.json)
// ============================================================================

export interface TymmCodeItem {
  category: string;
  code: string;
  label: string;
  source?: string;
}

export interface TymmCatalogUnitSummary {
  unitId: number;
  title: string;
  hours: string;
  outcomesCount: number;
  outcomeCodes: string[];
}

export interface TymmCatalogSubject {
  subject: string;
  units: TymmCatalogUnitSummary[];
}

export interface TymmCatalogGrade {
  grade: number;
  gradeName: string;
  subjects: TymmCatalogSubject[];
}

export interface TymmCatalog {
  version: string;
  source: string;
  totalUnits: number;
  classes: TymmCatalogGrade[];
}

export interface TymmOutcome {
  code: string;
  title: string;
  processComponents: string[];
}

export interface TymmUnitDetail {
  unitId: number;
  grade: number;
  gradeName: string;
  subject: string;
  title: string;
  hours: string;
  description: string;
  outcomes: TymmOutcome[];
  keyConcepts: string;
  support: string[];
  enrichment: string[];
  assessment: string[];
  teachingApplications: string[];
  skills: {
    deger?: string[];
    egilim?: string[];
    kavramsal?: string[];
    okuryazarlik?: string[];
    sosyal_duygusal?: string[];
    alan?: string[];
  };
  sourceUrl?: string;
  resolvedSkills?: TymmCodeItem[];
}

export interface TutorAPIRequest {
  message: string;
  mode?: SolutionMode; // "proactive" (Sokratik adım adım) | "reactive" (Hızlı Çöz - tam çözüm)
  currentQuestion?: {
    text: string;
    imageDataUrl?: string | null;
    outcomeCode?: string;
  } | null;
  history: Array<{ role: "tutor" | "student"; content: string }>;
  simulationState: {
    planet: PlanetId;
    gravity: number;
    mass: number;
    weight: number;
  };
  skills: Record<string, SkillMastery>;
  activeUnit?: TymmUnitDetail | null;
  selectedOutcomeCode?: string;
}

export interface TutorAPIResponse {
  reply: string;
  mode: SolutionMode;
  reactiveSolution?: ReactiveSolutionCard | null;
  detectedMisconception: string | null;
  updateSimulation: SimulationUpdatePayload | null;
  bktUpdate: BKTUpdatePayload | null;
  quickReplies?: string[];
  source?: "gemini" | "socratic-engine";
}
