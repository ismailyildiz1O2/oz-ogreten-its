"use client";

import React from "react";
import { useITSStore } from "@/store/useITSStore";
import { PhysicsCanvas } from "@/components/Whiteboard/PhysicsCanvas";
import { FormulaBoard } from "@/components/Whiteboard/FormulaBoard";
import { TymmUnitBoard } from "@/components/Whiteboard/TymmUnitBoard";
import { ChatStream } from "@/components/TutorChat/ChatStream";
import { BktModal } from "@/components/StudentModel/BktModal";
import { TymmSelectorModal } from "@/components/Curriculum/TymmSelectorModal";
import { getMasteryStatus } from "@/lib/bkt-engine";
import {
  Atom,
  BookOpen,
  BrainCircuit,
  FlaskConical,
  LayoutDashboard,
  MessageSquareText,
  AlertTriangle,
} from "lucide-react";

export default function ITSHomePage() {
  const {
    skills,
    activeUnit,
    whiteboardMode,
    setWhiteboardMode,
    setPendingPrompt,
    mobileTab,
    setMobileTab,
    setBktModalOpen,
    setTymmModalOpen,
    activeMisconception,
    messages,
  } = useITSStore();

  const skillList = Object.values(skills);
  const avgMastery =
    skillList.length > 0
      ? skillList.reduce((acc, s) => acc + s.params.pL, 0) / skillList.length
      : 0.35;
  const masteryPct = Math.round(avgMastery * 100);
  const masteryStatus = getMasteryStatus(avgMastery);

  return (
    <div className="h-dvh w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Üst Başlık Çubuğu (Safe-Area Uyumlu) */}
      <header className="safe-top px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/40 shrink-0">
            <Atom className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white shrink-0">
                Proaktif Sınav
              </h1>
              <button
                type="button"
                onClick={() => setTymmModalOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition truncate max-w-[420px]"
                title="Türkiye Yüzyılı Maarif Modeli (TYMM) Müfredat ve Ünite Seçiciyi Aç"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {activeUnit.gradeName} • {activeUnit.subject} —{" "}
                  {activeUnit.title}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              Türkiye Yüzyılı Maarif Modeli (TYMM) • Sokratik Öğretmen &
              Etkileşimli Değerlendirme Sistemi
            </p>
          </div>
        </div>

        {/* Sağ Üst: TYMM Butonu, Kavram Yanılgısı Rozeti ve BKT Ustalık Göstergesi */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTymmModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
            title="1-12. Sınıf Tüm Dersler ve 2.321 TYMM Ünitesi Arasından Seçim Yap"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Sınıf & Ders Seç (TYMM)</span>
          </button>

          {activeMisconception && (
            <button
              type="button"
              onClick={() => setMobileTab("chat")}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Yanılgı: {activeMisconception.code}</span>
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
              <div className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
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
        {/* SOL PANEL: Akıllı Ünite Tahtası VEYA Etkileşimli Fizik Laboratuvarı */}
        <section
          aria-label="Etkileşimli Çalışma Tahtası"
          className={`lg:col-span-7 flex flex-col gap-2.5 min-h-0 h-full overflow-y-auto lg:overflow-hidden pr-0.5 ${
            mobileTab === "whiteboard" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Tahta Görünüm Modu Seçici */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWhiteboardMode("unit-board")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  whiteboardMode === "unit-board"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>
                  TYMM Ünite & Sınav Tahtası ({activeUnit.gradeName})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWhiteboardMode("physics-sim")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  whiteboardMode === "physics-sim"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Fizik Laboratuvarı (Terazi & Dinamometre)</span>
              </button>
            </div>

            <span className="hidden xl:inline text-[11px] text-slate-400 truncate max-w-[220px]">
              {activeUnit.subject}
            </span>
          </div>

          {whiteboardMode === "physics-sim" ? (
            <>
              <div className="flex-1 min-h-[340px] flex flex-col">
                <PhysicsCanvas />
              </div>
              <FormulaBoard />
            </>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden">
              <TymmUnitBoard
                onAskTutor={(promptText) => setPendingPrompt(promptText)}
              />
            </div>
          )}
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

      {/* Modallar: BKT Bilişsel Ustalık & TYMM Müfredat Seçici */}
      <BktModal />
      <TymmSelectorModal />
    </div>
  );
}
