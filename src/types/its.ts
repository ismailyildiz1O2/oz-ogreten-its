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

export interface ChatMessage {
  id: string;
  role: "tutor" | "student" | "system";
  content: string;
  timestamp: string;
  detectedMisconception?: string | null;
  simulationApplied?: SimulationUpdatePayload | null;
  bktDelta?: {
    skillId: string;
    previousPL: number;
    newPL: number;
    isCorrect: boolean;
  } | null;
}

export interface TutorAPIRequest {
  message: string;
  history: Array<{ role: "tutor" | "student"; content: string }>;
  simulationState: {
    planet: PlanetId;
    gravity: number;
    mass: number;
    weight: number;
  };
  skills: Record<string, SkillMastery>;
}

export interface TutorAPIResponse {
  reply: string;
  detectedMisconception: string | null;
  updateSimulation: SimulationUpdatePayload | null;
  bktUpdate: BKTUpdatePayload | null;
  quickReplies?: string[];
  source?: "gemini" | "socratic-engine";
}
