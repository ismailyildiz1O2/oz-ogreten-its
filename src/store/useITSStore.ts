import { create } from "zustand";
import {
  BKTHistoryEntry,
  ChatMessage,
  MisconceptionItem,
  PlanetId,
  ReactiveSolutionCard,
  SimulationUpdatePayload,
  SkillMastery,
  SolutionMode,
  TymmUnitDetail,
} from "@/types/its";
import {
  convertTymmUnitToSkills,
  DEFAULT_QUICK_REPLIES,
  DEFAULT_TYMM_UNIT,
  INITIAL_SKILLS,
  MISCONCEPTIONS,
  PLANETS,
} from "@/lib/curriculum-graph";
import { updateBKT } from "@/lib/bkt-engine";

export interface PendingTutorAction {
  message: string;
  mode: SolutionMode;
  imageDataUrl?: string | null;
}

interface ITSStoreState {
  // Fizik Simülasyonu Durumu
  planet: PlanetId;
  gravity: number;
  mass: number;
  simulationPulse: number;

  // TYMM Aktif Ünite, Kazanım ve Soru Çözüm Durumu
  activeUnit: TymmUnitDetail;
  selectedOutcomeCode: string;
  currentQuestionText: string;
  currentQuestionImage: string | null;
  lastReactiveSolution: ReactiveSolutionCard | null;

  isTymmModalOpen: boolean;
  whiteboardMode: "unit-board" | "physics-sim";
  pendingAction: PendingTutorAction | null;

  // BKT Bilişsel Öğrenci Modeli
  skills: Record<string, SkillMastery>;
  bktHistory: BKTHistoryEntry[];
  isBktModalOpen: boolean;

  // Kavram Yanılgısı Durumu
  activeMisconception: MisconceptionItem | null;
  misconceptionHistory: string[];

  // Sokratik Sohbet Durumu
  messages: ChatMessage[];
  quickReplies: string[];
  isTyping: boolean;

  // Mobil Görünüm Sekmesi
  mobileTab: "whiteboard" | "chat";

  // Eylemler (Actions)
  setPlanet: (planet: PlanetId) => void;
  setMass: (mass: number) => void;
  triggerPulse: () => void;
  applySimulationUpdate: (update: SimulationUpdatePayload) => void;

  setActiveUnit: (unit: TymmUnitDetail) => void;
  setSelectedOutcomeCode: (code: string) => void;
  setCurrentQuestionText: (text: string) => void;
  setCurrentQuestionImage: (dataUrl: string | null) => void;
  setLastReactiveSolution: (sol: ReactiveSolutionCard | null) => void;

  setTymmModalOpen: (isOpen: boolean) => void;
  setWhiteboardMode: (mode: "unit-board" | "physics-sim") => void;
  triggerTutorAction: (action: PendingTutorAction | null) => void;

  applyBKTUpdate: (
    skillId: string,
    isCorrect: boolean,
    reason?: string
  ) => { previousPL: number; newPL: number };
  resetBKT: () => void;
  setBktModalOpen: (isOpen: boolean) => void;

  setActiveMisconception: (code: string | null) => void;
  dismissMisconception: () => void;

  addMessage: (msg: ChatMessage) => void;
  setQuickReplies: (replies: string[]) => void;
  setIsTyping: (typing: boolean) => void;
  setMobileTab: (tab: "whiteboard" | "chat") => void;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-1",
  role: "tutor",
  content:
    "Merhaba! **Proaktif Sınav** sistemine hoş geldin.\n\n1. Üstten veya sol panelden çalıştığın **Sınıf, Ders ve Kazanımı** seç,\n2. Sınavda veya testte çözemediğin soruyu (metin ya da fotoğraf olarak) sol panele yükle,\n3. **🧠 Proaktif Çöz** butonuna basarsan sana cevabı doğrudan söylemeden ipuçlarıyla soruyu adım adım **senin çözmeni** sağlarım.\n4. **⚡ Hızlı Çöz** butonuna basarsan **Reaktif Mod** ile doğru şıkkı, adım adım tam çözümü ve çeldirici analizini anında gösteririm!",
  timestamp: "Şimdi",
  detectedMisconception: null,
  simulationApplied: null,
};

