"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import { analyzeQuestionDeeply } from "@/lib/question-analyzer";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Film,
  GitBranch,
  HelpCircle,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from "lucide-react";

type VisualPresentationTab =
  | "solution"
  | "video"
  | "avatar"
  | "diagram"
  | "map"
  | "chart";

function formatHtml(raw: string): string {
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
    "<code class='px-1.5 py-0.5 rounded bg-slate-950/90 text-indigo-300 font-mono text-xs'>$1</code>"
  );
  safe = safe.replace(/\n/g, "<br />");

  return safe;
}

function stripMarkdownForSpeech(raw: string): string {
  return (raw || "")
    .replace(/\$\$[\s\S]+?\$\$/g, " ")
    .replace(/\$([^$\n]+?)\$/g, "$1")
    .replace(/[**_`#>-]/g, " ")
    .replace(/[🧠⚡📌❓✅⚠️💡🎉📋🧭🔹•]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
) {
  const words = (text || "").split(/\s+/);
  let line = "";
  const lines: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length >= maxLines - 1) {
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

export const VisualSolutionBoard: React.FC = () => {
  const {
    activeUnit,
    selectedOutcomeCode,
    currentQuestionText,
    currentQuestionImage,
    lastReactiveSolution,
    messages,
    planet,
    mass,
  } = useITSStore();

  const [visualTab, setVisualTab] = useState<VisualPresentationTab>("solution");
  const [eliminatedLetters, setEliminatedLetters] = useState<string[]>([]);
  const [animStepIndex, setAnimStepIndex] = useState<number>(0);
  const [storyStage, setStoryStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoomImage, setZoomImage] = useState(false);
  const [revealedSubAnswers, setRevealedSubAnswers] = useState<number[]>([]);

  // Gemini Sesi / Sesli Avatar Durumları
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [spokenSubtitle, setSpokenSubtitle] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardContainerRef = useRef<HTMLDivElement | null>(null);

  const analysis = useMemo(
    () =>
      analyzeQuestionDeeply(
        currentQuestionText,
        activeUnit,
        selectedOutcomeCode
      ),
    [currentQuestionText, activeUnit, selectedOutcomeCode]
  );

  const { sceneKind, storySteps, options, subQuestions, detectedKeywords } =
    analysis;

  const correctLetter = useMemo(() => {
    if (!lastReactiveSolution?.correctAnswer) return null;
    const m = lastReactiveSolution.correctAnswer.match(
      /(?:Cevap:\s*)?([A-E])\s*Şıkkı/i
    );
    return m ? m[1].toUpperCase() : null;
  }, [lastReactiveSolution]);

  const latestTutorMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tutor") return messages[i];
    }
    return null;
  }, [messages]);

  // Sesli Anlatım (Gemini / Web Speech Doğal Türkçe Ses Motoru)
  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakText = (rawText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const clean = stripMarkdownForSpeech(rawText);
    if (!clean) return;

    setSpokenSubtitle(clean);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "tr-TR";
    utterance.rate = speechRate;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const trVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().includes("tr") &&
          (v.name.toLowerCase().includes("google") ||
            v.name.toLowerCase().includes("natural") ||
            v.name.toLowerCase().includes("emel") ||
            v.name.toLowerCase().includes("ahmet"))
      ) || voices.find((v) => v.lang.toLowerCase().includes("tr"));

    if (trVoice) {
      utterance.voice = trVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Otomatik sahne ilerletici
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setStoryStage((prev) => (prev + 1) % storySteps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying, storySteps.length]);

  // Soru değiştiğinde sıfırla
  useEffect(() => {
    stopSpeech();
    setEliminatedLetters([]);
    setAnimStepIndex(0);
    setStoryStage(0);
    setZoomImage(false);
    setIsPlaying(true);
    setRevealedSubAnswers([]);
    if (boardContainerRef.current) {
      boardContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionText, currentQuestionImage]);

  // Hızlı Çöz geldiğinde adımları sırayla göster
  useEffect(() => {
    if (!lastReactiveSolution) return;
    setStoryStage(storySteps.length - 1);
    setRevealedSubAnswers(subQuestions.map((sq) => sq.index));
    setAnimStepIndex(0);
    const total = lastReactiveSolution.stepByStep.length;
    const timers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= total; i++) {
      timers.push(
        setTimeout(() => {
          setAnimStepIndex(i);
        }, i * 300)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [lastReactiveSolution, storySteps.length, subQuestions]);

  // =========================================================================
  // VİDEO ANİMASYON & HARİTA CANVAS MOTORU (60 FPS)
  // =========================================================================
  useEffect(() => {
    if (visualTab !== "video" && visualTab !== "map") return;
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

      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#070d19");
      bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

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

      // HARİTA SEKMESİ VEYA TRABLUSGARP SAHNESİ
      if (sceneKind === "trablusgarp" || (visualTab === "map" && sceneKind !== "solar-system" && sceneKind !== "biology-cell")) {
        const mapW = W * 0.56;
        const seaGrad = ctx.createLinearGradient(0, 0, mapW, H);
        seaGrad.addColorStop(0, "rgba(14, 116, 144, 0.2)");
        seaGrad.addColorStop(1, "rgba(30, 58, 138, 0.25)");
        ctx.fillStyle = seaGrad;
        ctx.beginPath();
        ctx.roundRect(12, 12, mapW - 20, H - 24, 14);
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "rgba(125, 211, 252, 0.4)";
        ctx.font = "italic bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          sceneKind === "trablusgarp" ? "AKDENİZ HAVZASI HARİTASI" : "MEKÂNSAL KONU HARİTASI",
          mapW * 0.45,
          H * 0.48
        );

        const p1 = { x: mapW * 0.22, y: H * 0.24 };
        const p2 = { x: mapW * 0.8, y: H * 0.24 };
        const p3 = { x: mapW * 0.82, y: H * 0.74 };
        const p4 = { x: mapW * 0.34, y: H * 0.76 };

        const nodes =
          sceneKind === "trablusgarp"
            ? [
                { pos: p1, title: "İTALYA", sub: "⚓ Deniz Ablukası", color: "#ef4444" },
                { pos: p2, title: "İSTANBUL", sub: "Osmanlı Merkezi", color: "#818cf8" },
                { pos: p3, title: "MISIR", sub: "🚫 Kara Yolu Kapalı", color: "#f59e0b" },
                { pos: p4, title: "TRABLUSGARP", sub: "Derne • Tobruk • Bingazi", color: "#10b981" },
              ]
            : storySteps.map((st, idx) => ({
                pos: [p1, p2, p3, p4][idx % 4],
                title: st.badge,
                sub: st.title,
                color: ["#38bdf8", "#818cf8", "#f59e0b", "#10b981"][idx % 4],
              }));

        // Rota Çizgisi
        ctx.save();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y + 18);
        ctx.lineTo(p3.x, p3.y - 18);
        ctx.lineTo(p4.x + 55, p4.y);
        ctx.stroke();
        ctx.restore();

        nodes.forEach((n) => {
          ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(n.pos.x - 56, n.pos.y - 20, 112, 40, 8);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10.5px Inter, sans-serif";
          ctx.fillText(n.title, n.pos.x, n.pos.y - 3);
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "9.5px Inter, sans-serif";
          ctx.fillText(n.sub.slice(0, 22), n.pos.x, n.pos.y + 12);
        });

        const rightX = mapW + 6;
        const rightW = W - rightX - 12;
        const activeSt = storySteps[storyStage] || storySteps[0];

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(rightX, 14, rightW, H - 28, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#a5b4fc";
        ctx.font = "bold 11.5px Inter, sans-serif";
        ctx.fillText(`🗺️ ${activeSt.badge}`, rightX + 14, 38);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12.5px Inter, sans-serif";
        drawWrappedText(ctx, activeSt.title, rightX + 14, 60, rightW - 28, 16, 2);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11.5px Inter, sans-serif";
        drawWrappedText(ctx, activeSt.desc, rightX + 14, 96, rightW - 28, 16, 5);
      }
      // BİYOLOJİ HÜCRE DÖNGÜSÜ & ÜREME ANİMASYONU
      else if (sceneKind === "biology-cell") {
        const leftW = W * 0.54;
        const rightX = leftW + 8;
        const rightW = W - rightX - 12;

        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(12, 12, leftW - 12, H - 24, 14);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#6ee7b7";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText(
          "🧬 HÜCRE DÖNGÜSÜ (G₁-S-G₂-M), G₀ NÖRON EVRESİ & ÜREME MODELİ",
          22,
          29
        );

        const wheelCx = 82;
        const wheelCy = H * 0.57;
        const wheelR = Math.min(46, H * 0.25);

        const phases = [
          { start: -Math.PI * 0.8, end: -Math.PI * 0.1, color: "#38bdf8" },
          { start: -Math.PI * 0.05, end: Math.PI * 0.45, color: "#a855f7" },
          { start: Math.PI * 0.5, end: Math.PI * 0.85, color: "#f59e0b" },
          { start: Math.PI * 0.9, end: Math.PI * 1.15, color: "#10b981" },
        ];

        phases.forEach((ph) => {
          ctx.strokeStyle = ph.color;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(wheelCx, wheelCy, wheelR, ph.start, ph.end);
          ctx.stroke();
        });

        const activeAngle = (t * 1.4) % (Math.PI * 2);
        const dotX = wheelCx + Math.cos(activeAngle) * wheelR;
        const dotY = wheelCy + Math.sin(activeAngle) * wheelR;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText("HÜCRE", wheelCx, wheelCy - 3);
        ctx.fillText("DÖNGÜSÜ", wheelCx, wheelCy + 9);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "9.5px Inter, sans-serif";
        ctx.fillText("G₁ → S → G₂ → M", wheelCx, wheelCy + wheelR + 18);

        const g0X = wheelCx + wheelR + 54;
        const g0Y = wheelCy - 24;
        const isG0Highlighted = storyStage === 2 || storyStage === 3;

        ctx.save();
        ctx.strokeStyle = isG0Highlighted ? "#f43f5e" : "#64748b";
        ctx.lineWidth = isG0Highlighted ? 2.2 : 1.4;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(wheelCx + wheelR * 0.7, wheelCy - wheelR * 0.7);
        ctx.lineTo(g0X - 28, g0Y);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = isG0Highlighted
          ? "rgba(244, 63, 94, 0.22)"
          : "rgba(30, 41, 59, 0.85)";
        ctx.strokeStyle = isG0Highlighted ? "#fb7185" : "#475569";
        ctx.lineWidth = isG0Highlighted ? 2 : 1.2;
        ctx.beginPath();
        ctx.roundRect(g0X - 28, g0Y - 18, 92, 38, 8);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = isG0Highlighted ? "#fda4af" : "#cbd5e1";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText("🔒 G₀ EVRESİ", g0X + 18, g0Y - 3);
        ctx.fillStyle = "#ffffff";
        ctx.font = "9.5px Inter, sans-serif";
        ctx.fillText("Nöron & Kas (Bölünmez)", g0X + 18, g0Y + 11);

        const divCx = leftW - 76;
        const divCy = wheelCy + 14;
        const sep = Math.abs(Math.sin(t * 1.6)) * 18;

        ctx.fillStyle =
          storyStage === 0
            ? "rgba(56, 189, 248, 0.3)"
            : "rgba(16, 185, 129, 0.3)";
        ctx.strokeStyle = storyStage === 0 ? "#38bdf8" : "#10b981";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(divCx - sep, divCy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(divCx + sep, divCy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 9.5px Inter, sans-serif";
        ctx.fillText(
          storyStage === 0
            ? "Optimum: Eşeysiz (2n)"
            : "Stres: Eşeyli (Çeşitlilik)",
          divCx,
          divCy + 32
        );

        const cardH = (H - 36) / 3;
        const bioCards = [
          {
            active: storyStage === 0 || storyStage === 3,
            border: "#38bdf8",
            bg: "rgba(56, 189, 248, 0.16)",
            title: "1. EVRİMSEL & ENERJETİK ANALİZ",
            line1: "Optimum ➜ Eşeysiz: Düşük enerji, hızlı artış, sabit uyum",
            line2: "Stres ➜ Eşeyli: Genetik çeşitlilik ile yeni ortama adaptasyon",
          },
          {
            active: storyStage === 1 || storyStage === 3,
            border: "#f59e0b",
            bg: "rgba(245, 158, 11, 0.16)",
            title: "2. HİPOTEZ ÇÜRÜTME (2 HATA)",
            line1: "Hata 1: Çok hücrelide mitoz üreme değil BÜYÜME & ONARIM sağlar.",
            line2: "Hata 2: Üreme bireyin yaşamı için değil, NESLİN DEVAMI içindir.",
          },
          {
            active: storyStage === 2 || storyStage === 3,
            border: "#10b981",
            bg: "rgba(16, 185, 129, 0.16)",
            title: "3. HÜCRE DÖNGÜSÜ & G₀ (NÖRON)",
            line1: "Nöronlar bölünseydi sinaptik hafıza ağları kopar, iletim dururdu.",
            line2: "Kontrolsüz somatik bölünme doku bütünlüğünü bozar (tümör).",
          },
        ];

        bioCards.forEach((c, idx) => {
          const cy = 12 + idx * (cardH + 6);
          ctx.fillStyle = c.active ? c.bg : "rgba(15, 23, 42, 0.8)";
          ctx.strokeStyle = c.active ? c.border : "#334155";
          ctx.lineWidth = c.active ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect(rightX, cy, rightW, cardH, 9);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = "left";
          ctx.fillStyle = c.active ? "#ffffff" : "#94a3b8";
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.fillText(c.title, rightX + 10, cy + 15);
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "10px Inter, sans-serif";
          drawWrappedText(ctx, c.line1, rightX + 10, cy + 29, rightW - 18, 12, 1);
          ctx.fillStyle = "#cbd5e1";
          drawWrappedText(ctx, c.line2, rightX + 10, cy + 43, rightW - 18, 12, 1);
        });
      }
      // GÜNEŞ SİSTEMİ ANİMASYONU
      else if (sceneKind === "solar-system") {
        const spaceW = W * 0.64;
        ctx.fillStyle = "rgba(8, 12, 28, 0.92)";
        ctx.strokeStyle = "rgba(99, 102, 241, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(12, 12, spaceW - 16, H - 24, 14);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#fde68a";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText(
          "☀️ GÜNEŞ'E YAKINLIK SIRASIYLA 8 GEZEGEN",
          24,
          30
        );

        const sunX = 36;
        const sunY = H * 0.54;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.fillStyle = "#fef3c7";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.fillText("GÜNEŞ", sunX + 2, sunY + 30);

        const planets = [
          { name: "Merkür", r: 5.5, color: "#94a3b8", type: "inner", order: 1 },
          { name: "Venüs", r: 8, color: "#fbbf24", type: "inner", order: 2 },
          { name: "Dünya", r: 8.5, color: "#38bdf8", type: "inner", order: 3 },
          { name: "Mars", r: 6.5, color: "#f87171", type: "inner", order: 4 },
          { name: "Jüpiter", r: 16, color: "#fb923c", type: "outer", order: 5 },
          { name: "Satürn", r: 13.5, color: "#facc15", type: "outer", order: 6, prominentRing: true },
          { name: "Uranüs", r: 10.5, color: "#2dd4bf", type: "outer", order: 7 },
          { name: "Neptün", r: 10, color: "#60a5fa", type: "outer", order: 8 },
        ];

        const startX = 82;
        const usableW = spaceW - 106;
        const stepX = usableW / 8.2;

        planets.forEach((p, idx) => {
          const offsetAfterBelt = idx >= 4 ? stepX * 0.45 : 0;
          const px = startX + idx * stepX + offsetAfterBelt;
          const py = sunY + Math.sin(t * 2 + idx * 0.8) * 3.5;

          if (p.prominentRing) {
            ctx.save();
            ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(px, py, p.r + 8, 4.5, -0.25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(px, py, p.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#cbd5e1";
          ctx.font = "bold 9px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${p.order}.`, px, py - p.r - 8);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9.5px Inter, sans-serif";
          ctx.fillText(p.name, px, H - 18);
        });

        const rightX = spaceW + 4;
        const rightW = W - rightX - 12;
        const cardH = (H - 34) / 2;

        ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(rightX, 12, rightW, cardH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "#7dd3fc";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText("🪨 İÇ (KARASAL) GEZEGENLER (1-4)", rightX + 10, 30);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11.5px Inter, sans-serif";
        ctx.fillText("Merkür • Venüs • Dünya • Mars", rightX + 10, 47);

        const card2Y = 20 + cardH;
        ctx.fillStyle = "rgba(251, 146, 60, 0.16)";
        ctx.strokeStyle = "#fb923c";
        ctx.beginPath();
        ctx.roundRect(rightX, card2Y, rightW, cardH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fdba74";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText("🪐 DIŞ (GAZSAL) GEZEGENLER (5-8)", rightX + 10, card2Y + 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11.5px Inter, sans-serif";
        ctx.fillText("Jüpiter • Satürn • Uranüs • Neptün", rightX + 10, card2Y + 35);
      }
      // FİZİK KÜTLE & AĞIRLIK ANİMASYONU
      else if (sceneKind === "physics-gravity") {
        const colW = (W - 48) / 3;
        const m = mass;
        const g =
          planet === "earth"
            ? 9.8
            : planet === "moon"
            ? 1.6
            : planet === "mars"
            ? 3.7
            : 24.8;
        const G = (m * g).toFixed(1);

        const cols = [
          { title: "1. KÜTLE (m) — SABİT", val: `m = ${m} kg`, sub: "Eşit kollu terazi ile ölçülür", color: "#38bdf8" },
          { title: "2. ÇEKİM İVMESİ (g)", val: `g = ${g} m/s²`, sub: "Gezegene göre değişir", color: "#c084fc" },
          { title: "3. AĞIRLIK (G = m · g)", val: `G = ${G} N`, sub: "Dinamometre ile ölçülür", color: "#34d399" },
        ];

        cols.forEach((c, idx) => {
          const cx = 12 + idx * (colW + 12);
          ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(cx, 14, colW, H - 28, 12);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.fillStyle = c.color;
          ctx.font = "bold 12px Inter, sans-serif";
          ctx.fillText(c.title, cx + colW / 2, 42);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 18px Inter, sans-serif";
          ctx.fillText(c.val, cx + colW / 2, 82);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "11px Inter, sans-serif";
          ctx.fillText(c.sub, cx + colW / 2, H - 30);
        });
      }
      // GENEL AKIŞ ANİMASYONU
      else {
        const nodeCount = storySteps.length;
        const padX = 18;
        const gap = 14;
        const nodeW = (W - padX * 2 - gap * (nodeCount - 1)) / nodeCount;
        const nodeY = 24;
        const nodeH = H - 40;

        storySteps.forEach((step, idx) => {
          const nx = padX + idx * (nodeW + gap);
          const isCurrent = idx === storyStage;

          if (idx < nodeCount - 1) {
            const arrowStartX = nx + nodeW;
            const arrowEndX = nx + nodeW + gap;
            const arrowY = nodeY + nodeH * 0.45;
            ctx.strokeStyle = "#6366f1";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(arrowStartX, arrowY);
            ctx.lineTo(arrowEndX, arrowY);
            ctx.stroke();

            const pulseX = arrowStartX + ((t * 25) % gap);
            ctx.fillStyle = "#34d399";
            ctx.beginPath();
            ctx.arc(pulseX, arrowY, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = isCurrent
            ? "rgba(79, 70, 229, 0.24)"
            : "rgba(15, 23, 42, 0.88)";
          ctx.strokeStyle = isCurrent ? "#818cf8" : "#334155";
          ctx.lineWidth = isCurrent ? 2.2 : 1.2;
          ctx.beginPath();
          ctx.roundRect(nx, nodeY, nodeW, nodeH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = "left";
          ctx.fillStyle = isCurrent ? "#a5b4fc" : "#94a3b8";
          ctx.font = "bold 10.5px Inter, sans-serif";
          drawWrappedText(ctx, step.title, nx + 10, nodeY + 26, nodeW - 20, 14, 2);

          ctx.fillStyle = "#e2e8f0";
          ctx.font = "10px Inter, sans-serif";
          drawWrappedText(ctx, step.desc, nx + 10, nodeY + 60, nodeW - 20, 14, 5);
        });
      }

      ctx.restore();
      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animId);
  }, [visualTab, sceneKind, storyStage, storySteps, planet, mass]);

  const toggleEliminateOption = (letter: string) => {
    setEliminatedLetters((prev) =>
      prev.includes(letter)
        ? prev.filter((l) => l !== letter)
        : [...prev, letter]
    );
  };

  const toggleRevealSubAnswer = (index: number) => {
    setRevealedSubAnswers((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Seslendirilecek metinleri hazırla
  const proactiveSpeechText = useMemo(() => {
    return `Proaktif çözüm ipucu: ${analysis.proactiveStep1Hint}. Şimdi şu soruyu düşünelim: ${analysis.proactiveStep1Question}`;
  }, [analysis]);

  const reactiveSpeechText = useMemo(() => {
    return `Sorunun doğrudan gidiş yolu ve cevabı: ${
      analysis.reactiveCorrectTitle
    }. ${analysis.reactiveSteps.join(" ")} Pratik taktik: ${analysis.examTip}`;
  }, [analysis]);

  // Grafik verilerini sorunun konusuna göre dinamik oluştur
  const chartData = useMemo(() => {
    if (sceneKind === "biology-cell") {
      return {
        title: "Eşeysiz vs Eşeyli Üreme Stratejisi Karşılaştırma Grafiği (%)",
        bars: [
          { label: "Üreme Hızı (Birim Zaman)", valA: 95, valB: 35, nameA: "Eşeysiz (Optimum)", nameB: "Eşeyli (Stres)" },
          { label: "Enerji Tasarrufu", valA: 90, valB: 30, nameA: "Eşeysiz (Optimum)", nameB: "Eşeyli (Stres)" },
          { label: "Genetik Çeşitlilik & Stres Adaptasyonu", valA: 15, valB: 96, nameA: "Eşeysiz (Optimum)", nameB: "Eşeyli (Stres)" },
        ],
      };
    }
    if (sceneKind === "solar-system") {
      return {
        title: "Gezegenlerin Güneş'e Uzaklık ve Göreceli Büyüklük Karşılaştırması",
        bars: [
          { label: "Karasal (Merkür-Venüs-Dünya-Mars)", valA: 30, valB: 90, nameA: "Çap Büyüklüğü", nameB: "Kayaç Yoğunluğu" },
          { label: "Gazsal (Jüpiter-Satürn-Uranüs-Neptün)", valA: 95, valB: 25, nameA: "Çap Büyüklüğü", nameB: "Kayaç Yoğunluğu" },
        ],
      };
    }
    if (sceneKind === "physics-gravity") {
      return {
        title: "6 kg Kütleli Cismin Dünya ve Ay'daki Ölçüm Grafiği",
        bars: [
          { label: "Kütle (kg) — Değişmez", valA: 60, valB: 60, nameA: "Dünya (6 kg)", nameB: "Ay (6 kg)" },
          { label: "Ağırlık (Newton) — 1/6 Oranı", valA: 96, valB: 16, nameA: "Dünya (60 N)", nameB: "Ay (10 N)" },
        ],
      };
    }
    return {
      title: "Çözüm Basamakları & Kavramsal Ağırlık Analizi",
      bars: subQuestions.map((sq, idx) => ({
        label: sq.title,
        valA: 85 - idx * 10,
        valB: 95,
        nameA: "Kavramsal Önem",
        nameB: "Doğrulama Gücü",
      })),
    };
  }, [sceneKind, subQuestions]);

  return (
    <div
      ref={boardContainerRef}
      className="flex flex-col gap-3 h-full overflow-y-auto pr-1"
    >
      {/* ===================================================================
          1. ÜST BAR: İSTEĞE BAĞLI GÖRSEL & SESLİ ANLATIM SEÇİCİSİ
      =================================================================== */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 shadow-xl shrink-0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            {
              id: "solution" as VisualPresentationTab,
              label: "Çözüm & Gidiş Yolu",
              icon: Sparkles,
            },
            {
              id: "video" as VisualPresentationTab,
              label: "Video Animasyon",
              icon: Film,
            },
            {
              id: "avatar" as VisualPresentationTab,
              label: "Avatar & Gemini Sesi",
              icon: Bot,
            },
            {
              id: "diagram" as VisualPresentationTab,
              label: "Şekil & Şema",
              icon: GitBranch,
            },
            {
              id: "map" as VisualPresentationTab,
              label: "Harita & Mekân",
              icon: Compass,
            },
            {
              id: "chart" as VisualPresentationTab,
              label: "Grafik & Tablo",
              icon: BarChart3,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = visualTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setVisualTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                  active
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20"
                    : "bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hızlı Sesli Okuma Butonu (Her Sekmede Erişilebilir) */}
        <div className="flex items-center gap-1.5">
          {isSpeaking ? (
            <button
              type="button"
              onClick={stopSpeech}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-rose-300" />
              <span>Sesi Durdur</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                speakText(
                  lastReactiveSolution ? reactiveSpeechText : proactiveSpeechText
                )
              }
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5"
              title="Gemini Doğal Türkçe Sesiyle Dinle"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Sesli Dinle</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================
          2. SEÇİLEN GÖRSEL / SESLİ ANLATIM MODÜLÜ (VİDEO / AVATAR / ŞEMA / HARİTA / GRAFİK)
      =================================================================== */}
      {(visualTab === "video" || visualTab === "map") && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-bold text-white">
                {visualTab === "map"
                  ? "🗺️ Etkileşimli Mekânsal & Kavramsal Harita Görünümü"
                  : analysis.sceneTitle}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setStoryStage(
                    (prev) => (prev - 1 + storySteps.length) % storySteps.length
                  )
                }
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 flex items-center gap-1"
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
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoryStage(0);
                  setIsPlaying(true);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative h-56 sm:h-64 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {storySteps.map((st, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setStoryStage(idx);
                  setIsPlaying(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${
                  idx === storyStage
                    ? "bg-indigo-600/20 border-indigo-500 text-white"
                    : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="text-[11px] font-bold text-indigo-300 truncate">
                  {st.title}
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                  {st.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AVATAR & GEMİNİ SESLİ ANLATIM SEKMESİ */}
      {visualTab === "avatar" && (
        <div className="bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-5 shadow-xl shrink-0 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-5">
            {/* Canlı Konuşan AI Öğretmen Avatarı */}
            <div className="relative w-36 h-36 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 border-2 border-indigo-500/50 flex flex-col items-center justify-center shadow-2xl shrink-0 overflow-hidden">
              {/* Ses Dalgaları Halesi */}
              {isSpeaking && (
                <>
                  <span className="absolute inset-2 rounded-2xl border-2 border-emerald-400/40 animate-ping" />
                  <span className="absolute inset-4 rounded-xl border border-indigo-400/50 animate-pulse" />
                </>
              )}

              {/* Avatar Yüz Tasarımı (SVG) */}
              <svg viewBox="0 0 120 120" className="w-28 h-28 relative z-10">
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="#1e1b4b"
                  stroke="#818cf8"
                  strokeWidth="3"
                />
                {/* Gözler */}
                <circle cx="44" cy="50" r="5" fill="#38bdf8" />
                <circle cx="76" cy="50" r="5" fill="#38bdf8" />
                <circle cx="45.5" cy="48.5" r="2" fill="#ffffff" />
                <circle cx="77.5" cy="48.5" r="2" fill="#ffffff" />
                {/* Kaşlar */}
                <path
                  d="M 36 40 Q 44 36 52 40"
                  stroke="#a5b4fc"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 68 40 Q 76 36 84 40"
                  stroke="#a5b4fc"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Konuşan Ağız */}
                {isSpeaking ? (
                  <ellipse
                    cx="60"
                    cy="76"
                    rx="12"
                    ry="7"
                    fill="#34d399"
                    className="animate-pulse"
                  />
                ) : (
                  <path
                    d="M 46 74 Q 60 84 74 74"
                    stroke="#34d399"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 relative z-10">
                {isSpeaking ? "🔊 Konuşuyor..." : "🧑‍🏫 Gemini AI Öğretmen"}
              </span>
            </div>

            {/* Sesli Anlatım Kontrolleri ve Altyazı */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>🧑‍🏫 AI Avatar & Gemini Sesli Anlatım Stüdyosu</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sorunun proaktif ipuçlarını veya adım adım tam gidiş yolunu sesli dinleyin
                  </p>
                </div>

                {/* Konuşma Hızı Seçici */}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
                  {[0.9, 1.0, 1.2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setSpeechRate(rate)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                        speechRate === rate
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Seslendirme Butonları */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => speakText(proactiveSpeechText)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>🧠 Proaktif İpucunu Seslendir</span>
                </button>

                <button
                  type="button"
                  onClick={() => speakText(reactiveSpeechText)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>⚡ Tam Gidiş Yolunu ve Cevabı Seslendir</span>
                </button>

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeech}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <VolumeX className="w-4 h-4" />
                    <span>Durdur</span>
                  </button>
                )}
              </div>

              {/* Canlı Altyazı Kutusu */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  💬 Avatar Konuşma Metni / Altyazı:
                </span>
                {spokenSubtitle ||
                  stripMarkdownForSpeech(
                    lastReactiveSolution
                      ? reactiveSpeechText
                      : proactiveSpeechText
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ŞEKİL & ŞEMA SEKMESİ */}
      {visualTab === "diagram" && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <span>📐 Görsel Kavram Şeması & Çözüm Akış Diyagramı</span>
            </h3>
          </div>

          {/* Anahtar Kavram Düğümleri */}
          <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl p-3">
            {detectedKeywords.map((kw, idx) => (
              <React.Fragment key={idx}>
                <div className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold">
                  {kw}
                </div>
                {idx < detectedKeywords.length - 1 && (
                  <span className="text-indigo-400 font-bold">➜</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* 4 Aşamalı Şematik Akış Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {storySteps.map((st, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 relative flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1.5">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {st.badge}
                  </span>
                  <h4 className="text-xs font-bold text-white">{st.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-indigo-400 pt-1 border-t border-slate-900">
                  Adım {idx + 1} / {storySteps.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRAFİK & TABLO SEKMESİ */}
      {visualTab === "chart" && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl shrink-0 space-y-4">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>📊 {chartData.title}</span>
          </h3>

          <div className="space-y-3 bg-slate-950/90 border border-slate-800 rounded-xl p-4">
            {chartData.bars.map((b, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>{b.label}</span>
                  <span className="text-[11px] text-slate-400">
                    {b.nameA}: %{b.valA} • {b.nameB}: %{b.valB}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 rounded-lg h-6 overflow-hidden border border-slate-800 relative flex items-center">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg transition-all duration-500"
                      style={{ width: `${b.valA}%` }}
                    />
                    <span className="absolute left-2 text-[10px] font-bold text-white drop-shadow">
                      {b.nameA} (%{b.valA})
                    </span>
                  </div>
                  <div className="bg-slate-900 rounded-lg h-6 overflow-hidden border border-slate-800 relative flex items-center">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg transition-all duration-500"
                      style={{ width: `${b.valB}%` }}
                    />
                    <span className="absolute left-2 text-[10px] font-bold text-white drop-shadow">
                      {b.nameB} (%{b.valB})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================
          3. ANA ÇÖZÜM TAHTASI: DOĞRUDAN GİDİŞ YOLU (HIZLI ÇÖZ) VEYA PROAKTİF YARDIM
      =================================================================== */}
      {lastReactiveSolution ? (
        <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 fill-slate-950" />
                HIZLI ÇÖZÜM & DOĞRUDAN GİDİŞ YOLU
              </span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{lastReactiveSolution.correctAnswer}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => speakText(reactiveSpeechText)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Çözümü Sesli Dinle</span>
            </button>
          </div>

          {/* Adım Adım Gidiş Yolu */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              👣 Adım Adım Gidiş Yolu ve Açıklama:
            </h4>
            <div className="space-y-2.5">
              {lastReactiveSolution.stepByStep.map((step, idx) => {
                const isVisible = idx < animStepIndex;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all duration-500 ${
                      isVisible
                        ? "bg-slate-950/90 border-indigo-500/40 text-slate-100 opacity-100"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 opacity-60"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Çeldirici Analizi ve Pratik Taktik */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-1">
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Dikkat Edilecek Nokta / Neden Diğerleri Değil?</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {lastReactiveSolution.distractorAnalysis}
              </p>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-emerald-400" />
                <span>Pratik Çözüm Taktiği</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {lastReactiveSolution.examTip}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Proaktif Çözüm Yardımı & Adım Adım İpuçları
                </h3>
                <p className="text-[11px] text-slate-400">
                  Soruyu kendi başına çözebilmen için adım adım ipuçları ve yönlendirici sorular
                </p>
              </div>
            </div>

            {/* Yüklenen Soru Görseli Varsa Büyütme Butonu */}
            {currentQuestionImage && (
              <button
                type="button"
                onClick={() => setZoomImage(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Yüklenen Görseli Büyüt</span>
              </button>
            )}
          </div>

          {/* Çoktan Seçmeli Şıklar Varsa Şık Eleme Kartları */}
          {options.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">
                Şıklara tıklayarak yanlış düşündüğün seçenekleri eleyebilirsin:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {options.map((opt) => {
                  const isEliminated = eliminatedLetters.includes(opt.letter);
                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      onClick={() => toggleEliminateOption(opt.letter)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex items-start justify-between gap-2 ${
                        isEliminated
                          ? "bg-rose-950/25 border-rose-500/30 text-slate-500 line-through opacity-75"
                          : "bg-slate-950/80 border-slate-800 text-slate-200 hover:border-indigo-500/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 text-xs ${
                            isEliminated
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-indigo-600/25 text-indigo-300"
                          }`}
                        >
                          {opt.letter}
                        </span>
                        <span className="leading-snug mt-0.5">{opt.text}</span>
                      </div>
                      {isEliminated && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sorunun Proaktif Alt Adım Kartları */}
          <div className="space-y-2.5">
            {subQuestions.map((sq) => {
              const isRevealed = revealedSubAnswers.includes(sq.index);
              return (
                <div
                  key={sq.index}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 font-bold text-xs">
                        Adım {sq.index}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {sq.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRevealSubAnswer(sq.index)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition flex items-center gap-1 ${
                        isRevealed
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {isRevealed
                          ? "Gidiş Yolunu Gizle"
                          : "Bu Adımın Gidiş Yolunu Göster"}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-2.5">
                      <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Proaktif İpucu</span>
                      </div>
                      <div
                        className="text-xs text-slate-200 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: formatHtml(sq.proactiveHint),
                        }}
                      />
                    </div>

                    <div className="bg-violet-950/30 border border-violet-500/30 rounded-lg p-2.5">
                      <div className="text-[11px] font-bold text-violet-300 flex items-center gap-1 mb-1">
                        <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                        <span>Kendin Bulman İçin Yönlendirme Sorusu</span>
                      </div>
                      <div
                        className="text-xs text-slate-200 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: formatHtml(sq.socraticQuestion),
                        }}
                      />
                    </div>
                  </div>

                  {isRevealed && (
                    <div className="bg-emerald-950/25 border border-emerald-500/40 rounded-lg p-3">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Bu Adımın Gidiş Yolu ve Cevabı:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                        {sq.reactiveAnswer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {latestTutorMsg && (
            <div
              className="bg-slate-950/85 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: formatHtml(latestTutorMsg.content),
              }}
            />
          )}
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
