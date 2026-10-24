import { create } from "zustand";
import {
  BKTHistoryEntry,
  ChatMessage,
  MisconceptionItem,
  PlanetId,
  SimulationUpdatePayload,
  SkillMastery,
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

interface ITSStoreState {
  // Fizik Simülasyonu Durumu
  planet: PlanetId;
  gravity: number;
  mass: number; // kg (1 - 20)
  simulationPulse: number;

  // TYMM (Türkiye Yüzyılı Maarif Modeli) Aktif Ünite Durumu
  activeUnit: TymmUnitDetail;
  isTymmModalOpen: boolean;
  whiteboardMode: "physics-sim" | "unit-board";
  pendingPrompt: string | null;

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

  // Mobil Görünüm Sekmesi (iOS / Android Split-Pane Toggle)
  mobileTab: "whiteboard" | "chat";

  // Eylemler (Actions)
  setPlanet: (planet: PlanetId) => void;
  setMass: (mass: number) => void;
  triggerPulse: () => void;
  applySimulationUpdate: (update: SimulationUpdatePayload) => void;

  setActiveUnit: (unit: TymmUnitDetail) => void;
  setTymmModalOpen: (isOpen: boolean) => void;
  setWhiteboardMode: (mode: "physics-sim" | "unit-board") => void;
  setPendingPrompt: (prompt: string | null) => void;

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
    "Merhaba! Ben **Proaktif Sınav**, Türkiye Yüzyılı Maarif Modeli (**TYMM**) Sokratik değerlendirme ve öğrenme rehberin. Şu an **Kuvveti Tanıyalım — Kütle ve Ağırlık İlişkisi (`FB.5.2.2.1`)** ünitesindeyiz. Sol taraftaki laboratuvarda bir **Eşit Kollu Terazi** ve bir **Dinamometre** görüyorsun. **Dünya**'dayız ($g = 9.81\\text{ m/s}^2$) ve her iki araçta da **$5\\text{ kg}$** kütleli özdeş bloklar asılı.\n\nSence bu iki ölçüm aleti ile **Ay'a** ($g = 1.62\\text{ m/s}^2$) gidersek, eşit kollu terazinin ve dinamometrenin gösterdiği değerler nasıl değişir?",
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
  isTymmModalOpen: false,
  whiteboardMode: "physics-sim",
  pendingPrompt: null,

  skills: INITIAL_SKILLS,
  bktHistory: [
    {
      id: "init-bkt",
      timestamp: "Başlangıç",
      skillId: "FB.5.2.2.1",
      skillTitle:
        INITIAL_SKILLS["FB.5.2.2.1"]?.title ||
        "Kütleye etki eden yer çekimi kuvvetini ağırlık olarak tanımlayabilme",
      previousPL: 0.3,
      newPL: 0.3,
      isCorrect: true,
      reason: "TYMM Öğrenme Çıktısı başlangıç bilişsel profili yüklendi.",
    },
  ],
  isBktModalOpen: false,

  activeMisconception: null,
  misconceptionHistory: [],

  messages: [INITIAL_WELCOME_MESSAGE],
  quickReplies: DEFAULT_QUICK_REPLIES,
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
    const now = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const outcomeChips = (unit.outcomes || [])
      .filter((o) => !o.code.startsWith("KAZ."))
      .slice(0, 3)
      .map((o) => `${o.code} çıktısını Sokratik olarak çalışalım`);

    const customReplies =
      outcomeChips.length > 0
        ? [
            ...outcomeChips,
            "Bu ünitenin anahtar kavramlarını simülasyonla ilişkilendir",
            "Zenginleştirme (Farklılaştırma) sorusu sor!",
          ]
        : DEFAULT_QUICK_REPLIES;

    const unitAnnouncement: ChatMessage = {
      id: `unit-${Date.now()}`,
      role: "tutor",
      content: `📚 **TYMM Müfredat Ünitesi Güncellendi:**\n**${unit.gradeName} • ${unit.subject}** — *${unit.title}*\n\n**Hedef Öğrenme Çıktıları:** ${(
        unit.outcomes || []
      )
        .filter((o) => !o.code.startsWith("KAZ."))
        .map((o) => `\`${o.code}\``)
        .join(", ")}\n**Anahtar Kavramlar:** ${
        unit.keyConcepts || "Müfredat kazanımları"
      }\n\nBu ünitenin süreç bileşenlerini birlikte keşfetmeye hazır mısın? İlk sorumu yöneltmemi ister misin?`,
      timestamp: now,
    };

    set((state) => ({
      activeUnit: unit,
      skills: newSkills,
      isTymmModalOpen: false,
      whiteboardMode: unit.unitId === 368 ? "physics-sim" : "unit-board",
      quickReplies: customReplies,
      messages: [...state.messages, unitAnnouncement],
      bktHistory: [
        {
          id: `unit-bkt-${Date.now()}`,
          timestamp: now,
          skillId: firstSkill?.skillId || `ÜNİTE-${unit.unitId}`,
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

  setTymmModalOpen: (isOpen) => set({ isTymmModalOpen: isOpen }),
  setWhiteboardMode: (whiteboardMode) => set({ whiteboardMode }),
  setPendingPrompt: (pendingPrompt) => set({ pendingPrompt }),

  applyBKTUpdate: (skillId, isCorrect, reason) => {
    const currentSkills = get().skills;
    const skillKeys = Object.keys(currentSkills);
    const targetId = currentSkills[skillId]
      ? skillId
      : skillKeys[0] || "FB.5.2.2.1";
    const skill = currentSkills[targetId];
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
          ? "TYMM süreç bileşeni çıkarımı doğrulandı."
          : "Kavram yanılgısı veya hatalı çıkarım gözlemlendi."),
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
