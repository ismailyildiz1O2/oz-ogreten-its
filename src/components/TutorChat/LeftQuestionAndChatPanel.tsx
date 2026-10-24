"use client";

import React, { useEffect, useRef, useState } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import { SolutionMode, TutorAPIResponse } from "@/types/its";
import { detectCurriculumInBackground } from "@/lib/question-analyzer";
import {
  BrainCircuit,
  Camera,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react";

function formatMessageContent(raw: string): string {
  let safe = (raw || "")
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

const SAMPLE_QUESTIONS = [
  {
    label: "🧬 Biyoloji (Hücre Bölünmesi & Üreme)",
    text: `Tatlı su hidraları (Hydra vulgaris) ve yaprak bitleri (Aphidoidea), çevresel koşulların optimum (besin bol, sıcaklık uygun) olduğu ilkbahar ve yaz aylarında hızla eşeysiz üreme yoluyla çoğalırlar. Ancak sonbahar sonunda su sıcaklığının düşmesi ve besin kıtlığı gibi çevresel stres faktörleri belirdiğinde eşeyli üremeye geçiş yaparlar. Memeliler sınıfında yer alan sağlıklı bir insanda ise somatik hücreler mitoz bölünme geçirirken, olgunlaşmış sinir hücreleri (nöronlar) ve çizgili kas hücreleri hücre döngüsünün G₀ evresinde kalır ve bölünmez.

Yukarıdaki biyolojik verileri dikkate alarak aşağıdaki soruları bilimsel gerekçeleriyle yanıtlayınız:
1) Evrimsel ve Enerjetik Analiz: Hidra ve yaprak biti gibi canlılar neden optimum şartlarda eşeysiz üremeye yönelirken stres şartlarında eşeyli üremeye geçerler? ("enerji maliyeti", "zaman" ve "uyum kararlılığı" kavramlarıyla yorumlayınız.)
2) Hücresel ve Bireysel Düzey Kıyaslaması: "Hücre bölünmesi tüm canlılarda üremeyi, üreme ise tüm bireylerin hayatta kalmasını sağlar." hipotezindeki iki temel bilimsel hatayı tek ve çok hücreli canlılardan örneklerle çürütünüz.
3) Hücre Döngüsü Sorgulaması: Nöronların veya retina hücrelerinin sürekli mitoz geçirmesi organizmanın bütünlüğü açısından nasıl bir dezavantaj yaratırdı?`,
  },
  {
    label: "🪐 Fen Bilimleri (Güneş Sistemi & Gezegenler)",
    text: `Güneş sistemindeki gezegenler Güneş'e yakınlıklarına ve yapısal özelliklerine göre incelendiğinde; iç (karasal) gezegenler ile dış (gazsal) gezegenler arasında belirgin farklar görülür.

Buna göre Güneş sistemindeki gezegenlerin Güneş'e en yakından uzağa doğru sıralaması ve yapısal özellikleri hakkında aşağıdakilerden hangisi doğrudur?
A) Güneş'e en yakın gezegen Venüs, en büyük gezegen ise Satürn'dür.
B) İç gezegenler (Merkür, Venüs, Dünya, Mars) kayalık yapıdadır ve Mars ile Jüpiter arasında Asteroit Kuşağı yer alır.
C) Dış gezegenlerin (Jüpiter, Satürn, Uranüs, Neptün) hiçbirinin halkası ve doğal uydusu yoktur.
D) Dünya, Güneş'e yakınlık bakımından dördüncü sırada yer alan gazsal bir gezegendir.`,
  },
  {
    label: "⚖️ Fizik (Kütle ve Ağırlık)",
    text: `Özdeş K cismi önce Dünya'da, ardından Ay'da eşit kollu terazi ve dinamometre kullanılarak ölçülüyor.
Dünya'daki ölçümde eşit kollu terazi 6 kg, dinamometre ise 60 N değerini gösteriyor.

Buna göre K cisminin Ay'daki kütle ve ağırlık ölçüm sonuçları aşağıdakilerden hangisinde doğru verilmiştir? (Ay'ın çekim ivmesi Dünya'nın 1/6'sıdır.)
A) Kütle: 1 kg — Ağırlık: 10 N
B) Kütle: 6 kg — Ağırlık: 10 N
C) Kütle: 6 kg — Ağırlık: 60 N
D) Kütle: 1 kg — Ağırlık: 60 N`,
  },
  {
    label: "🗺️ Tarih (Trablusgarp & Mustafa Kemal)",
    text: `Mustafa Kemal, Trablusgarp'ın İtalyanlar tarafından işgali üzerine Osmanlı Hükûmeti'nin bölgeye ordu gönderememesi nedeniyle birkaç idealist arkadaşıyla birlikte gizlice ve farklı kimliklerle (Gazeteci Şerif takma adıyla) bölgeye giderek yerli halkı İtalyanlara karşı örgütledi. Derne, Tobruk ve Bingazi'de önemli başarılar kazandı.

Bu metinde Mustafa Kemal'in Trablusgarp'ta üstlendiği rol, onun aşağıdaki kişilik özelliklerinden hangisiyle doğrudan ilişkilendirilebilir?
A) Çok cepheliliği ve inkılapçılığı
B) Vatanseverliği ve teşkilatçılığı (örgütleyiciliği)
C) İleri görüşlülüğü ve kararlılığı
D) Sabırlı ve disiplinli oluşu
E) Açık sözlülüğü ve idealistliği`,
  },
  {
    label: "📐 Matematik (Sayı Örüntüleri)",
    text: `Bir okul kütüphanesinde bulunan kitapların sayısı, her hafta düzenli bir örüntüyle artmaktadır. 1. hafta 24 kitap, 2. hafta 36 kitap, 3. hafta 48 kitap bulunmaktadır.

Buna göre bu örüntünün artış kuralı ve 6. haftadaki toplam kitap sayısı aşağıdakilerden hangisidir?
A) Her hafta 10 artar — 6. haftada 74 kitap
B) Her hafta 12 artar — 6. haftada 84 kitap
C) Her hafta 12 artar — 6. haftada 72 kitap
D) Her hafta 14 artar — 6. haftada 90 kitap`,
  },
];

export const LeftQuestionAndChatPanel: React.FC = () => {
  const {
    activeUnit,
    setActiveUnit,
    selectedOutcomeCode,
    setSelectedOutcomeCode,
    clearWorkspace,
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
    setIsTyping,
    setQuickReplies,
    applySimulationUpdate,
    applyBKTUpdate,
    setActiveMisconception,
  } = useITSStore();

  const [inputText, setInputText] = useState("");
  const [sampleIndex, setSampleIndex] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Soru metni değiştikçe arka planda ders/ünite/kazanım bilgisini sessizce eşleştir
  useEffect(() => {
    if (!currentQuestionText.trim()) return;
    const detected = detectCurriculumInBackground(
      currentQuestionText,
      activeUnit
    );
    if (detected.outcomeCode !== selectedOutcomeCode) {
      // Ekranı sıfırlamadan yalnızca arka plan bilgisini kullanmak için store'da mevcut soruyu koruyoruz
    }
  }, [currentQuestionText, activeUnit, selectedOutcomeCode]);

  const runImageOcr = async (dataUrl: string, fileName?: string) => {
    setIsOcrRunning(true);
    setStatusMessage("Görseldeki soru metni okunuyor (OCR)...");
    if (fileName) setUploadedFileName(fileName);
    try {
      const Tesseract = await import("tesseract.js");
      const result = await Tesseract.recognize(dataUrl, "tur+eng");
      const extracted = result?.data?.text?.trim() || "";
      if (extracted.length > 5) {
        setCurrentQuestionText(
          currentQuestionText
            ? `${currentQuestionText}\n${extracted}`
            : extracted
        );
        setStatusMessage("Görseldeki soru metni otomatik aktarıldı.");
      } else {
        setStatusMessage(
          "Görsel eklendi. İsterseniz altına ek açıklama yazabilirsiniz."
        );
      }
    } catch {
      setStatusMessage("Görsel eklendi, doğrudan çözümü başlatabilirsiniz.");
    } finally {
      setIsOcrRunning(false);
    }
  };

  // Fotoğraf / Ekran Görüntüsü Yükleme
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCurrentQuestionImage(reader.result);
        runImageOcr(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // PDF veya Word (.docx / .doc / .txt) Yükleme
  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setIsOcrRunning(true);
    setStatusMessage(`${file.name} dosyasından soru okunuyor...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.text) {
        setCurrentQuestionText(data.text);
        setLastReactiveSolution(null);
        setStatusMessage(`"${file.name}" içindeki soru başarıyla aktarıldı.`);
      } else {
        setStatusMessage(
          `"${file.name}" yüklendi. Soruyu metin kutusuna da yapıştırabilirsiniz.`
        );
      }
    } catch {
      setStatusMessage(
        `"${file.name}" eklendi. Soru metnini kontrol edip çözümü başlatabilirsiniz.`
      );
    } finally {
      setIsOcrRunning(false);
      e.target.value = "";
    }
  };

  // Ctrl+V ile Ekran Görüntüsü Yapıştırma
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
              runImageOcr(reader.result, "Ekran Görüntüsü (Ctrl+V)");
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleCycleSampleQuestion = () => {
    const chosen = SAMPLE_QUESTIONS[sampleIndex % SAMPLE_QUESTIONS.length];
    setSampleIndex((prev) => prev + 1);
    setCurrentQuestionText(chosen.text);
    setCurrentQuestionImage(null);
    setUploadedFileName(null);
    setLastReactiveSolution(null);
    setStatusMessage(`Örnek Yüklendi: ${chosen.label}`);
  };

  const sendToTutor = async (
    userMsg: string,
    mode: SolutionMode,
    overrideQuestionText?: string
  ) => {
    const trimmed = userMsg.trim();
    if (!trimmed || isTyping) return;

    const qTextToUse = (overrideQuestionText ?? currentQuestionText).trim();
    // Arka planda sorunun ait olduğu dersi ve kazanımı otomatik tespit et
    const detectedBg = detectCurriculumInBackground(qTextToUse, activeUnit);

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
            outcomeCode: detectedBg.outcomeCode,
          },
          history: historyPayload,
          simulationState: {
            planet,
            gravity,
            mass,
            weight: mass * gravity,
          },
          skills,
          activeUnit: detectedBg.unit,
          selectedOutcomeCode: detectedBg.outcomeCode,
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
      const chosen = SAMPLE_QUESTIONS[sampleIndex % SAMPLE_QUESTIONS.length];
      setSampleIndex((prev) => prev + 1);
      qText = chosen.text;
      setCurrentQuestionText(qText);
    }
    setLastReactiveSolution(null);
    sendToTutor(
      qText
        ? `🧠 [PROAKTİF ÇÖZÜM]\nSoru:\n${qText}`
        : `🧠 [PROAKTİF ÇÖZÜM] Yüklediğim görseldeki soruyu adım adım beraber çözelim.`,
      "proactive",
      qText
    );
  };

  const handleStartReactive = () => {
    let qText = currentQuestionText.trim();
    if (!qText && !currentQuestionImage) {
      const chosen = SAMPLE_QUESTIONS[sampleIndex % SAMPLE_QUESTIONS.length];
      setSampleIndex((prev) => prev + 1);
      qText = chosen.text;
      setCurrentQuestionText(qText);
    }
    sendToTutor(
      qText
        ? `⚡ [HIZLI ÇÖZ]\nSoru:\n${qText}`
        : `⚡ [HIZLI ÇÖZ] Yüklediğim görseldeki sorunun doğrudan gidiş yolunu ve cevabını ver.`,
      "reactive",
      qText
    );
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    const lower = inputText
      .replace(/İ/g, "i")
      .replace(/I/g, "ı")
      .toLowerCase();
    const isReactiveCmd =
      lower.includes("hızlı çöz") ||
      lower.includes("cevabı ver") ||
      lower.includes("doğrudan çöz");
    sendToTutor(inputText, isReactiveCmd ? "reactive" : "proactive");
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* ===================================================================
          1. BÖLÜM: SADE SORU EKLEME KUTUSU (METİN, FOTOĞRAF, EKRAN GÖRÜNTÜSÜ, PDF, WORD)
      =================================================================== */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Sorunu Ekle</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Yazarak, ekran görüntüsü (Ctrl+V), fotoğraf, PDF veya Word olarak ekle
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {(currentQuestionText ||
              currentQuestionImage ||
              uploadedFileName ||
              messages.length > 1) && (
              <button
                type="button"
                onClick={() => {
                  setInputText("");
                  setUploadedFileName(null);
                  setStatusMessage(null);
                  clearWorkspace();
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition flex items-center gap-1"
                title="Ekranı ve soruyu temizle"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCycleSampleQuestion}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1"
              title="Farklı derslerden hazır örnek soru dene"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Örnek Soru</span>
            </button>
          </div>
        </div>

        {/* Çoklu Dosya Ekleme Butonları: Fotoğraf/Ekran Görüntüsü, PDF, Word */}
        <div className="grid grid-cols-3 gap-1.5">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-emerald-300 text-[11px] font-medium transition flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Fotoğraf / Ctrl+V</span>
          </button>

          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleDocumentUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-amber-300 text-[11px] font-medium transition flex items-center justify-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">PDF Yükle</span>
          </button>

          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-sky-300 text-[11px] font-medium transition flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Word (.docx)</span>
          </button>
        </div>

        {/* Yüklenen Görsel veya Dosya Durum Çubuğu */}
        {(currentQuestionImage || uploadedFileName || statusMessage) && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {currentQuestionImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentQuestionImage}
                  alt="Soru görseli"
                  className="h-9 w-12 object-cover rounded border border-slate-700 shrink-0"
                />
              )}
              <div className="text-[11px] truncate">
                {isOcrRunning ? (
                  <span className="text-indigo-300 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="truncate">{statusMessage}</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {statusMessage || uploadedFileName || "Dosya hazır"}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentQuestionImage(null);
                setUploadedFileName(null);
                setStatusMessage(null);
              }}
              className="p-1 rounded bg-rose-500/15 text-rose-300 hover:bg-rose-500/30 shrink-0"
              title="Eki kaldır"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Soru Metin Alanı */}
        <textarea
          value={currentQuestionText}
          onChange={(e) => setCurrentQuestionText(e.target.value)}
          onPaste={handlePaste}
          rows={4}
          placeholder="Soru metnini buraya yazın, yapıştırın veya doğrudan Ctrl+V ile ekran görüntüsü ekleyin..."
          className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none resize-y leading-relaxed"
        />

        {/* İKİ ANA ÇÖZÜM BUTONU: PROAKTİF ÇÖZ vs HIZLI ÇÖZ */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button"
            disabled={isTyping || isOcrRunning}
            onClick={handleStartProactive}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 border border-indigo-400/40 transition flex flex-col items-center justify-center gap-0.5"
          >
            <div className="flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 shrink-0" />
              <span>🧠 Proaktif Çöz</span>
            </div>
            <span className="text-[10px] font-normal text-indigo-200">
              İpuçlarıyla beraber çözelim
            </span>
          </button>

          <button
            type="button"
            disabled={isTyping || isOcrRunning}
            onClick={handleStartReactive}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 border border-amber-300/60 transition flex flex-col items-center justify-center gap-0.5"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-slate-950 shrink-0" />
              <span>⚡ Hızlı Çöz</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-900">
              Gidiş yolunu ve cevabı ver
            </span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          2. BÖLÜM: PROAKTİF & HIZLI ÇÖZÜM SOHBET / YARDIM KUTUSU
      =================================================================== */}
      <div className="flex-1 min-h-0 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Çözüm Asistanı</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Proaktif ipuçları & adım adım rehberlik
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
              <span>Soru çözümleniyor...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Hızlı Yanıt Çipleri */}
        <div className="px-2.5 py-1.5 bg-slate-950/50 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickReplies.map((chip, idx) => {
            const chipLower = chip
              .replace(/İ/g, "i")
              .replace(/I/g, "ı")
              .toLowerCase();
            const isChipReactive =
              chipLower.includes("hızlı çöz") ||
              chipLower.includes("reaktif") ||
              chipLower.includes("tam çözüm");
            const isNewSampleChip =
              chipLower.includes("örnek soru çözelim") ||
              chipLower.includes("benzer bir soru");
            return (
              <button
                key={idx}
                type="button"
                disabled={isTyping}
                onClick={() => {
                  if (isNewSampleChip) {
                    const chosen =
                      SAMPLE_QUESTIONS[sampleIndex % SAMPLE_QUESTIONS.length];
                    setSampleIndex((prev) => prev + 1);
                    setCurrentQuestionText(chosen.text);
                    setLastReactiveSolution(null);
                    sendToTutor(
                      `🧠 [PROAKTİF ÇÖZÜM]\nSoru:\n${chosen.text}`,
                      "proactive",
                      chosen.text
                    );
                  } else {
                    sendToTutor(
                      chip,
                      isChipReactive ? "reactive" : "proactive"
                    );
                  }
                }}
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
            placeholder="Tahminini, fikrini veya takıldığın yeri yaz..."
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
