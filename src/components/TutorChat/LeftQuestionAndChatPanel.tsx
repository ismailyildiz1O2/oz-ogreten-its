"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import { getMasteryStatus } from "@/lib/bkt-engine";
import {
  SolutionMode,
  TutorAPIResponse,
  TymmCatalog,
  TymmCatalogUnitSummary,
} from "@/types/its";
import {
  BookOpen,
  BrainCircuit,
  Camera,
  CheckCircle2,
  ChevronDown,
  FileQuestion,
  GraduationCap,
  ImagePlus,
  Loader2,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react";

function formatMessageContent(raw: string): string {
  let safe = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  safe = safe.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `$$${tex}$$`;
    }
  });

  safe = safe.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `$${tex}$`;
    }
  });

  safe = safe.replace(
    /\*\*([^*]+)\*\*/g,
    "<strong class='text-white font-semibold'>$1</strong>"
  );
  safe = safe.replace(
    /\*([^*]+)\*/g,
    "<em class='text-indigo-200'>$1</em>"
  );
  safe = safe.replace(
    /`([^`]+)`/g,
    "<code class='px-1.5 py-0.5 rounded bg-slate-950/90 text-indigo-300 font-mono text-[11px]'>$1</code>"
  );
  safe = safe.replace(/\n/g, "<br />");

  return safe;
}

function generateSampleQuestionForOutcome(
  gradeName: string,
  subject: string,
  unitTitle: string,
  outcomeCode: string,
  outcomeTitle: string,
  keyConcepts: string
): string {
  const lowerSubj = subject.toLowerCase();
  const lowerTitle = unitTitle.toLowerCase();

  if (
    lowerSubj.includes("inkılap") ||
    outcomeCode.startsWith("İTA.") ||
    lowerTitle.includes("mustafa kemal")
  ) {
    return `Mustafa Kemal, Trablusgarp'ın İtalyanlar tarafından işgali üzerine Osmanlı Hükûmeti'nin bölgeye ordu gönderememesi nedeniyle birkaç idealist arkadaşıyla birlikte gizlice ve farklı kimliklerle (Gazeteci Şerif takma adıyla) bölgeye giderek yerli halkı İtalyanlara karşı örgütledi. Derne, Tobruk ve Bingazi'de önemli başarılar kazandı.

Bu metinde çalışma ve Mustafa Kemal'in Trablusgarp'ta üstlendiği rol, onun aşağıdaki kişilik özelliklerinden hangisiyle doğrudan ilişkilendirilebilir?
A) Çok cepheliliği ve inkılapçılığı
B) Vatanseverliği ve teşkilatçılığı (örgütleyiciliği)
C) İleri görüşlülüğü ve kararlılığı
D) Sabırlı ve disiplinli oluşu
E) Açık sözlülüğü ve idealistliği`;
  }

  if (
    outcomeCode.includes("5.2.2") ||
    lowerTitle.includes("kuvveti tanıyalım") ||
    lowerTitle.includes("kütle")
  ) {
    return `Özdeş K cismi önce Dünya'da, ardından Ay'da eşit kollu terazi ve dinamometre kullanılarak ölçülüyor.
Dünya'daki ölçümde eşit kollu terazi 6 kg, dinamometre ise 60 N değerini gösteriyor.

Buna göre K cisminin Ay'daki kütle ve ağırlık ölçüm sonuçları aşağıdakilerden hangisinde doğru verilmiştir? (Ay'ın çekim ivmesi Dünya'nın 1/6'sıdır.)
A) Kütle: 1 kg — Ağırlık: 10 N
B) Kütle: 6 kg — Ağırlık: 10 N
C) Kütle: 6 kg — Ağırlık: 60 N
D) Kütle: 1 kg — Ağırlık: 60 N`;
  }

  if (lowerSubj.includes("sosyal") || outcomeCode.startsWith("SB.")) {
    return `Zeynep, okulda "Sınıf Başkanı", evde "Abla", satranç kulübünde ise "Takım Kaptanı" olarak görev yapmaktadır. Büyüdüğünde ise bir "Mimar" olmayı hedeflemektedir.

