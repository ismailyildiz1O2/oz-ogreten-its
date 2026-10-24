"use client";

import React, { useRef } from "react";
import { useITSStore } from "@/store/useITSStore";
import { getMasteryStatus } from "@/lib/bkt-engine";
import {
  BookOpen,
  BrainCircuit,
  Camera,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  ImagePlus,
  Lightbulb,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

/**
 * Seçili ünite ve kazanıma göre gerçekçi bir çoktan seçmeli örnek test sorusu üretir.
 */
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

export const TymmUnitBoard: React.FC = () => {
  const {
    activeUnit,
    selectedOutcomeCode,
    setSelectedOutcomeCode,
    currentQuestionText,
    setCurrentQuestionText,
    currentQuestionImage,
    setCurrentQuestionImage,
    lastReactiveSolution,
    setLastReactiveSolution,
    skills,
    isTyping,
    setTymmModalOpen,
    triggerTutorAction,
    setMobileTab,
  } = useITSStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const activeSkill = skills[activeOutcome.code];
  const masteryPct = activeSkill ? Math.round(activeSkill.params.pL * 100) : 35;
  const masteryStatus = getMasteryStatus(activeSkill?.params.pL ?? 0.35);

  // Görsel dosyası seçildiğinde base64'e dönüştür
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCurrentQuestionImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Panodan (Ctrl+V) ekran görüntüsü yapıştırma desteği
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
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Örnek soru doldur
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
  };

  // Proaktif Çözüm Başlat (Sokratik Adım Adım Rehberlik)
  const handleStartProactive = () => {
    const qText = currentQuestionText.trim();
    if (!qText && !currentQuestionImage) {
      handleFillSampleQuestion();
      return;
    }

    triggerTutorAction({
      mode: "proactive",
      message: qText
        ? `🧠 [PROAKTİF ÇÖZÜM TALEBİ • Kazanım: ${activeOutcome.code}]\nÇözemediğim Soru:\n${qText}\n\nLütfen bana doğru şıkkı doğrudan söylemeden, bu soruyu adım adım çözmem için ilk Sokratik ipucunu ve yönlendirici soruyu sor.`
        : `🧠 [PROAKTİF ÇÖZÜM TALEBİ • Kazanım: ${activeOutcome.code}]\nYüklediğim görseldeki sınav sorusunu bana cevabı doğrudan söylemeden Sokratik ipuçlarıyla adım adım çözdürür müsün?`,
      imageDataUrl: currentQuestionImage,
    });
    setMobileTab("chat");
  };

  // ⚡ Hızlı Çöz (Reaktif Tam Çözüm)
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

    triggerTutorAction({
      mode: "reactive",
      message: qText
        ? `⚡ [HIZLI ÇÖZ — REAKTİF TAM ÇÖZÜM TALEBİ • Kazanım: ${activeOutcome.code}]\nSoru:\n${qText}\n\nLütfen bu sorunun doğru cevabını, adım adım tam çözümünü, diğer şıkların (çeldiricilerin) neden yanlış olduğunu ve sınav taktiğini doğrudan açıkla!`
        : `⚡ [HIZLI ÇÖZ — REAKTİF TAM ÇÖZÜM TALEBİ • Kazanım: ${activeOutcome.code}]\nYüklediğim görseldeki sorunun doğru cevabını ve adım adım tam çözümünü doğrudan açıkla!`,
      imageDataUrl: currentQuestionImage,
    });
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* 1. ADIM: Aktif Sınıf, Ders, Ünite ve Kazanım Seçimi */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              1. Adım: Ders & Kazanım
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">
              {activeUnit.gradeName} • {activeUnit.subject} — {activeUnit.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setTymmModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5 shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sınıf / Ders Değiştir</span>
          </button>
        </div>

        {/* Kazanım (Öğrenme Çıktısı) Seçici Butonlar */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sorunun İlgili Olduğu Kazanımı (Öğrenme Çıktısını) Seçin:</span>
            </span>
            <span className={`font-semibold ${masteryStatus.textClass}`}>
              Seçili Kazanım BKT Ustalığı: %{masteryPct}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {outcomesList.map((out) => {
              const isSelected = out.code === activeOutcome.code;
              return (
                <button
                  key={out.code}
                  type="button"
                  onClick={() => setSelectedOutcomeCode(out.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 border text-left ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20"
                      : "bg-slate-950/90 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <span className="font-bold">{out.code}</span>
                  <span className="truncate max-w-[240px] sm:max-w-[320px] opacity-90">
                    {out.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Seçili Kazanımın Süreç Bileşenleri Özeti */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-300">
            <div className="font-semibold text-indigo-300 mb-0.5">
              [{activeOutcome.code}] {activeOutcome.title}
            </div>
            {activeOutcome.processComponents &&
              activeOutcome.processComponents.length > 0 && (
                <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                  {activeOutcome.processComponents.map((pc, i) => (
                    <span key={i}>{pc}</span>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* 2. ADIM: Çözemediğin Sınav / Test Sorusunu Gönder (Metin veya Görsel) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                2. Adım: Sınavda veya Testte Çözemediğin Soruyu Gönder
              </h3>
              <p className="text-[11px] text-slate-400">
                Soruyu aşağıya yapıştırın, fotoğrafını yükleyin veya{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                  Ctrl+V
                </kbd>{" "}
                ile ekran görüntüsü yapıştırın
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
              <span>Örnek Sınav Sorusu Getir</span>
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
              title="Soru fotoğrafı veya ekran görüntüsü yükle"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Soru Fotoğrafı Yükle</span>
            </button>
          </div>
        </div>

        {/* Soru Metni Giriş Alanı */}
        <textarea
          value={currentQuestionText}
          onChange={(e) => setCurrentQuestionText(e.target.value)}
          onPaste={handlePaste}
          rows={5}
          placeholder={`Çözemediğiniz sınav/test sorusunu ve şıklarını (A, B, C, D) buraya yapıştırın veya sağ üstten "Örnek Sınav Sorusu Getir" butonuna tıklayın...\n\n(İpucu: Ekran görüntüsü aldığınız bir soruyu doğrudan Ctrl+V ile buraya yapıştırabilirsiniz.)`}
          className="w-full flex-1 min-h-[120px] bg-slate-950/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none resize-y leading-relaxed"
        />

        {/* Yüklenen Soru Görseli Önizlemesi */}
        {currentQuestionImage && (
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentQuestionImage}
                alt="Yüklenen Soru Görseli"
                className="h-20 w-auto rounded-lg border border-slate-700 object-contain bg-slate-900"
              />
              <div className="text-xs text-slate-300 truncate">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>Soru Görseli Eklendi</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Yapay zeka görseldeki soruyu ve şıkları okuyarak çözüm
                  yapacaktır.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentQuestionImage(null)}
              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition shrink-0"
              title="Görseli Kaldır"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. ADIM: İKİ ÇÖZÜM MODU BUTONU (PROAKTİF ÇÖZ vs HIZLI ÇÖZ / REAKTİF) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Proaktif Çözüm Butonu */}
          <button
            type="button"
            disabled={isTyping}
            onClick={handleStartProactive}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 border border-indigo-400/40 transition flex items-center justify-center gap-2.5 group"
          >
            <BrainCircuit className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition" />
            <div className="text-left">
              <div className="font-bold">🧠 Proaktif Çözüm Başlat</div>
              <div className="text-[10px] text-indigo-200 font-normal">
                Cevabı vermez; Sokratik ipuçlarıyla sana çözdürür
              </div>
            </div>
          </button>

          {/* Hızlı Çöz (Reaktif Çözüm) Butonu */}
          <button
            type="button"
            disabled={isTyping}
            onClick={handleStartReactive}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/25 border border-amber-300/60 transition flex items-center justify-center gap-2.5 group"
          >
            <Zap className="w-5 h-5 text-slate-950 fill-slate-950 group-hover:scale-110 transition" />
            <div className="text-left">
              <div className="font-extrabold">⚡ Hızlı Çöz (Reaktif Çözüm)</div>
              <div className="text-[10px] text-slate-900 font-medium">
                Doğru şıkkı, adım adım çözümü ve şık analizini anında gösterir
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* REAKTİF ÇÖZÜM SONUÇ PANOSU (Hızlı Çöz'e basıldığında burada ve sohbette açılır) */}
      {lastReactiveSolution && (
        <div className="bg-amber-950/30 border-2 border-amber-500/50 rounded-xl p-4 shadow-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                REAKTİF TAM ÇÖZÜM ({lastReactiveSolution.outcomeCode})
              </span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {lastReactiveSolution.correctAnswer}
              </span>
            </div>
          </div>

          {/* Adım Adım Çözüm */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Adım Adım Çözüm:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-slate-100 bg-slate-950/80 rounded-lg p-3 border border-slate-800">
              {lastReactiveSolution.stepByStep.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Çeldirici / Şık Analizi ve Sınav Taktiği */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <div className="font-bold text-rose-400">
                🔍 Çeldirici & Şık Analizi:
              </div>
              <p className="text-slate-300 leading-relaxed">
                {lastReactiveSolution.distractorAnalysis}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Pratik Sınav Taktiği:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {lastReactiveSolution.examTip}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
