"use client";

import React, { useEffect, useRef, useState } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import { MisconceptionAlert } from "@/components/TutorChat/MisconceptionAlert";
import { PLANETS } from "@/lib/curriculum-graph";
import { SolutionMode, TutorAPIResponse } from "@/types/its";
import {
  AlertCircle,
  BrainCircuit,
  Camera,
  CheckCircle2,
  FileQuestion,
  ImagePlus,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  User,
  Wand2,
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
    return `Mustafa Kemal Paşa, Trablusgarp'ta yerli halkı İtalyanlara karşı teşkilatlandırarak Derne ve Tobruk'ta önemli başarılar kazanmıştır. Ayrıca Balkan Savaşları öncesinde ordunun siyasete karışmasının tehlikelerine dikkat çekmiş ve savaş sırasında yaşanan olumsuzluklar onun haklılığını ortaya çıkarmıştır.

Bu metinde Mustafa Kemal Paşa'nın aşağıdaki kişilik özelliklerinden hangilerine değinilmiştir?
I. İleri görüşlülüğü
II. Vatanseverliği ve teşkilatçılığı
III. İnkılapçılığı

A) I ve II
B) I ve III
C) II ve III
D) I, II ve III`;
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

export const MainSolverWorkspace: React.FC = () => {
  const {
    activeUnit,
    selectedOutcomeCode,
    currentQuestionText,
    setCurrentQuestionText,
    currentQuestionImage,
    setCurrentQuestionImage,
    lastReactiveSolution,
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
    setBktModalOpen,
  } = useITSStore();

  const [inputText, setInputText] = useState("");
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Görsel yüklendiğinde veya yapıştırıldığında otomatik Türkçe OCR ile soru metnini çıkar
  const runImageOcr = async (dataUrl: string) => {
    setIsOcrRunning(true);
    setOcrStatusText("🔍 Görseldeki soru metni ve şıklar okunuyor...");
    try {
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(dataUrl, "tur");
      const extracted = (result?.data?.text || "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (extracted.length > 10) {
        setCurrentQuestionText(extracted);
        setOcrStatusText(
          "✅ Görseldeki soru metni otomatik okundu! İstersen metni düzenleyebilirsin."
        );
      } else {
        setOcrStatusText(
          "📷 Görsel yüklendi. İstersen sorunun özetini metin kutusuna da yazabilirsin."
        );
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
  };

  const sendToTutor = async (
    userMsg: string,
    mode: SolutionMode,
    overrideQuestionText?: string
  ) => {
    const trimmed = userMsg.trim();
    if (!trimmed || isTyping) return;

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

  // 🧠 Proaktif Çözüm Başlat
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

    sendToTutor(
      qText
        ? `🧠 [PROAKTİF ÇÖZÜM • ${activeOutcome.code}]\nÇözemediğim Soru:\n${qText}`
        : `🧠 [PROAKTİF ÇÖZÜM • ${activeOutcome.code}] Yüklediğim görseldeki soruyu bana Sokratik ipuçlarıyla adım adım çözdürür müsün?`,
      "proactive",
      qText
    );
  };

  // ⚡ Hızlı Çöz (Reaktif Çözüm)
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
        : `⚡ [HIZLI ÇÖZ — REAKTİF TAM ÇÖZÜM • ${activeOutcome.code}] Yüklediğim görseldeki sorunun doğru şıkkını ve adım adım tam çözümünü göster!`,
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
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* ÜST BÖLÜM: SORU SORMA & GÖRSEL YÜKLEME MASASI */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-white">
                  Sınavda veya Testte Çözemediğin Soruyu Sor
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Aktif Kazanım: {activeOutcome.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {activeOutcome.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFillSampleQuestion}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition flex items-center gap-1.5"
              title="Seçili kazanıma uygun örnek bir test sorusu doldur"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Örnek Soru Getir</span>
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
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition flex items-center gap-1.5"
              title="Soru fotoğrafı yükle"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Fotoğraf Yükle</span>
            </button>
          </div>
        </div>

        {/* Soru Metin Kutusu + Yüklenen Görsel Yan Yana */}
        <div
          className={`grid gap-3 ${
            currentQuestionImage
              ? "grid-cols-1 md:grid-cols-12"
              : "grid-cols-1"
          }`}
        >
          {/* Görsel Önizleme (Yüklendiyse Sol Tarafta Net Gösterilir) */}
          {currentQuestionImage && (
            <div className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between gap-2">
              <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentQuestionImage}
                  alt="Yüklenen Soru Görseli"
                  className="max-h-48 w-auto object-contain rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestionImage(null);
                    setOcrStatusText(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-slate-700 transition"
                  title="Görseli Kaldır"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] flex items-center gap-1.5 text-emerald-400 px-1">
                {isOcrRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span className="text-indigo-300">{ocrStatusText}</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {ocrStatusText || "Soru görseli eklendi"}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Soru Metni Giriş Alanı */}
          <div
            className={
              currentQuestionImage ? "md:col-span-7 flex flex-col" : "w-full"
            }
          >
            <textarea
              value={currentQuestionText}
              onChange={(e) => setCurrentQuestionText(e.target.value)}
              onPaste={handlePaste}
              rows={4}
              placeholder={`Çözemediğin sınav/test sorusunu ve şıklarını (A, B, C, D) buraya yaz, yapıştır veya ekran görüntüsünü doğrudan Ctrl+V ile yapıştır...\n(Görsel yapıştırdığında içindeki soru metni buraya otomatik olarak okunur!)`}
              className="w-full h-full min-h-[115px] bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* İKİ ANA ÇÖZÜM BUTONU: PROAKTİF ÇÖZ vs ⚡ HIZLI ÇÖZ (REAKTİF) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isTyping || isOcrRunning}
            onClick={handleStartProactive}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 border border-indigo-400/40 transition flex items-center justify-center gap-2.5 group"
          >
            <BrainCircuit className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition shrink-0" />
            <div className="text-left">
              <div className="font-bold">🧠 Proaktif Çözüm Başlat</div>
              <div className="text-[10px] text-indigo-200 font-normal">
                Cevabı doğrudan vermez; ipuçlarıyla adım adım sana çözdürür
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={isTyping || isOcrRunning}
            onClick={handleStartReactive}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/25 border border-amber-300/60 transition flex items-center justify-center gap-2.5 group"
          >
            <Zap className="w-5 h-5 text-slate-950 fill-slate-950 group-hover:scale-110 transition shrink-0" />
            <div className="text-left">
              <div className="font-extrabold">⚡ Hızlı Çöz (Reaktif Çözüm)</div>
              <div className="text-[10px] text-slate-900 font-medium">
                Doğru şıkkı, adım adım çözümü ve şık analizini anında gösterir
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ALT BÖLÜM: ÇÖZÜM VE ETKİLEŞİM EKRANI (BÜYÜK ANA EKRANDA!) */}
      <div className="flex-1 min-h-[320px] bg-slate-900/95 border border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Çözüm Alanı Üst Başlık */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Canlı Soru Çözüm & Rehberlik Ekranı
            </h3>
          </div>

          <button
            type="button"
            disabled={isTyping}
            onClick={handleStartReactive}
            className="px-3 py-1 rounded-lg text-xs font-extrabold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition flex items-center gap-1 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>⚡ Hızlı Çöz (Tam Çözümü Göster)</span>
          </button>
        </div>

        {/* Mesajlar ve Çözüm Kartları Akışı */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <MisconceptionAlert />

          {messages.map((msg) => {
            const isTutor = msg.role === "tutor";
            const isReactive =
              msg.mode === "reactive" || Boolean(msg.reactiveSolution);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isTutor ? "justify-start" : "justify-end"
                }`}
              >
                {isTutor && (
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                      isReactive
                        ? "bg-amber-500/25 border-amber-500/50 text-amber-300"
                        : "bg-indigo-600/25 border-indigo-500/40 text-indigo-300"
                    }`}
                  >
                    {isReactive ? (
                      <Zap className="w-4 h-4 fill-amber-300" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                    isTutor
                      ? isReactive
                        ? "bg-slate-800/95 text-slate-100 border-2 border-amber-500/50 rounded-tl-sm"
                        : "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-sm"
                      : "bg-indigo-600 text-white border border-indigo-500 rounded-tr-sm"
                  }`}
                >
                  {isTutor && msg.id !== "welcome-1" && (
                    <div className="mb-2 flex items-center gap-2">
                      {isReactive ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-slate-950" />
                          Reaktif Çözüm (Doğrudan Tam Çözüm)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
                          🧠 Proaktif Çözüm Rehberi (Sokratik Adım)
                        </span>
                      )}
                    </div>
                  )}

                  {msg.imageDataUrl && (
                    <div className="mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageDataUrl}
                        alt="Öğrenci sorusu"
                        className="max-h-48 rounded-lg border border-indigo-400/40 object-contain bg-slate-950"
                      />
                    </div>
                  )}

                  <div
                    className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(msg.content),
                    }}
                  />

                  {/* Reaktif Çözüm Yapılandırılmış Kartı */}
                  {msg.reactiveSolution && (
                    <div className="mt-3 pt-3 border-t border-amber-500/30 space-y-2.5">
                      <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{msg.reactiveSolution.correctAnswer}</span>
                      </div>

                      <div className="bg-slate-950/85 rounded-xl p-3 border border-slate-800 space-y-1.5">
                        <div className="text-xs font-bold text-amber-300">
                          Adım Adım Çözüm:
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-200">
                          {msg.reactiveSolution.stepByStep.map((s, i) => (
                            <li key={i} className="leading-relaxed">
                              {s}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-950/85 rounded-xl p-3 border border-slate-800 space-y-1">
                          <div className="font-bold text-rose-400">
                            🔍 Çeldirici / Şık Analizi:
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {msg.reactiveSolution.distractorAnalysis}
                          </p>
                        </div>

                        <div className="bg-slate-950/85 rounded-xl p-3 border border-slate-800 space-y-1">
                          <div className="font-bold text-emerald-400 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Pratik Sınav Taktiği:</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {msg.reactiveSolution.examTip}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(msg.simulationApplied ||
                    msg.bktDelta ||
                    msg.detectedMisconception) && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/70 flex flex-wrap items-center gap-1.5">
                      {msg.simulationApplied && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Wand2 className="w-3 h-3" />
                          Tahta Güncellendi:{" "}
                          {msg.simulationApplied.planet
                            ? PLANETS[msg.simulationApplied.planet]?.name
                            : ""}{" "}
                          {typeof msg.simulationApplied.mass === "number"
                            ? `(${msg.simulationApplied.mass} kg)`
                            : ""}
                        </span>
                      )}

                      {msg.bktDelta && (
                        <button
                          type="button"
                          onClick={() => setBktModalOpen(true)}
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border transition ${
                            msg.bktDelta.isCorrect
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          <BrainCircuit className="w-3 h-3" />
                          BKT {msg.bktDelta.skillId}: %
                          {(msg.bktDelta.previousPL * 100).toFixed(0)} → %
                          {(msg.bktDelta.newPL * 100).toFixed(0)}
                        </button>
                      )}

                      {msg.detectedMisconception && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" />
                          Yanılgı Kodu: {msg.detectedMisconception}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!isTutor && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs text-slate-300 flex items-center gap-2">
                <span>Yapay zeka soruyu analiz ediyor...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Hızlı Yanıt Çipleri & Yanıt Yazma Çubuğu */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
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
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition disabled:opacity-50 ${
                    isChipReactive
                      ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 font-semibold"
                      : "bg-slate-800/90 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-200 border-slate-700 hover:border-indigo-500/50"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleChatSubmit}
          className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            placeholder="Proaktif çözüm için elediğin şıkkı, bulduğun cevabı veya takıldığın adımı yaz..."
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>Yanıtla</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