Bu durumdan hareketle (${outcomeCode} - ${outcomeTitle}) aşağıdakilerden hangisine ulaşılabilir?
A) Bireyin dâhil olduğu gruplar değişse bile üstlendiği roller her zaman aynı kalır.
B) İnsanlar aynı anda yalnızca tek bir toplumsal gruba üye olabilirler.
C) Bireyin içinde bulunduğu gruplar ve bu gruplardaki rolleri zaman içinde veya ortama göre değişebilir.
D) Rollerimiz doğuştan kazanılır ve gelecekte hiçbir şekilde değişmez.`;
  }

  if (lowerSubj.includes("matematik") || outcomeCode.startsWith("MAT.")) {
    return `[${gradeName} • ${subject} — ${outcomeCode}]
Bir okul kütüphanesinde bulunan kitapların sayısı, her hafta düzenli bir örüntüyle artmaktadır. 1. hafta 24 kitap, 2. hafta 36 kitap, 3. hafta 48 kitap bulunmaktadır.

"${outcomeTitle}" kazanımına göre bu örüntünün kuralı ve 6. haftadaki toplam kitap sayısı aşağıdakilerden hangisidir?
A) Her hafta 10 artar — 6. haftada 74 kitap
B) Her hafta 12 artar — 6. haftada 84 kitap
C) Her hafta 12 artar — 6. haftada 72 kitap
D) Her hafta 14 artar — 6. haftada 90 kitap`;
  }

  const concepts = (keyConcepts || "")
    .split(/[,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);
  const c1 = concepts[0] || "temel kavram";
  const c2 = concepts[1] || "süreç bileşeni";

  return `[${gradeName} • ${subject} — ${outcomeCode}]
Bir öğrenci "${unitTitle}" ünitesinde yer alan "${c1}" ve "${c2}" kavramları üzerine yaptığı araştırmada şu gözlemi kaydediyor:
"${outcomeTitle}"

