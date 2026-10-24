"use client";

import React, { useEffect, useRef, useState } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import { MisconceptionAlert } from "./MisconceptionAlert";
import { PLANETS } from "@/lib/curriculum-graph";
import { SolutionMode, TutorAPIResponse } from "@/types/its";
import {
  AlertCircle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  Send,
  Sparkles,
  User,
  Wand2,
  Zap,
} from "lucide-react";

/**
 * Mesaj metnindeki $$...$$, $...$ LaTeX formüllerini ve **kalın** ifadeleri HTML'e dönüştürür.
 */
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

export const ChatStream: React.FC = () => {
  const {
    messages,
    quickReplies,
    isTyping,
    planet,
    gravity,
    mass,
    skills,
    activeUnit,
    selectedOutcomeCode,
    currentQuestionText,
    currentQuestionImage,
    pendingAction,
    triggerTutorAction,
    setLastReactiveSolution,
    addMessage,
    setQuickReplies,
    setIsTyping,
    applySimulationUpdate,
    applyBKTUpdate,
    setActiveMisconception,
    setBktModalOpen,
    setTymmModalOpen,
  } = useITSStore();

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (pendingAction && !isTyping) {
      const actionToRun = pendingAction;
      triggerTutorAction(null);
      sendStudentMessage(
        actionToRun.message,
        actionToRun.mode,
        actionToRun.imageDataUrl
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction, isTyping]);

  const sendStudentMessage = async (
    textToSend: string,
    explicitMode?: SolutionMode,
    attachedImage?: string | null
  ) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

    // Eğer kullanıcı "Hızlı Çöz" veya "Reaktif" çipine tıkladıysa modu otomatik "reactive" yap
    const isReactiveTrigger =
      explicitMode === "reactive" ||
      trimmed.toLowerCase().includes("hızlı çöz") ||
      trimmed.toLowerCase().includes("reaktif");

    const mode: SolutionMode = isReactiveTrigger ? "reactive" : "proactive";

    const nowTime = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const studentMsgId = `stu-${Date.now()}`;
    addMessage({
      id: studentMsgId,
      role: "student",
      content: trimmed,
      timestamp: nowTime,
      mode,
      imageDataUrl: attachedImage || null,
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
            text: currentQuestionText,
            imageDataUrl: attachedImage || currentQuestionImage,
            outcomeCode: selectedOutcomeCode,
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
          selectedOutcomeCode,
        }),
      });

      const data: TutorAPIResponse = await res.json();

      // 1. Simülasyon güncellemesi varsa uygula
      if (data.updateSimulation) {
        applySimulationUpdate(data.updateSimulation);
      }

      // 2. Kavram yanılgısı tespit edildiyse aktif et
      if (data.detectedMisconception) {
        setActiveMisconception(data.detectedMisconception);
      }

      // 3. Reaktif Çözüm geldiyse store'a kaydet
      if (data.reactiveSolution) {
        setLastReactiveSolution(data.reactiveSolution);
      }

      // 4. BKT güncellemesi varsa uygula
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

      // 5. Hızlı yanıt çiplerini güncelle
      if (data.quickReplies && data.quickReplies.length > 0) {
        setQuickReplies(data.quickReplies);
      }

      // 6. Öğretmen yanıtını sohbet akışına ekle
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
      console.error("Sohbet gönderim hatası:", error);
      addMessage({
        id: `err-${Date.now()}`,
        role: "tutor",
        content:
          "Bağlantıda kısa bir gecikme oldu. Soruyu veya düşünceni tekrar gönderebilir ya da **⚡ Hızlı Çöz** butonuna basabilirsin.",
        timestamp: nowTime,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendStudentMessage(inputText, "proactive");
  };

  const handleQuickReactiveSolve = () => {
    const qText = currentQuestionText.trim();
    sendStudentMessage(
      qText
        ? `⚡ Hızlı Çöz (Reaktif Çözüm): Lütfen "${qText.slice(
            0,
            120
          )}..." sorusunun doğru cevabını, adım adım tam çözümünü ve şık analizini doğrudan göster!`
        : `⚡ Hızlı Çöz (Reaktif Çözüm): Son konuştuğumuz sorunun doğru cevabını ve adım adım tam çözümünü doğrudan açıkla!`,
      "reactive",
      currentQuestionImage
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Üst Başlık: Proaktif & Reaktif Çözüm Başlığı */}
      <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-semibold text-white truncate">
                Proaktif & Reaktif Soru Çözüm Asistanı
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                {selectedOutcomeCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {activeUnit.gradeName} • {activeUnit.subject}
            </p>
          </div>
        </div>

        {/* Sağ Üst: Her An Erişilebilir ⚡ HIZLI ÇÖZ Butonu + BKT */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isTyping}
            onClick={handleQuickReactiveSolve}
            className="px-2.5 py-1.5 rounded-lg text-xs font-extrabold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition flex items-center gap-1 shadow-md shadow-amber-500/20"
            title="Sokratik adımları atla ve doğrudan Reaktif Tam Çözümü göster"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Hızlı Çöz</span>
          </button>

          <button
            type="button"
            onClick={() => setTymmModalOpen(true)}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition hidden sm:inline-block"
            title="Sınıf, Ders ve Kazanım Seçiciyi Aç"
          >
            TYMM
          </button>

          <button
            type="button"
            onClick={() => setBktModalOpen(true)}
            className="px-2 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1"
            title="BKT Öğrenci Bilişsel Ustalık Modelini Aç"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mesaj Akışı Alanı */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        <MisconceptionAlert />

        {messages.map((msg) => {
          const isTutor = msg.role === "tutor";
          const isReactive = msg.mode === "reactive" || Boolean(msg.reactiveSolution);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                isTutor ? "justify-start" : "justify-end"
              }`}
            >
              {isTutor && (
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    isReactive
                      ? "bg-amber-500/25 border-amber-500/50 text-amber-300"
                      : "bg-indigo-600/25 border-indigo-500/40 text-indigo-300"
                  }`}
                >
                  {isReactive ? (
                    <Zap className="w-3.5 h-3.5 fill-amber-300" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                  isTutor
                    ? isReactive
                      ? "bg-slate-800/95 text-slate-100 border-2 border-amber-500/50 rounded-tl-sm"
                      : "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-sm"
                    : "bg-indigo-600 text-white border border-indigo-500 rounded-tr-sm"
                }`}
              >
                {/* Mod Etiketi */}
                {isTutor && msg.id !== "welcome-1" && (
                  <div className="mb-1.5 flex items-center gap-1.5">
                    {isReactive ? (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-slate-950" />
                        Reaktif Çözüm (Doğrudan Tam Çözüm)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
                        🧠 Proaktif Çözüm Rehberi (Sokratik Adım)
                      </span>
                    )}
                  </div>
                )}

                {/* Öğrencinin yüklediği soru görseli varsa göster */}
                {msg.imageDataUrl && (
                  <div className="mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.imageDataUrl}
                      alt="Öğrenci sorusu"
                      className="max-h-40 rounded-lg border border-indigo-400/40 object-contain bg-slate-950"
                    />
                  </div>
                )}

                <div
                  className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatMessageContent(msg.content),
                  }}
                />

                {/* Eğer Reaktif Çözüm Kartı varsa mesaj içinde de yapılandırılmış göster */}
                {msg.reactiveSolution && (
                  <div className="mt-3 pt-2.5 border-t border-amber-500/30 space-y-2">
                    <div className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{msg.reactiveSolution.correctAnswer}</span>
                    </div>

                    <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 space-y-1">
                      <div className="text-[11px] font-bold text-amber-300">
                        Adım Adım İşlem & Açıklama:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-xs text-slate-200">
                        {msg.reactiveSolution.stepByStep.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 text-xs space-y-1">
                      <div className="font-bold text-rose-400">
                        🔍 Çeldirici / Şık Analizi:
                      </div>
                      <p className="text-slate-300">
                        {msg.reactiveSolution.distractorAnalysis}
                      </p>
                    </div>

                    <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 text-xs space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Pratik Sınav Taktiği:</span>
                      </div>
                      <p className="text-slate-300">
                        {msg.reactiveSolution.examTip}
                      </p>
                    </div>
                  </div>
                )}

                {/* Aksiyon Rozetleri */}
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

                <div
                  className={`text-[10px] mt-1.5 ${
                    isTutor ? "text-slate-400" : "text-indigo-200 text-right"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {!isTutor && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl rounded-tl-sm px-3.5 py-2 text-xs text-slate-300 flex items-center gap-2">
              <span>Yapay zeka soruyu analiz ediyor</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Hızlı Yanıt Çipleri + Hızlı Çöz Çipi */}
      <div className="px-3.5 py-2 bg-slate-950/50 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Proaktif İpuçları & Hızlı Aksiyonlar:
          </span>
          <button
            type="button"
            disabled={isTyping}
            onClick={handleQuickReactiveSolve}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Zap className="w-3 h-3 fill-amber-400" />
            <span>Doğrudan Cevabı Göster (Reaktif Çöz)</span>
          </button>
        </div>

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
                  sendStudentMessage(
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

      {/* Mesaj Giriş Formu */}
      <form
        onSubmit={handleFormSubmit}
        className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isTyping}
          placeholder="Soruyla ilgili fikrini, elediğin şıkkı veya takıldığın yeri yaz..."
          className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs sm:text-sm transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/20"
        >
          <span>Gönder</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
