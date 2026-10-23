"use client";

import React, { useEffect, useRef, useState } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import { MisconceptionAlert } from "./MisconceptionAlert";
import { PLANETS } from "@/lib/curriculum-graph";
import { TutorAPIResponse } from "@/types/its";
import {
  Bot,
  BrainCircuit,
  Send,
  Sparkles,
  User,
  Wand2,
  AlertCircle,
} from "lucide-react";

/**
 * Mesaj metnindeki $$...$$, $...$ LaTeX formüllerini ve **kalın** ifadeleri HTML'e dönüştürür.
 */
function formatMessageContent(raw: string): string {
  // 1. HTML escape
  let safe = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Blok LaTeX $$...$$
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

  // 3. Satır içi LaTeX $...$
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

  // 4. Kalın **...** ve İtalik *...*
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>");
  safe = safe.replace(/\*([^*]+)\*/g, "<em class='text-indigo-200'>$1</em>");

  // 5. Satır sonları
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
    addMessage,
    setQuickReplies,
    setIsTyping,
    applySimulationUpdate,
    applyBKTUpdate,
    setActiveMisconception,
    setBktModalOpen,
  } = useITSStore();

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendStudentMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isTyping) return;

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
          history: historyPayload,
          simulationState: {
            planet,
            gravity,
            mass,
            weight: mass * gravity,
          },
          skills,
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

      // 3. BKT güncellemesi varsa uygula
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

      // 4. Hızlı yanıt çiplerini güncelle
      if (data.quickReplies && data.quickReplies.length > 0) {
        setQuickReplies(data.quickReplies);
      }

      // 5. Öğretmen yanıtını sohbet akışına ekle
      addMessage({
        id: `tut-${Date.now()}`,
        role: "tutor",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
          "Bağlantıda kısa bir gecikme oldu. Tahtadaki **Eşit Kollu Terazi** ve **Dinamometre** değerlerine bakarak düşünceni tekrar paylaşır mısın?",
        timestamp: nowTime,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendStudentMessage(inputText);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Üst Başlık: Sokratik Öğretmen Bilgisi */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Proaktif Sokratik Öğretmen
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Canlı Rehber
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Doğrudan cevap vermez; simülasyonla keşfettirir
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setBktModalOpen(true)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1.5"
          title="BKT Öğrenci Bilişsel Ustalık Modelini Aç"
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">BKT Modeli</span>
        </button>
      </div>

      {/* Mesaj Akışı Alanı */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        <MisconceptionAlert />

        {messages.map((msg) => {
          const isTutor = msg.role === "tutor";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                isTutor ? "justify-start" : "justify-end"
              }`}
            >
              {isTutor && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                  isTutor
                    ? "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-sm"
                    : "bg-indigo-600 text-white border border-indigo-500 rounded-tr-sm"
                }`}
              >
                <div
                  className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatMessageContent(msg.content),
                  }}
                />

                {/* Aksiyon Rozetleri: Simülasyon, BKT veya Kavram Yanılgısı */}
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
              <span>Sokratik öğretmen hipotezini analiz ediyor</span>
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

      {/* Hızlı Yanıt Çipleri (Quick Reply Chips) */}
      <div className="px-3.5 py-2 bg-slate-950/50 border-t border-slate-800/80">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Hızlı Hipotez & Yanıt Çipleri:
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickReplies.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isTyping}
              onClick={() => sendStudentMessage(chip)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/50 transition disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
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
          placeholder="Gözlemini veya hipotezini yaz (Örn: Ay'da kütle değişmez ama ağırlık azalır)..."
          className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs sm:text-sm transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/20"
        >
          <span>Gönder</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
