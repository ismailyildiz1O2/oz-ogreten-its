"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
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

/**
 * Canvas içinde metinlerin kutu dışına taşmasını önleyen otomatik satır kaydırma (word-wrap) yardımcısı
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
) {
  const words = text.split(/\s+/);
  let line = "";
  const lines: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length >= maxLines - 1) {
        // Kalan kelimeleri son satıra sığdır
        const rest = words.slice(i).join(" ");
        let truncated = rest;
        while (
          ctx.measureText(truncated + "...").width > maxWidth &&
          truncated.length > 3
        ) {
          truncated = truncated.slice(0, -1);
        }
        line = truncated !== rest ? `${truncated}...` : rest;
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  lines.forEach((l, idx) => {
    ctx.fillText(l, x, y + idx * lineHeight);
  });
}

type AnimationSceneType = "trablusgarp" | "physics-gravity" | "concept-clue";

export const VisualSolutionBoard: React.FC = () => {
  const {
    activeUnit,
    selectedOutcomeCode,
    currentQuestionText,
    currentQuestionImage,
    lastReactiveSolution,
    messages,
    simulation,
  } = useITSStore();

  const [eliminatedLetters, setEliminatedLetters] = useState<string[]>([]);
  const [animStepIndex, setAnimStepIndex] = useState<number>(0);
  const [storyStage, setStoryStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoomImage, setZoomImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const options = useMemo(
    () => parseOptions(currentQuestionText),
    [currentQuestionText]
  );

  // Sorunun konusuna göre hangi gerçek konu anlatım animasyonunun çalışacağını belirle
  const sceneType: AnimationSceneType = useMemo(() => {
    const qLower = currentQuestionText.toLowerCase();
    const codeUpper = selectedOutcomeCode.toUpperCase();
    const subjLower = activeUnit.subject.toLowerCase();

    if (
      qLower.includes("trablusgarp") ||
      qLower.includes("gazeteci şerif") ||
      qLower.includes("derne") ||
      qLower.includes("tobruk") ||
      qLower.includes("bingazi") ||
      codeUpper.includes("İTA.12.1.1") ||
      codeUpper.includes("ITA.12.1.1")
    ) {
      return "trablusgarp";
    }

    if (
      qLower.includes("kütle") ||
      qLower.includes("ağırlık") ||
      qLower.includes("dinamometre") ||
      qLower.includes("yerçekimi") ||
      subjLower.includes("fizik") ||
      codeUpper.startsWith("FİZ") ||
      codeUpper.startsWith("FB.")
    ) {
      return "physics-gravity";
    }

    return "concept-clue";
  }, [currentQuestionText, selectedOutcomeCode, activeUnit.subject]);

  // Konuya özel animasyon adımları (Alt barda ve Canvas içinde gösterilir)
  const storySteps = useMemo(() => {
    if (sceneType === "trablusgarp") {
      return [
        {
          title: "1. Jeopolitik Durum & Abluka",
          desc: "İtalya Trablusgarp'a saldırır. İtalyan donanması Akdeniz'i kapatır, İngiliz işgalindeki Mısır ise kara bağlantısını keser.",
          badge: "Tarihsel Arka Plan",
        },
        {
          title: "2. Gizli Yolculuk → Vatanseverlik",
          desc: "Mustafa Kemal, resmi zorunluluğu olmamasına rağmen 'Gazeteci Şerif' takma adıyla gizlice ve gönüllü olarak cepheye gider.",
          badge: "Kanıt 1: Vatanseverlik",
        },
        {
          title: "3. Halkı Örgütleme → Teşkilatçılık",
          desc: "Derne, Tobruk ve Bingazi'de dağınık yerel halkı birleştirip İtalyanlara karşı direniş cephesi oluşturur.",
          badge: "Kanıt 2: Teşkilatçılık",
        },
        {
          title: "4. Sentez & Doğru Şık",
          desc: "Gönüllü gitmesi VATANSEVERLİK, yerli halkı direnişe geçirmesi TEŞKİLATÇILIK (Örgütleyicilik) özelliğini kanıtlar.",
          badge: "Sonuç: Vatanseverlik & Teşkilatçılık",
        },
      ];
    }

    if (sceneType === "physics-gravity") {
      return [
        {
          title: "1. Kütle (m): Değişmeyen Madde Miktarı",
          desc: "Cismin içindeki madde miktarıdır. Eşit kollu terazi ile ölçülür; Dünya'da da Ay'da da aynı kalır.",
          badge: "Kütle = Sabit (kg)",
        },
        {
          title: "2. Yerçekimi Alanı (g)",
          desc: "Her gök cismi kütlesi nedeniyle çevresinde bir çekim alanı oluşturur. Gezegenden gezegene değişir.",
          badge: "Çekim İvmesi (m/s²)",
        },
        {
          title: "3. Ağırlık Kuvveti (G = m · g)",
          desc: "Kütleye etki eden yerçekimi kuvvetidir. Vektöreldir, yönü merkeze doğrudur ve dinamometre ile ölçülür.",
          badge: "Ağırlık = Kuvvet (Newton)",
        },
        {
          title: "4. Sentez & Soru Çözümü",
          desc: "Gezegen değiştiğinde kütle (m) sabit kalırken, ağırlık (G) yerçekimi ivmesiyle doğru orantılı değişir.",
          badge: "Kavram Sentezi",
        },
      ];
    }

    // Genel Soru & Kazanım Kanıt Eşleştirme Adımları
    return [
      {
        title: "1. Soru Kökü & Öncüllerin Tespiti",
        desc: "Soruda verilen anahtar kavramlar ve vurgulanmak istenen temel durum ayrıştırılır.",
        badge: "Kanıt Tespiti",
      },
      {
        title: `2. Kazanım Bağlantısı (${selectedOutcomeCode})`,
        desc: `${activeUnit.subject} dersi "${activeUnit.unitName}" ünitesindeki kazanım ölçütleriyle soru öncülleri eşleştirilir.`,
        badge: "Kazanım Eşleşmesi",
      },
      {
        title: "3. Çeldirici Şıkların Elenmesi",
        desc: "Metinde kanıtı bulunmayan veya aşırı genelleme içeren çeldirici seçenekler elenir.",
        badge: "Eleme Süreci",
      },
      {
        title: "4. Doğru Seçeneğin Doğrulanması",
        desc: "Sorudaki tüm öncülleri eksiksiz karşılayan seçenek kanıtlarıyla birlikte işaretlenir.",
        badge: "Doğrulama",
      },
    ];
  }, [sceneType, selectedOutcomeCode, activeUnit.subject, activeUnit.unitName]);

  // Reaktif çözümdeki doğru şık harfini tespit et (Örn: "Doğru Cevap: B Şıkkı...")
  const correctLetter = useMemo(() => {
    if (!lastReactiveSolution?.correctAnswer) return null;
    const m = lastReactiveSolution.correctAnswer.match(
      /(?:Cevap:\s*)?([A-E])\s*Şıkkı/i
    );
    return m ? m[1].toUpperCase() : null;
  }, [lastReactiveSolution]);

  // Otomatik sahne ilerletici (Oynat modundayken her 4.2 saniyede bir sonraki konu adımına geçer)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setStoryStage((prev) => (prev + 1) % storySteps.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isPlaying, storySteps.length]);

  // Soru değiştiğinde sıfırla
  useEffect(() => {
    setEliminatedLetters([]);
    setAnimStepIndex(0);
    setStoryStage(0);
  }, [currentQuestionText, currentQuestionImage]);

  // Reaktif çözüm geldiğinde adım animasyonunu sırayla oynat ve son sahneye odaklan
  useEffect(() => {
    if (!lastReactiveSolution) return;
    setStoryStage(3);
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
  // KONUYA ÖZEL CANLI ANİMASYON MOTORU (HTML5 CANVAS - 60 FPS)
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.025;
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

      // Arka Plan
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#070d19");
      bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Hafif Grid
      ctx.strokeStyle = "rgba(99, 102, 241, 0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // =====================================================================
      // SAHNE 1: TRABLUSGARP SAVAŞI & MUSTAFA KEMAL HARİTA ANİMASYONU
      // =====================================================================
      if (sceneType === "trablusgarp") {
        const mapW = W * 0.56;

        // Akdeniz Deniz Alanı
        const seaGrad = ctx.createLinearGradient(0, 0, mapW, H);
        seaGrad.addColorStop(0, "rgba(14, 116, 144, 0.18)");
        seaGrad.addColorStop(1, "rgba(30, 58, 138, 0.22)");
        ctx.fillStyle = seaGrad;
        ctx.beginPath();
        ctx.roundRect(12, 12, mapW - 20, H - 24, 14);
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Akdeniz Etiketi
        ctx.fillStyle = "rgba(125, 211, 252, 0.35)";
        ctx.font = "italic bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("AKDENİZ", mapW * 0.45, H * 0.48);

        // Coğrafi Noktalar
        const italyPos = { x: mapW * 0.2, y: H * 0.24 };
        const istanbulPos = { x: mapW * 0.82, y: H * 0.22 };
        const egyptPos = { x: mapW * 0.84, y: H * 0.72 };
        const tripoliPos = { x: mapW * 0.34, y: H * 0.78 };

        // 1. İtalya ve Deniz Ablukası (Adım 0 ve sonrasında aktif)
        ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(italyPos.x - 48, italyPos.y - 20, 96, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fca5a5";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText("İTALYA", italyPos.x, italyPos.y - 3);
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = "#f87171";
        ctx.fillText("⚓ Deniz Ablukası", italyPos.x, italyPos.y + 12);

        // İtalya -> Trablusgarp Saldırı Hattı
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(italyPos.x, italyPos.y + 22);
        ctx.lineTo(tripoliPos.x - 20, tripoliPos.y - 24);
        ctx.stroke();
        ctx.restore();

        // 2. İstanbul (Osmanlı Başkenti)
        ctx.fillStyle = "rgba(99, 102, 241, 0.22)";
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(istanbulPos.x - 52, istanbulPos.y - 20, 104, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e0e7ff";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText("İSTANBUL", istanbulPos.x, istanbulPos.y - 3);
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = "#a5b4fc";
        ctx.fillText("Osmanlı Merkezi", istanbulPos.x, istanbulPos.y + 12);

        // 3. Mısır (İngiliz İşgali - Kara Engel)
        ctx.fillStyle = "rgba(245, 158, 11, 0.16)";
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(egyptPos.x - 52, egyptPos.y - 20, 104, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fde68a";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText("MISIR (İngiliz)", egyptPos.x, egyptPos.y - 3);
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("🚫 Ordu Geçemez", egyptPos.x, egyptPos.y + 12);

        // 4. Trablusgarp (Derne, Tobruk, Bingazi)
        const isOrganizing = storyStage >= 2;
        ctx.fillStyle = isOrganizing
          ? "rgba(16, 185, 129, 0.25)"
          : "rgba(30, 41, 59, 0.9)";
        ctx.strokeStyle = isOrganizing ? "#10b981" : "#64748b";
        ctx.lineWidth = isOrganizing ? 2.5 : 1.8;
        ctx.beginPath();
        ctx.roundRect(tripoliPos.x - 78, tripoliPos.y - 26, 156, 48, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText("TRABLUSGARP CEPHESİ", tripoliPos.x, tripoliPos.y - 6);
        ctx.fillStyle = isOrganizing ? "#6ee7b7" : "#cbd5e1";
        ctx.font = "600 10px Inter, sans-serif";
        ctx.fillText(
          "Derne • Tobruk • Bingazi",
          tripoliPos.x,
          tripoliPos.y + 11
        );

        // Mustafa Kemal'in Gizli Rotası: İstanbul -> Mısır -> Trablusgarp
        if (storyStage >= 1) {
          ctx.save();
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(istanbulPos.x, istanbulPos.y + 20);
          ctx.quadraticCurveTo(
            mapW * 0.92,
            H * 0.48,
            egyptPos.x,
            egyptPos.y - 20
          );
          ctx.moveTo(egyptPos.x - 52, egyptPos.y);
          ctx.lineTo(tripoliPos.x + 78, tripoliPos.y);
          ctx.stroke();
          ctx.restore();

          // Hareket Eden "Gazeteci Şerif" İkonu
          const routeProg =
            storyStage === 1 ? (t * 0.35) % 1 : 1; // Adım 2 ve sonrasında cepheye ulaşmış
          let travelerX = tripoliPos.x + 78;
          let travelerY = tripoliPos.y;
          if (routeProg < 0.5) {
            const p = routeProg * 2;
            travelerX = istanbulPos.x + (egyptPos.x - istanbulPos.x) * p;
            travelerY =
              istanbulPos.y + 20 + (egyptPos.y - 20 - (istanbulPos.y + 20)) * p;
          } else {
            const p = (routeProg - 0.5) * 2;
            travelerX =
              egyptPos.x - 52 + (tripoliPos.x + 78 - (egyptPos.x - 52)) * p;
            travelerY = egyptPos.y + (tripoliPos.y - egyptPos.y) * p;
          }

          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.arc(travelerX, travelerY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fef3c7";
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.fillText(
            "🕵️ Gazeteci Şerif",
            travelerX,
            travelerY - 12
          );
        }

        // Derne-Tobruk-Bingazi Halk Örgütlenmesi Dalgaları (Adım 2+)
        if (storyStage >= 2) {
          const ringR = 18 + ((t * 22) % 38);
          ctx.strokeStyle = `rgba(16, 185, 129, ${
            1 - ((ringR - 18) / 38)
          })`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(tripoliPos.x, tripoliPos.y, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // SAĞ TARAF: KANIT -> KİŞİLİK ÖZELLİĞİ KARTLARI (Taşma Olmadan)
        const rightX = mapW + 8;
        const rightW = W - rightX - 14;

        // Kart 1: Gönüllü & Gizli Gitmesi -> Vatanseverlik
        const card1Active = storyStage >= 1;
        ctx.fillStyle = card1Active
          ? "rgba(79, 70, 229, 0.22)"
          : "rgba(15, 23, 42, 0.75)";
        ctx.strokeStyle = card1Active ? "#818cf8" : "#334155";
        ctx.lineWidth = card1Active ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(rightX, 14, rightW, (H - 38) / 2, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = card1Active ? "#a5b4fc" : "#64748b";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText(
          "KANIT 1: Gazeteci Şerif Kimliğiyle Gönüllü Gitmesi",
          rightX + 12,
          34
        );
        ctx.fillStyle = card1Active ? "#ffffff" : "#94a3b8";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.fillText(
          "➜ VATANSEVERLİK (Özveri & Fedakârlık)",
          rightX + 12,
          54
        );
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px Inter, sans-serif";
        drawWrappedText(
          ctx,
          "Zorunluluğu yokken vatan toprağını savunmak için tehlikeyi göze alıp cepheye koşması.",
          rightX + 12,
          72,
          rightW - 24,
          14,
          2
        );

        // Kart 2: Derne, Tobruk ve Bingazi'de Halkı Örgütlemesi -> Teşkilatçılık
        const card2Active = storyStage >= 2;
        const card2Y = 22 + (H - 38) / 2;
        ctx.fillStyle = card2Active
          ? "rgba(16, 185, 129, 0.22)"
          : "rgba(15, 23, 42, 0.75)";
        ctx.strokeStyle = card2Active ? "#34d399" : "#334155";
        ctx.lineWidth = card2Active ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(rightX, card2Y, rightW, (H - 38) / 2, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = card2Active ? "#6ee7b7" : "#64748b";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText(
          "KANIT 2: Derne, Tobruk ve Bingazi'de Halkı Birleştirmesi",
          rightX + 12,
          card2Y + 20
        );
        ctx.fillStyle = card2Active ? "#ffffff" : "#94a3b8";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.fillText(
          "➜ TEŞKİLATÇILIK (Örgütleyicilik & Liderlik)",
          rightX + 12,
          card2Y + 40
        );
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px Inter, sans-serif";
        drawWrappedText(
          ctx,
          "Dağınık yerel kuvvetleri tek bir merkez etrafında birleştirip düzenli direniş başlatması.",
          rightX + 12,
          card2Y + 58,
          rightW - 24,
          14,
          2
        );
      }

      // =====================================================================
      // SAHNE 2: FİZİK (KÜTLE, YERÇEKİMİ VE AĞIRLIK VEKTÖR ANİMASYONU)
      // =====================================================================
      else if (sceneType === "physics-gravity") {
        const colW = (W - 48) / 3;
        const m = simulation.mass;
        const g =
          simulation.planet === "earth"
            ? 9.8
            : simulation.planet === "moon"
            ? 1.6
            : simulation.planet === "mars"
            ? 3.7
            : 24.8;
        const G = (m * g).toFixed(1);

        // Sütun 1: Kütle (m) - Değişmez Parçacık Modeli
        ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
        ctx.strokeStyle = storyStage === 0 ? "#38bdf8" : "#334155";
        ctx.lineWidth = storyStage === 0 ? 2.2 : 1.2;
        ctx.beginPath();
        ctx.roundRect(12, 14, colW, H - 28, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillText("1. KÜTLE (m) — DEĞİŞMEZ", 12 + colW / 2, 36);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Inter, sans-serif";
        ctx.fillText(`m = ${m} kg`, 12 + colW / 2, 62);

        // Madde Parçacıkları
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 4; c++) {
            ctx.fillStyle = "#0ea5e9";
            ctx.beginPath();
            ctx.arc(
              12 + colW / 2 - 27 + c * 18,
              95 + r * 18,
              6,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText(
          "Her gezegende madde miktarı sabit",
          12 + colW / 2,
          H - 26
        );

        // Sütun 2: Yerçekimi İvmesi (g)
        const col2X = 24 + colW;
        ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
        ctx.strokeStyle = storyStage === 1 ? "#a855f7" : "#334155";
        ctx.lineWidth = storyStage === 1 ? 2.2 : 1.2;
        ctx.beginPath();
        ctx.roundRect(col2X, 14, colW, H - 28, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#c084fc";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillText("2. ÇEKİM ALANI (g)", col2X + colW / 2, 36);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Inter, sans-serif";
        ctx.fillText(`g = ${g} m/s²`, col2X + colW / 2, 62);

        // Aşağı akan çekim alanı çizgileri
        for (let i = -2; i <= 2; i++) {
          const lx = col2X + colW / 2 + i * 24;
          const arrowY = 80 + ((t * 35 + (i + 2) * 12) % 65);
          ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(lx, 78);
          ctx.lineTo(lx, 150);
          ctx.stroke();

          ctx.fillStyle = "#c084fc";
          ctx.beginPath();
          ctx.arc(lx, arrowY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText("Gezegenin çekim şiddeti", col2X + colW / 2, H - 26);

        // Sütun 3: Ağırlık Kuvveti (G = m.g)
        const col3X = 36 + colW * 2;
        ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
        ctx.strokeStyle = storyStage >= 2 ? "#10b981" : "#334155";
        ctx.lineWidth = storyStage >= 2 ? 2.2 : 1.2;
        ctx.beginPath();
        ctx.roundRect(col3X, 14, colW, H - 28, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#34d399";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillText("3. AĞIRLIK (G = m · g)", col3X + colW / 2, 36);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Inter, sans-serif";
        ctx.fillText(`G = ${G} N`, col3X + colW / 2, 62);

        // Vektör Oku
        const vecLen = Math.min(68, Math.max(22, g * 2.5));
        const cx = col3X + colW / 2;
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, 82);
        ctx.lineTo(cx, 82 + vecLen);
        ctx.stroke();
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.moveTo(cx - 7, 82 + vecLen - 6);
        ctx.lineTo(cx + 7, 82 + vecLen - 6);
        ctx.lineTo(cx, 82 + vecLen + 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText(
          "Dinamometre ile ölçülür (Değişken)",
          col3X + colW / 2,
          H - 26
        );
      }

      // =====================================================================
      // SAHNE 3: GENEL SORU KANIT -> KAZANIM & ŞIK EŞLEŞTİRME SAHNESİ
      // =====================================================================
      else {
        const leftW = W * 0.62;
        const rightX = leftW + 16;
        const rightW = W - rightX - 12;

        // Sol Kutu: Sorudan Çıkarılan Anahtar Kanıtlar (Otomatik Satır Kaydırmalı)
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(12, 14, leftW - 12, H - 28, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#a5b4fc";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillText(
          `📌 SORU KANIT & KAZANIM ANALİZİ (${selectedOutcomeCode})`,
          26,
          38
        );

        const cleanQuestion = currentQuestionText
          ? currentQuestionText.split(/\n\s*[A-E][\)\.\-:]/i)[0].trim()
          : `${activeUnit.subject} - ${activeUnit.unitName} kapsamında çözemediğiniz soruyu sol panelden ekleyin.`;

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "12px Inter, sans-serif";
        drawWrappedText(ctx, cleanQuestion, 26, 62, leftW - 44, 18, 4);

        // Alt Bilgi: Aktif Analiz Adımı
        const activeStepObj = storySteps[storyStage] || storySteps[0];
        ctx.fillStyle = "rgba(79, 70, 229, 0.2)";
        ctx.beginPath();
        ctx.roundRect(24, H - 64, leftW - 36, 40, 8);
        ctx.fill();

        ctx.fillStyle = "#34d399";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText(activeStepObj.title, 34, H - 46);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px Inter, sans-serif";
        drawWrappedText(ctx, activeStepObj.desc, 34, H - 31, leftW - 56, 14, 1);

        // Sağ Kutu: Şıkların Canlı Doğrulama Durumu
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = lastReactiveSolution ? "#10b981" : "#475569";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(rightX, 14, rightW, H - 28, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.fillText(
          lastReactiveSolution
            ? `✅ DOĞRU ŞIK: ${correctLetter || "BULUNDU"}`
            : "🎯 ŞIK ELEME TABLOSU",
          rightX + rightW / 2,
          38
        );

        const letters =
          options.length > 0
            ? options.map((o) => o.letter)
            : ["A", "B", "C", "D", "E"];
        const btnGap = Math.min(44, (rightW - 24) / letters.length);
        const startBx =
          rightX + rightW / 2 - ((letters.length - 1) * btnGap) / 2;

        letters.forEach((ltr, idx) => {
          const bx = startBx + idx * btnGap;
          const by = H * 0.56;
          const isCorrect =
            Boolean(lastReactiveSolution) && correctLetter === ltr;
          const isEliminated =
            eliminatedLetters.includes(ltr) ||
            (Boolean(lastReactiveSolution) &&
              Boolean(correctLetter) &&
              correctLetter !== ltr);

          ctx.fillStyle = isCorrect
            ? "#059669"
            : isEliminated
            ? "rgba(127, 29, 29, 0.45)"
            : "#1e293b";
          ctx.strokeStyle = isCorrect
            ? "#34d399"
            : isEliminated
            ? "#ef4444"
            : "#6366f1";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(bx, by, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px Inter, sans-serif";
          ctx.fillText(ltr, bx, by + 4);
        });
      }

      ctx.restore();
      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animId);
  }, [
    sceneType,
    storyStage,
    storySteps,
    currentQuestionText,
    selectedOutcomeCode,
    activeUnit.subject,
    activeUnit.unitName,
    lastReactiveSolution,
    correctLetter,
    options,
    eliminatedLetters,
    simulation,
  ]);

  const toggleEliminateOption = (letter: string) => {
    setEliminatedLetters((prev) =>
      prev.includes(letter)
        ? prev.filter((l) => l !== letter)
        : [...prev, letter]
    );
  };

  // Son öğretmen mesajını al
  const latestTutorMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tutor") return messages[i];
    }
    return null;
  }, [messages]);

  const currentStory = storySteps[storyStage] || storySteps[0];

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* 1. ÜST: KONUYA ÖZEL CANLI KONU ANLATIM & ÇÖZÜM ANİMASYONU */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 shadow-xl shrink-0 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              {sceneType === "trablusgarp"
                ? "🗺️ Trablusgarp Savaşı & Mustafa Kemal'in Kişilik Özellikleri Animasyonu"
                : sceneType === "physics-gravity"
                ? "⚖️ Kütle, Yerçekimi İvmesi ve Ağırlık Vektör Animasyonu"
                : `🎯 Soruya Özel Kanıt & Kazanım (${selectedOutcomeCode}) Animasyonu`}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              {currentStory.badge}
            </span>
          </div>

          {/* Animasyon Oynatma & Adım Kontrolleri */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setStoryStage(
                  (prev) => (prev - 1 + storySteps.length) % storySteps.length
                )
              }
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Önceki Konu Adımı"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition flex items-center gap-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Duraklat</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Oynat</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setStoryStage((prev) => (prev + 1) % storySteps.length)
              }
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Sonraki Konu Adımı"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStoryStage(0);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Baştan Oynat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* HTML5 Canvas Görsel Konu Anlatım Alanı */}
        <div className="relative h-48 sm:h-52 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            aria-label="Sorunun Konusuna Özel Etkileşimli Konu Anlatım Animasyonu"
          />
        </div>

        {/* Tıklanabilir 4 Aşamalı Konu Anlatım Adım Çubuğu */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-0.5">
          {storySteps.map((st, idx) => {
            const active = idx === storyStage;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setStoryStage(idx);
                  setIsPlaying(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${
                  active
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                    : "bg-slate-950/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <div className="text-[11px] font-bold text-indigo-300 truncate">
                  {st.title}
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                  {st.desc}
                </p>
              </button>
            );
          })}
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
