"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import {
  BrainCircuit,
  CheckCircle2,
  Eye,
  Lightbulb,
  Play,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";

function formatHtml(raw: string): string {
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
    "<code class='px-1.5 py-0.5 rounded bg-slate-950/90 text-indigo-300 font-mono text-xs'>$1</code>"
  );
  safe = safe.replace(/\n/g, "<br />");

  return safe;
}

function parseOptions(qText: string): Array<{ letter: string; text: string }> {
  const regex = /(?:^|\n)\s*([A-E])\s*[\)\.\-:]\s*([^\n]+)/gi;
  const result: Array<{ letter: string; text: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(qText)) !== null) {
    result.push({
      letter: match[1].toUpperCase(),
      text: match[2].trim(),
    });
  }
  return result;
}

export const VisualSolutionBoard: React.FC = () => {
  const {
    activeUnit,
    selectedOutcomeCode,
    currentQuestionText,
    currentQuestionImage,
    lastReactiveSolution,
    messages,
  } = useITSStore();

  const [eliminatedLetters, setEliminatedLetters] = useState<string[]>([]);
  const [animStepIndex, setAnimStepIndex] = useState<number>(0);
  const [zoomImage, setZoomImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const options = useMemo(
    () => parseOptions(currentQuestionText),
    [currentQuestionText]
  );

  // Reaktif çözümdeki doğru şık harfini tespit et (Örn: "Doğru Cevap: B Şıkkı...")
  const correctLetter = useMemo(() => {
    if (!lastReactiveSolution?.correctAnswer) return null;
    const m = lastReactiveSolution.correctAnswer.match(
      /(?:Cevap:\s*)?([A-E])\s*Şıkkı/i
    );
    return m ? m[1].toUpperCase() : null;
  }, [lastReactiveSolution]);

  // Soru değiştiğinde elenen şıkları sıfırla
  useEffect(() => {
    setEliminatedLetters([]);
    setAnimStepIndex(0);
  }, [currentQuestionText, currentQuestionImage]);

  // Reaktif çözüm geldiğinde adım animasyonunu sırayla oynat
  useEffect(() => {
    if (!lastReactiveSolution) return;
    setAnimStepIndex(0);
    const total = lastReactiveSolution.stepByStep.length;
    const timers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= total; i++) {
      timers.push(
        setTimeout(() => {
          setAnimStepIndex(i);
        }, i * 450)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [lastReactiveSolution]);

  // =========================================================================
  // HTML5 CANVAS CANLI ÇÖZÜM & ŞIK ELEME ANİMASYON MOTORU (60 FPS)
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      const rect = canvas.getBoundingClientRect();
      const dpr =
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      if (
        canvas.width !== Math.floor(rect.width * dpr) ||
        canvas.height !== Math.floor(rect.height * dpr)
      ) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;

      // Arka Plan Gradyanı
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#090e1a");
      bg.addColorStop(1, "#111c33");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // İnce Izgara Çizgileri
      ctx.strokeStyle = "rgba(99, 102, 241, 0.07)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      const isReactiveMode = Boolean(lastReactiveSolution);
      const centerY = H * 0.52;
      const node1X = W * 0.16;
      const node2X = W * 0.48;
      const node3X = W * 0.82;

      // Bağlantı Hatları ve Akan Enerji Parçacıkları
      const drawFlowLine = (x1: number, x2: number, color: string) => {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, centerY);
        ctx.lineTo(x2, centerY);
        ctx.stroke();

        // Akan parlak parçacıklar
        for (let i = 0; i < 3; i++) {
          const prog = ((t * 0.45 + i * 0.33) % 1);
          const px = x1 + (x2 - x1) * prog;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, centerY, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      drawFlowLine(
        node1X + 55,
        node2X - 65,
        isReactiveMode ? "#f59e0b" : "#818cf8"
      );
      drawFlowLine(
        node2X + 65,
        node3X - 65,
        isReactiveMode ? "#10b981" : "#a78bfa"
      );

      // DÜĞÜM 1: Soru Verisi & İpuçları
      ctx.fillStyle = "rgba(30, 41, 59, 0.92)";
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(node1X - 62, centerY - 34, 124, 68, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#a5b4fc";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("1. SORU KANITLARI", node1X, centerY - 10);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 11px Inter, sans-serif";
      ctx.fillText(
        currentQuestionImage
          ? "Görsel + Metin Analizi"
          : currentQuestionText
          ? "Metin & Öncül Analizi"
          : "Soru Bekleniyor",
        node1X,
        centerY + 12
      );

      // DÜĞÜM 2: TYMM Kazanım & Süreç Filtresi
      const pulseR = 4 + Math.sin(t * 2.5) * 3;
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.strokeStyle = isReactiveMode ? "#f59e0b" : "#10b981";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(node2X - 70, centerY - 36, 140, 72, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isReactiveMode ? "#fbbf24" : "#34d399";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(
        isReactiveMode ? "⚡ REAKTİF ÇÖZÜM MOTORU" : "🧠 PROAKTİF SOKRATİK FİLTRE",
        node2X,
        centerY - 12
      );
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(`Kazanım: ${selectedOutcomeCode}`, node2X, centerY + 8);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(
        isReactiveMode ? "Tam Çözüm & Şık Eleme" : "İpucu & Çeldirici Eleme",
        node2X,
        centerY + 24
      );

      // DÜĞÜM 3: Şıklar Radarı (A, B, C, D, E)
      const letters =
        options.length > 0
          ? options.map((o) => o.letter)
          : ["A", "B", "C", "D"];
      const spacing = Math.min(34, (W * 0.24) / Math.max(4, letters.length));
      const startX = node3X - ((letters.length - 1) * spacing) / 2;

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(
        isReactiveMode
          ? `3. DOĞRU SEÇENEK: ${correctLetter || "ÇÖZÜLDÜ"}`
          : "3. ŞIK ELEME SİMÜLASYONU",
        node3X,
        centerY - 38
      );

      letters.forEach((ltr, idx) => {
        const bx = startX + idx * spacing;
        const by = centerY + 4;
        const isCorrectOpt = isReactiveMode && correctLetter === ltr;
        const isEliminatedOpt =
          eliminatedLetters.includes(ltr) ||
          (isReactiveMode && correctLetter && correctLetter !== ltr);

        ctx.save();
        if (isCorrectOpt) {
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 12 + pulseR;
          ctx.fillStyle = "#059669";
          ctx.strokeStyle = "#34d399";
        } else if (isEliminatedOpt) {
          ctx.fillStyle = "rgba(127, 29, 29, 0.35)";
          ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
        } else {
          ctx.fillStyle = "#1e293b";
          ctx.strokeStyle = "#6366f1";
        }

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, by, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isEliminatedOpt ? "#f87171" : "#ffffff";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillText(ltr, bx, by + 4);

        // Elenen şıkların üzerine çarpı çiz
        if (isEliminatedOpt) {
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx - 8, by - 8);
          ctx.lineTo(bx + 8, by + 8);
          ctx.moveTo(bx + 8, by - 8);
          ctx.lineTo(bx - 8, by + 8);
          ctx.stroke();
        }
        ctx.restore();
      });

      ctx.restore();
      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animId);
  }, [
    currentQuestionText,
    currentQuestionImage,
    selectedOutcomeCode,
    lastReactiveSolution,
    correctLetter,
    options,
    eliminatedLetters,
  ]);

  const toggleEliminateOption = (letter: string) => {
    setEliminatedLetters((prev) =>
      prev.includes(letter)
        ? prev.filter((l) => l !== letter)
        : [...prev, letter]
    );
  };

  // Son öğretmen mesajını al (Proaktif modda tahtada adım adım göstermek için)
  const latestTutorMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tutor") return messages[i];
    }
    return null;
  }, [messages]);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* 1. ÜST: CANLI ÇÖZÜM AKIŞ & ŞIK ELEME ANİMASYON SAHNESİ (HTML5 CANVAS) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-xl shrink-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Canlı Çözüm & Şık Eleme Animasyon Sahnesi
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              {activeUnit.gradeName} • {selectedOutcomeCode}
            </span>
          </div>

          {lastReactiveSolution && (
            <button
              type="button"
              onClick={() => {
                setAnimStepIndex(0);
                const total = lastReactiveSolution.stepByStep.length;
                for (let i = 1; i <= total; i++) {
                  setTimeout(() => setAnimStepIndex(i), i * 450);
                }
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              <span>Çözüm Animasyonunu Tekrar Oynat</span>
            </button>
          )}
        </div>

        <div className="relative h-28 sm:h-32 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            aria-label="Canlı Soru Çözüm ve Şık Eleme Animasyonu"
          />
        </div>
      </div>

      {/* 2. ORTA: AKTİF SORU GÖRSELİ, METNİ VE İNTERAKTİF ŞIK ELEME KARTLARI */}
      {(currentQuestionText || currentQuestionImage) && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              📋 İncelenen Sınav Sorusu & İnteraktif Şık Eleme Masası
            </span>
            {options.length > 0 && (
              <span className="text-[11px] text-slate-400">
                İpucu: Şıkların üzerine tıklayarak yanlış şıkları eleyebilirsiniz
              </span>
            )}
          </div>

          <div
            className={`grid gap-4 ${
              currentQuestionImage
                ? "grid-cols-1 xl:grid-cols-12"
                : "grid-cols-1"
            }`}
          >
            {/* Yüklenen Soru Fotoğrafı */}
            {currentQuestionImage && (
              <div className="xl:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentQuestionImage}
                  alt="Soru Görseli"
                  onClick={() => setZoomImage(true)}
                  className="max-h-64 w-auto object-contain rounded-lg cursor-zoom-in"
                />
                <button
                  type="button"
                  onClick={() => setZoomImage(true)}
                  className="mt-2 text-[11px] text-indigo-300 hover:text-white flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Görseli Tam Ekran Büyüt</span>
                </button>
              </div>
            )}

            {/* Soru Metni ve Tıklanabilir Şık Kartları */}
            <div
              className={
                currentQuestionImage
                  ? "xl:col-span-7 space-y-3"
                  : "w-full space-y-3"
              }
            >
              {currentQuestionText && (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                  {currentQuestionText}
                </div>
              )}

              {/* İnteraktif Şık Eleme Butonları */}
              {options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {options.map((opt) => {
                    const isCorrect =
                      lastReactiveSolution && correctLetter === opt.letter;
                    const isEliminated =
                      eliminatedLetters.includes(opt.letter) ||
                      (lastReactiveSolution &&
                        correctLetter &&
                        correctLetter !== opt.letter);

                    return (
                      <button
                        key={opt.letter}
                        type="button"
                        onClick={() => toggleEliminateOption(opt.letter)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition flex items-start justify-between gap-2 ${
                          isCorrect
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-100 shadow-lg shadow-emerald-950/50 scale-[1.01]"
                            : isEliminated
                            ? "bg-rose-950/25 border-rose-500/30 text-slate-500 line-through opacity-75"
                            : "bg-slate-950/80 border-slate-800 text-slate-200 hover:border-indigo-500/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 text-xs ${
                              isCorrect
                                ? "bg-emerald-500 text-slate-950"
                                : isEliminated
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-indigo-600/25 text-indigo-300"
                            }`}
                          >
                            {opt.letter}
                          </span>
                          <span className="leading-snug mt-0.5">{opt.text}</span>
                        </div>

                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : isEliminated ? (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. ALT: ADIM ADIM ÇÖZÜM TAHTASI (REAKTİF TAM ÇÖZÜM VEYA PROAKTİF SOKRATİK REHBER) */}
      {lastReactiveSolution ? (
        <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-xl p-5 shadow-2xl space-y-4 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 fill-slate-950" />
                REAKTİF TAM ÇÖZÜM TAHTASI ({lastReactiveSolution.outcomeCode})
              </span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                {lastReactiveSolution.correctAnswer}
              </span>
            </div>
          </div>

          {/* Animasyonlu Adım Adım Çözüm Kartları */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Adım Adım Çözüm Süreci:
            </h4>
            <div className="space-y-2">
              {lastReactiveSolution.stepByStep.map((step, idx) => {
                const isVisible = idx < animStepIndex;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all duration-500 ${
                      isVisible
                        ? "bg-slate-950/90 border-indigo-500/40 text-slate-100 translate-y-0 opacity-100"
                        : "bg-slate-950/30 border-slate-800/50 text-slate-500 translate-y-1 opacity-40"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed">{step}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Çeldirici Şık Analizi ve Pratik Sınav Taktiği */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Çeldirici & Yanlış Şık Analizi</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {lastReactiveSolution.distractorAnalysis}
              </p>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                <span>Pratik Sınav Taktiği & İpucu</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {lastReactiveSolution.examTip}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/95 border border-indigo-500/40 rounded-xl p-5 shadow-xl space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Proaktif Çözüm & Sokratik Rehberlik Tahtası
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Doğrudan cevap verilmez; ipuçlarıyla doğru şıkka adım adım
                    ulaşılır
                  </p>
                </div>
              </div>
            </div>

            {latestTutorMsg && (
              <div
                className="bg-slate-950/85 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-100 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatHtml(latestTutorMsg.content),
                }}
              />
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Sol taraftaki <strong>Chatbox</strong> üzerinden tahminini yaz
                veya yukarıdaki şıklara tıklayarak eleme yap!
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Görsel Büyütme (Zoom) Modalı */}
      {zoomImage && currentQuestionImage && (
        <div
          onClick={() => setZoomImage(false)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentQuestionImage}
            alt="Büyütülmüş Soru Görseli"
            className="max-h-[90vh] max-w-[92vw] object-contain rounded-xl border border-slate-700 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
