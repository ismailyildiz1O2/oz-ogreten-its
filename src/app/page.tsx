"use client";

import React from "react";
import { useITSStore } from "@/store/useITSStore";
import { PhysicsCanvas } from "@/components/Whiteboard/PhysicsCanvas";
import { FormulaBoard } from "@/components/Whiteboard/FormulaBoard";
import { ChatStream } from "@/components/TutorChat/ChatStream";
import { BktModal } from "@/components/StudentModel/BktModal";
import { getMasteryStatus } from "@/lib/bkt-engine";
import {
  Atom,
  BrainCircuit,
  FlaskConical,
  MessageSquareText,
  AlertTriangle,
} from "lucide-react";

export default function ITSHomePage() {
  const {
    skills,
    mobileTab,
    setMobileTab,
    setBktModalOpen,
    activeMisconception,
    messages,
  } = useITSStore();

  const skillList = Object.values(skills);
  const avgMastery =
    skillList.reduce((acc, s) => acc + s.params.pL, 0) / skillList.length;
  const masteryPct = Math.round(avgMastery * 100);
  const masteryStatus = getMasteryStatus(avgMastery);

  return (
    <div className="h-dvh w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Üst Başlık Çubuğu (Safe-Area Uyumlu) */}
      <header className="safe-top px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/40">
            <Atom className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Öz-Öğreten AI
              </h1>
              <span className="hidden md:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                MEB F.7.3.1 • Kütle & Ağırlık ITS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Proaktif Sokratik Öğretmen & Etkileşimli Laboratuvar
            </p>
          </div>
        </div>

        {/* Sağ Üst: BKT Ustalık Göstergesi ve Kavram Yanılgısı Rozeti */}
        <div className="flex items-center gap-2.5">
          {activeMisconception && (
            <button
              type="button"
              onClick={() => setMobileTab("chat")}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Yanılgı Tespit Edildi: {activeMisconception.code}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setBktModalOpen(true)}
            className="group flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 transition"
          >
            <BrainCircuit className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  BKT Ustalık
                </span>
                <span
                  className={`text-xs font-bold ${masteryStatus.textClass}`}
                >
                  %{masteryPct}
                </span>
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${masteryPct}%`,
                    backgroundColor: masteryStatus.color,
                  }}
                />
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* Ana Split-Pane Çalışma Alanı (Masaüstünde Yan Yana, Mobilde Sekmeli) */}
      <main className="flex-1 min-h-0 p-2.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-hidden">
        {/* SOL PANEL: Etkileşimli Fizik Tahtası + KaTeX Formül Panosu */}
        <section
          aria-label="Etkileşimli Fizik Tahtası"
          className={`lg:col-span-7 flex flex-col gap-3 min-h-0 h-full overflow-y-auto lg:overflow-visible pr-0.5 ${
            mobileTab === "whiteboard" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex-1 min-h-[380px] flex flex-col">
            <PhysicsCanvas />
          </div>
          <FormulaBoard />
        </section>

        {/* SAĞ PANEL: Sokratik Öğretmen Sohbet Akışı */}
        <section
          aria-label="Sokratik Öğretmen Sohbeti"
          className={`lg:col-span-5 flex flex-col min-h-0 h-full ${
            mobileTab === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          <ChatStream />
        </section>
      </main>

      {/* Mobil Görünüm Geçiş Çubuğu (iOS / Android Safe-Area Bottom Bar) */}
      <nav
        aria-label="Mobil Görünüm Seçici"
        className="lg:hidden safe-bottom px-3 pt-2 pb-2 bg-slate-900/95 border-t border-slate-800 grid grid-cols-2 gap-2 shrink-0 z-20"
      >
        <button
          type="button"
          onClick={() => setMobileTab("whiteboard")}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition border ${
            mobileTab === "whiteboard"
              ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/25"
              : "bg-slate-800/80 text-slate-300 border-slate-700/70"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Tahta & Simülasyon</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition border relative ${
            mobileTab === "chat"
              ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/25"
              : "bg-slate-800/80 text-slate-300 border-slate-700/70"
          }`}
        >
          <MessageSquareText className="w-4 h-4" />
          <span>Sokratik Sohbet ({messages.length})</span>
          {activeMisconception && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute top-2 right-3" />
          )}
        </button>
      </nav>

      {/* BKT Bilişsel Ustalık Modalı */}
      <BktModal />
    </div>
  );
}