Buna göre öğrencinin bu kazanım doğrultusunda ulaşması gereken en doğru çıkarım aşağıdakilerden hangisidir?
A) ${c1} kavramı yalnızca tek bir nedene bağlıdır ve hiçbir koşulda değişmez.
B) ${c1} ile ${c2} arasında doğrudan bir ilişki yoktur.
C) ${outcomeTitle} sürecinde ${c1} ve ${c2} verileri birlikte analiz edilerek bilimsel/akademik çıkarıma ulaşılır.
D) Gözlemlenen değişimler tamamen tesadüfidir ve kurallı bir örüntü oluşturmaz.`;
}

export const LeftQuestionAndChatPanel: React.FC = () => {
  const {
    activeUnit,
    setActiveUnit,
    selectedOutcomeCode,
    setSelectedOutcomeCode,
    isCurriculumCollapsed,
    setCurriculumCollapsed,
    currentQuestionText,
    setCurrentQuestionText,
    currentQuestionImage,
    setCurrentQuestionImage,
    setLastReactiveSolution,
    messages,
    quickReplies,
    isTyping,
    planet,
    gravity,
    mass,
    skills,
    addMessage,
    setQuickReplies,
    setIsTyping,
    applySimulationUpdate,
    applyBKTUpdate,
    setActiveMisconception,
  } = useITSStore();

  const [catalog, setCatalog] = useState<TymmCatalog | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number>(
    activeUnit?.grade ?? 5
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    activeUnit?.subject || "Fen Bilimleri Dersi"
  );
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [loadingUnit, setLoadingUnit] = useState(false);

  const [inputText, setInputText] = useState("");
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/tymm")
      .then((r) => r.json())
      .then((data) => {
        if (data.catalog) {
          setCatalog(data.catalog);
        }
      })
      .catch((err) => console.error("Katalog yüklenemedi:", err));
  }, []);

  useEffect(() => {
    if (activeUnit) {
      setSelectedGrade(activeUnit.grade);
      setSelectedSubject(activeUnit.subject);
    }
  }, [activeUnit]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadAndApplyUnit = useCallback(
    async (
      unitId: number,
      overrideGrade?: number,
      overrideSubject?: string,
      autoCollapse = false
    ) => {
      setLoadingUnit(true);
      try {
        const res = await fetch(`/api/tymm?unitId=${unitId}`);
        const data = await res.json();
        if (data.unit) {
          if (typeof overrideGrade === "number") {
            setSelectedGrade(overrideGrade);
          }
          if (overrideSubject) {
            setSelectedSubject(overrideSubject);
          }
          setActiveUnit(data.unit);
          if (autoCollapse) {
            setCurriculumCollapsed(true);
          }
        }
      } catch (e) {
        console.error("Ünite yüklenemedi:", e);
      } finally {
        setLoadingUnit(false);
      }
    },
    [setActiveUnit, setCurriculumCollapsed]
  );

  const currentGradeObj =
    catalog?.classes.find((c) => c.grade === selectedGrade) ||
    catalog?.classes[0];

  const allSubjectsInGrade = currentGradeObj?.subjects || [];
  const filteredSubjects = subjectSearch.trim()
    ? allSubjectsInGrade.filter(
        (s) =>
          s.subject.toLowerCase().includes(subjectSearch.toLowerCase()) ||
          s.units.some((u) =>
            u.title.toLowerCase().includes(subjectSearch.toLowerCase())
          )
      )
    : allSubjectsInGrade;

  const currentSubjectObj =
    filteredSubjects.find((s) => s.subject === selectedSubject) ||
    allSubjectsInGrade.find((s) => s.subject === selectedSubject) ||
    filteredSubjects[0] ||
    allSubjectsInGrade[0];

  const unitsList: TymmCatalogUnitSummary[] = currentSubjectObj?.units || [];

  const handleGradeSelect = (gradeNum: number) => {
    setSelectedGrade(gradeNum);
    setSubjectSearch("");
    const targetGrade = catalog?.classes.find((c) => c.grade === gradeNum);
    if (targetGrade && targetGrade.subjects.length > 0) {
      const sameSubj = targetGrade.subjects.find(
        (s) => s.subject === selectedSubject
      );
      const chosenSubj = sameSubj || targetGrade.subjects[0];
      setSelectedSubject(chosenSubj.subject);
      if (chosenSubj.units.length > 0) {
        loadAndApplyUnit(
          chosenSubj.units[0].unitId,
          gradeNum,
          chosenSubj.subject,
          false
        );
      }
    }
  };

  const handleSubjectSelect = (subjName: string) => {
    setSelectedSubject(subjName);
    const targetSubj = allSubjectsInGrade.find((s) => s.subject === subjName);
    if (targetSubj && targetSubj.units.length > 0) {
      loadAndApplyUnit(
        targetSubj.units[0].unitId,
        selectedGrade,
        targetSubj.subject,
        false
      );
    }
  };

  const validOutcomes = (activeUnit.outcomes || []).filter(
    (o) => o.code && !o.code.startsWith("KAZ.")
  );
  const outcomesList =
    validOutcomes.length > 0 ? validOutcomes : activeUnit.outcomes || [];
  const activeOutcome =
    outcomesList.find((o) => o.code === selectedOutcomeCode) ||
    outcomesList[0] || {
      code: selectedOutcomeCode || `ÜNİTE-${activeUnit.unitId}`,
      title: activeUnit.title,
      processComponents: [],
    };

  // Türkçe OCR ile görseldeki soruyu ve varsa KAZANIM kodunu (Örn: İTA.12.1.1) otomatik oku
  const runImageOcr = async (dataUrl: string) => {
    setIsOcrRunning(true);
    setOcrStatusText("🔍 Görseldeki soru ve şıklar okunuyor...");
    try {
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(dataUrl, "tur");
      const extracted = (result?.data?.text || "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (extracted.length > 10) {
        setCurrentQuestionText(extracted);
        // Görsel içinde KAZANIM kodu varsa (Örn: İTA.12.1.1, FB.5.2.2.1, MAT.7.1.1) yakala!
        const codeMatch = extracted.match(
          /([A-ZÇĞİÖŞÜ]{2,5}\.\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)/i
        );
        if (codeMatch) {
          const detectedCode = codeMatch[1].toUpperCase();
          setSelectedOutcomeCode(detectedCode);
          setOcrStatusText(
            `✅ Soru metni ve kazanım (${detectedCode}) otomatik okundu!`
          );
        } else {
          setOcrStatusText("✅ Görseldeki soru metni otomatik okundu!");
        }
      } else {
        setOcrStatusText("📷 Soru görseli yüklendi.");
      }
    } catch (err) {
      console.error("OCR hatası:", err);
      setOcrStatusText("📷 Soru görseli eklendi.");
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCurrentQuestionImage(reader.result);
        setCurriculumCollapsed(true);
        runImageOcr(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              setCurrentQuestionImage(reader.result);
              setCurriculumCollapsed(true);
              runImageOcr(reader.result);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleFillSampleQuestion = () => {
    const sample = generateSampleQuestionForOutcome(
      activeUnit.gradeName,
      activeUnit.subject,
      activeUnit.title,
      activeOutcome.code,
      activeOutcome.title,
      activeUnit.keyConcepts
    );
    setCurrentQuestionText(sample);
    setLastReactiveSolution(null);
    setOcrStatusText(null);
    setCurriculumCollapsed(true);
  };

  const sendToTutor = async (
    userMsg: string,
    mode: SolutionMode,
    overrideQuestionText?: string
  ) => {
    const trimmed = userMsg.trim();
    if (!trimmed || isTyping) return;

    // Çözüm başladığında ders seçiciyi otomatik kapat ki soru ve chatbox tam alan kazansın
    setCurriculumCollapsed(true);

    const qTextToUse = (overrideQuestionText ?? currentQuestionText).trim();
    const nowTime = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    addMessage({
      id: `stu-${Date.now()}`,
      role: "student",
      content: trimmed,
      timestamp: nowTime,
      mode,
      imageDataUrl: currentQuestionImage,
    });

    setInputText("");
    setIsTyping(true);

    try {
      const historyPayload = messages
        .filter((m) => m.role === "tutor" || m.role === "student")
        .slice(-8)
        .map((m) => ({
          role: m.role as "tutor" | "student",
          content: m.content,
        }));

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          mode,
          currentQuestion: {
            text: qTextToUse,
            imageDataUrl: currentQuestionImage,
            outcomeCode: activeOutcome.code,
          },
          history: historyPayload,
          simulationState: {
            planet,
            gravity,
            mass,
            weight: mass * gravity,
          },
          skills,
          activeUnit,
          selectedOutcomeCode: activeOutcome.code,
        }),
      });

      const data: TutorAPIResponse = await res.json();

      if (data.updateSimulation) {
        applySimulationUpdate(data.updateSimulation);
      }

      if (data.detectedMisconception) {
        setActiveMisconception(data.detectedMisconception);
      }

      if (data.reactiveSolution) {
        setLastReactiveSolution(data.reactiveSolution);
      }

      let bktDeltaInfo: {
        skillId: string;
        previousPL: number;
        newPL: number;
        isCorrect: boolean;
      } | null = null;

      if (data.bktUpdate) {
        const { previousPL, newPL } = applyBKTUpdate(
          data.bktUpdate.skillId,
          data.bktUpdate.isCorrect,
          data.bktUpdate.reason
        );
        bktDeltaInfo = {
          skillId: data.bktUpdate.skillId,
          previousPL,
          newPL,
          isCorrect: data.bktUpdate.isCorrect,
        };
      }

      if (data.quickReplies && data.quickReplies.length > 0) {
        setQuickReplies(data.quickReplies);
      }

      addMessage({
        id: `tut-${Date.now()}`,
        role: "tutor",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mode: data.mode || mode,
        reactiveSolution: data.reactiveSolution || null,
        detectedMisconception: data.detectedMisconception,
        simulationApplied: data.updateSimulation,
        bktDelta: bktDeltaInfo,
      });
    } catch (error) {
      console.error("Çözüm gönderim hatası:", error);
      addMessage({
        id: `err-${Date.now()}`,
        role: "tutor",
        content:
          "Bağlantıda kısa bir gecikme oldu. Lütfen tekrar dene veya **⚡ Hızlı Çöz** butonuna bas.",
        timestamp: nowTime,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleStartProactive = () => {
    let qText = currentQuestionText.trim();
    if (!qText && !currentQuestionImage) {
      qText = generateSampleQuestionForOutcome(
        activeUnit.gradeName,
        activeUnit.subject,
        activeUnit.title,
        activeOutcome.code,
        activeOutcome.title,
        activeUnit.keyConcepts
      );
      setCurrentQuestionText(qText);
    }
    setLastReactiveSolution(null);
    sendToTutor(
      qText
        ? `🧠 [PROAKTİF ÇÖZÜM • ${activeOutcome.code}]\nSoru:\n${qText}`
        : `🧠 [PROAKTİF ÇÖZÜM • ${activeOutcome.code}] Yüklediğim görseldeki soruyu adım adım çözelim.`,
      "proactive",
      qText
    );
  };

  const handleStartReactive = () => {
    let qText = currentQuestionText.trim();
    if (!qText && !currentQuestionImage) {
      qText = generateSampleQuestionForOutcome(
        activeUnit.gradeName,
        activeUnit.subject,
        activeUnit.title,
        activeOutcome.code,
        activeOutcome.title,
        activeUnit.keyConcepts
      );
      setCurrentQuestionText(qText);
    }
    sendToTutor(
      qText
        ? `⚡ [HIZLI ÇÖZ — REAKTİF TAM ÇÖZÜM • ${activeOutcome.code}]\nSoru:\n${qText}`
        : `⚡ [HIZLI ÇÖZ — REAKTİF TAM ÇÖZÜM • ${activeOutcome.code}] Yüklediğim görseldeki sorunun doğru şıkkını ve tam çözümünü göster!`,
      "reactive",
      qText
    );
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isReactive =
      inputText.toLowerCase().includes("hızlı çöz") ||
      inputText.toLowerCase().includes("reaktif");
    sendToTutor(inputText, isReactive ? "reactive" : "proactive");
  };

  return (
    <div className="flex flex-col h-full gap-2.5 overflow-hidden">
      {/* ===================================================================
          1. BÖLÜM: DERS & KAZANIM SEÇİCİ (SEÇİLDİKTEN SONRA OTOMATİK KAPANIR)
      =================================================================== */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl shadow-lg overflow-hidden shrink-0">
        {/* Üst Seçili Ders/Kazanım Barı (Her zaman görünür, tıklanınca açılır/kapanır) */}
        <div
          onClick={() => setCurriculumCollapsed(!isCurriculumCollapsed)}
          className="px-3.5 py-2.5 bg-slate-950/80 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-900 transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {activeUnit.gradeName}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-bold text-white truncate">
                  {activeUnit.subject}
                </span>
              </div>
              <div className="text-[11px] text-indigo-300 truncate font-medium">
                Kazanım: <strong>{activeOutcome.code}</strong> —{" "}
                {activeOutcome.title}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 shrink-0"
          >
            <span>{isCurriculumCollapsed ? "Dersi Değiştir" : "Kapat"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isCurriculumCollapsed ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>

        {/* Açılır Ders & Kazanım Seçim Paneli (Kazanım seçilince otomatik kapanır!) */}
        {!isCurriculumCollapsed && (
          <div className="p-3.5 border-t border-slate-800 space-y-3 max-h-[62vh] overflow-y-auto bg-slate-900/95 animate-in fade-in duration-150">
            {/* 1. Sınıf Seçin */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                1. Sınıf Seçin
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(catalog?.classes || []).map((cls) => (
                  <button
                    key={cls.grade}
                    type="button"
                    onClick={() => handleGradeSelect(cls.grade)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition ${
                      selectedGrade === cls.grade
                        ? "bg-indigo-600 text-white border-indigo-400"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                    }`}
                  >
                    {cls.gradeName}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Ders Seçin */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                2. Ders Seçin ({filteredSubjects.length} Ders)
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Ders ara (Matematik, Fizik, İnkılap, Türkçe)..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none mb-1"
                />
              </div>
              <select
                value={currentSubjectObj?.subject || ""}
                onChange={(e) => handleSubjectSelect(e.target.value)}
                aria-label="Ders seçin"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              >
                {filteredSubjects.map((subj) => (
                  <option key={subj.subject} value={subj.subject}>
                    {subj.subject} ({subj.units.length} Ünite)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Ünite Seçin */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                3. Ünite / Öğrenme Alanı Seçin
              </label>
              <select
                value={activeUnit.unitId}
                onChange={(e) => loadAndApplyUnit(Number(e.target.value))}
                aria-label="Ünite seçin"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              >
                {unitsList.map((u) => (
                  <option key={u.unitId} value={u.unitId}>
                    {u.title} ({u.outcomesCount} Kazanım)
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Kazanım Seçin (Tıklanınca Seçer ve Paneli Kapatır!) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>
                    4. Kazanımı Seçin (Seçilince Soru Eklemeye Geçer)
                  </span>
                </label>
                {loadingUnit && (
                  <span className="text-[10px] text-indigo-400 animate-pulse">
                    Yükleniyor...
                  </span>
                )}
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {outcomesList.map((out) => {
                  const isSelected = out.code === activeOutcome.code;
                  const sk = skills[out.code];
                  const pct = sk ? Math.round(sk.params.pL * 100) : 35;
                  const status = getMasteryStatus(sk?.params.pL ?? 0.35);

                  return (
                    <button
                      key={out.code}
                      type="button"
                      onClick={() => {
                        setSelectedOutcomeCode(out.code);
                        setCurriculumCollapsed(true);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 ${
                        isSelected
                          ? "bg-indigo-600/25 border-indigo-400 text-white"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-indigo-300">
                            {out.code}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded ${status.textClass}`}
                          >
                            %{pct}
                          </span>
                        </div>
                        <div className="text-xs font-medium leading-snug">
                          {out.title}
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
          2. BÖLÜM: SORU EKLEME KUTUSU (METİN / FOTOĞRAF / PROAKTİF & HIZLI ÇÖZ)
      =================================================================== */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-lg space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <FileQuestion className="w-4 h-4 text-amber-400" />
            <span>Çözemediğin Soruyu Ekle</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleFillSampleQuestion}
              className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Örnek Soru</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition flex items-center gap-1"
            >
              <Camera className="w-3 h-3" />
              <span>Fotoğraf / Ctrl+V</span>
            </button>
          </div>
        </div>

        {/* Görsel Önizleme Rozeti */}
        {currentQuestionImage && (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentQuestionImage}
                alt="Soru görseli"
                className="h-10 w-14 object-cover rounded border border-slate-700"
              />
              <div className="text-[11px] truncate">
                {isOcrRunning ? (
                  <span className="text-indigo-300 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {ocrStatusText}
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ImagePlus className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {ocrStatusText || "Görsel yüklendi"}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentQuestionImage(null);
                setOcrStatusText(null);
              }}
              className="p-1 rounded bg-rose-500/15 text-rose-300 hover:bg-rose-500/30"
              title="Görseli sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <textarea
          value={currentQuestionText}
          onChange={(e) => setCurrentQuestionText(e.target.value)}
          onPaste={handlePaste}
          rows={3}
          placeholder="Soru metnini ve şıkları (A, B, C, D) buraya yapıştırın veya doğrudan Ctrl+V ile ekran görüntüsü yapıştırın..."
          className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none resize-y leading-relaxed"
        />

        {/* İki Ana Buton: Proaktif Çöz vs ⚡ Hızlı Çöz */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isTyping || isOcrRunning}
            onClick={handleStartProactive}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 border border-indigo-400/40 transition flex items-center justify-center gap-1.5"
          >
            <BrainCircuit className="w-4 h-4 shrink-0" />
            <span>🧠 Proaktif Çöz</span>
          </button>

          <button
            type="button"
            disabled={isTyping || isOcrRunning}
            onClick={handleStartReactive}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 border border-amber-300/60 transition flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4 fill-slate-950 shrink-0" />
            <span>⚡ Hızlı Çöz</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          3. BÖLÜM: CHATBOX (SOKRATİK DİYALOG & YANIT KUTUSU)
      =================================================================== */}
      <div className="flex-1 min-h-0 bg-slate-900/95 border border-slate-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sokratik Çözüm Chatbox</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Adım adım ipuçları ve soru-cevap
          </span>
        </div>

        {/* Mesaj Akışı */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {messages.map((msg) => {
            const isTutor = msg.role === "tutor";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${
                  isTutor ? "justify-start" : "justify-end"
                }`}
              >
                {isTutor && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    isTutor
                      ? "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-sm"
                      : "bg-indigo-600 text-white border border-indigo-500 rounded-tr-sm"
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(msg.content),
                    }}
                  />
                </div>

                {!isTutor && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="text-xs text-indigo-300 flex items-center gap-2 px-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Çözüm tahtası güncelleniyor...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Hızlı Yanıt Çipleri */}
        <div className="px-2.5 py-1.5 bg-slate-950/50 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickReplies.map((chip, idx) => {
            const isChipReactive =
              chip.toLowerCase().includes("hızlı çöz") ||
              chip.toLowerCase().includes("reaktif");
            return (
              <button
                key={idx}
                type="button"
                disabled={isTyping}
                onClick={() =>
                  sendToTutor(
                    chip,
                    isChipReactive ? "reactive" : "proactive"
                  )
                }
                className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition ${
                  isChipReactive
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-indigo-600/30"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Chatbox Giriş Kutusu */}
        <form
          onSubmit={handleChatSubmit}
          className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            placeholder="Tahminini, elediğin şıkkı veya soruyu yaz..."
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs transition flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