export const useITSStore = create<ITSStoreState>((set, get) => ({
  planet: "earth",
  gravity: PLANETS.earth.gravity,
  mass: 5,
  simulationPulse: 0,

  activeUnit: DEFAULT_TYMM_UNIT,
  selectedOutcomeCode: "FB.5.2.2.1",
  currentQuestionText: "",
  currentQuestionImage: null,
  lastReactiveSolution: null,

  isTymmModalOpen: false,
  whiteboardMode: "unit-board",
  pendingAction: null,

  skills: INITIAL_SKILLS,
  bktHistory: [
    {
      id: "init-bkt",
      timestamp: "Başlangıç",
      skillId: "FB.5.2.2.1",
      skillTitle:
        INITIAL_SKILLS["FB.5.2.2.1"]?.title ||
        "Kütleye etki eden yer çekimi kuvvetini ağırlık olarak tanımlayabilme",
      previousPL: 0.35,
      newPL: 0.35,
      isCorrect: true,
      reason: "TYMM Öğrenme Çıktısı başlangıç bilişsel profili yüklendi.",
    },
  ],
  isBktModalOpen: false,

  activeMisconception: null,
  misconceptionHistory: [],

  messages: [INITIAL_WELCOME_MESSAGE],
  quickReplies: [
    "Bu soruda ilk hangi ipucuna bakmalıyım?",
    "A ve B şıkları arasında kaldım, nasıl elerim?",
    "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
  ],
  isTyping: false,

  mobileTab: "whiteboard",

  setPlanet: (planet) => {
    const planetInfo = PLANETS[planet] || PLANETS.earth;
    set((state) => ({
      planet,
      gravity: planetInfo.gravity,
      simulationPulse: state.simulationPulse + 1,
    }));
  },

  setMass: (mass) => {
    const clamped = Math.min(20, Math.max(1, Math.round(mass)));
    set((state) => ({
      mass: clamped,
      simulationPulse: state.simulationPulse + 1,
    }));
  },

  triggerPulse: () => {
    set((state) => ({ simulationPulse: state.simulationPulse + 1 }));
  },

  applySimulationUpdate: (update) => {
    set((state) => {
      const nextPlanet =
        update.planet && PLANETS[update.planet] ? update.planet : state.planet;
      const nextGravity = PLANETS[nextPlanet].gravity;
      const nextMass =
        typeof update.mass === "number"
          ? Math.min(20, Math.max(1, Math.round(update.mass)))
          : state.mass;

      return {
        planet: nextPlanet,
        gravity: nextGravity,
        mass: nextMass,
        simulationPulse: state.simulationPulse + 1,
      };
    });
  },

  setActiveUnit: (unit) => {
    const newSkills = convertTymmUnitToSkills(unit);
    const firstSkill = Object.values(newSkills)[0];
    const validOutcomes = (unit.outcomes || []).filter(
      (o) => o.code && !o.code.startsWith("KAZ.")
    );
    const defaultCode =
      validOutcomes[0]?.code ||
      unit.outcomes?.[0]?.code ||
      firstSkill?.code ||
      `ÜNİTE-${unit.unitId}`;

    const now = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const unitAnnouncement: ChatMessage = {
      id: `unit-${Date.now()}`,
      role: "tutor",
      content: `📚 **Ders ve Ünite Seçildi:**\n**${unit.gradeName} • ${unit.subject}** — *${unit.title}*\n**Aktif Kazanım:** \`${defaultCode}\`\n\nŞimdi sol taraftaki **Soru Çözüm Masası**'na sınavda veya testte çözemediğin soruyu yapıştırabilir (veya fotoğrafını yükleyebilirsin).\n- **🧠 Proaktif Çöz** dersen birlikte adım adım çözeriz.\n- **⚡ Hızlı Çöz** dersen reaktif olarak tam çözümü ve doğru şıkkı anında açıklarım!`,
      timestamp: now,
    };

    set((state) => ({
      activeUnit: unit,
      selectedOutcomeCode: defaultCode,
      lastReactiveSolution: null,
      skills: newSkills,
      isTymmModalOpen: false,
      whiteboardMode: "unit-board",
      quickReplies: [
        "Bu soruda ilk hangi ipucuna bakmalıyım?",
        "Sorudaki kavramları kazanımla eşleştir",
        "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
      ],
      messages: [...state.messages, unitAnnouncement],
      bktHistory: [
        {
          id: `unit-bkt-${Date.now()}`,
          timestamp: now,
          skillId: firstSkill?.skillId || defaultCode,
          skillTitle: firstSkill?.title || unit.title,
          previousPL: firstSkill?.params.pL || 0.35,
          newPL: firstSkill?.params.pL || 0.35,
          isCorrect: true,
          reason: `TYMM Ünite #${unit.unitId} (${unit.title}) BKT modeline yüklendi.`,
        },
        ...state.bktHistory,
      ].slice(0, 25),
    }));
  },

  setSelectedOutcomeCode: (code) => set({ selectedOutcomeCode: code }),
  setCurrentQuestionText: (text) => set({ currentQuestionText: text }),
  setCurrentQuestionImage: (dataUrl) => set({ currentQuestionImage: dataUrl }),
  setLastReactiveSolution: (sol) => set({ lastReactiveSolution: sol }),

  setTymmModalOpen: (isOpen) => set({ isTymmModalOpen: isOpen }),
  setWhiteboardMode: (whiteboardMode) => set({ whiteboardMode }),
  triggerTutorAction: (pendingAction) => set({ pendingAction }),

  applyBKTUpdate: (skillId, isCorrect, reason) => {
    const currentSkills = get().skills;
    const skillKeys = Object.keys(currentSkills);
    const targetId = currentSkills[skillId]
      ? skillId
      : skillKeys[0] || get().selectedOutcomeCode || "FB.5.2.2.1";
    const skill = currentSkills[targetId];
    if (!skill) {
      return { previousPL: 0.35, newPL: 0.45 };
    }
    const previousPL = skill.params.pL;
    const newPL = updateBKT(skill.params, isCorrect);
    const now = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const updatedSkill: SkillMastery = {
      ...skill,
      params: {
        ...skill.params,
        pL: newPL,
      },
      attempts: skill.attempts + 1,
      lastUpdated: now,
    };

    const historyEntry: BKTHistoryEntry = {
      id: `bkt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      skillId: targetId,
      skillTitle: skill.title,
      previousPL,
      newPL,
      isCorrect,
      reason:
        reason ||
        (isCorrect
          ? "Proaktif soru çözüm adımında doğru çıkarım yapıldı."
          : "Soru çözüm adımında kavram yanılgısı gözlemlendi."),
    };

    set((state) => ({
      skills: {
        ...state.skills,
        [targetId]: updatedSkill,
      },
      bktHistory: [historyEntry, ...state.bktHistory].slice(0, 25),
    }));

    return { previousPL, newPL };
  },

  resetBKT: () => {
    const currentUnit = get().activeUnit;
    const resetSkills = convertTymmUnitToSkills(currentUnit);
    const firstSkill = Object.values(resetSkills)[0];
    set({
      skills: resetSkills,
      bktHistory: [
        {
          id: `reset-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          skillId: firstSkill?.skillId || "FB.5.2.2.1",
          skillTitle: "Tüm Öğrenme Çıktıları Sıfırlandı",
          previousPL: 0.35,
          newPL: 0.35,
          isCorrect: true,
          reason: "Öğrenci BKT modeli başlangıç parametrelerine sıfırlandı.",
        },
      ],
    });
  },

  setBktModalOpen: (isOpen) => set({ isBktModalOpen: isOpen }),

  setActiveMisconception: (code) => {
    if (!code) {
      set({ activeMisconception: null });
      return;
    }
    const normalized = code.toUpperCase().trim();
    const item =
      MISCONCEPTIONS[normalized] ||
      Object.values(MISCONCEPTIONS).find(
        (m) =>
          normalized.includes(m.code) ||
          normalized.toLowerCase().includes(m.title.toLowerCase())
      ) ||
      null;

    if (item) {
      set((state) => ({
        activeMisconception: item,
        misconceptionHistory: state.misconceptionHistory.includes(item.code)
          ? state.misconceptionHistory
          : [...state.misconceptionHistory, item.code],
      }));
    }
  },

  dismissMisconception: () => set({ activeMisconception: null }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setQuickReplies: (replies) => set({ quickReplies: replies }),

  setIsTyping: (isTyping) => set({ isTyping }),

  setMobileTab: (mobileTab) => set({ mobileTab }),
}));
