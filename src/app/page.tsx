"use client";

import React from "react";
import { useITSStore } from "@/store/useITSStore";
import { PhysicsCanvas } from "@/components/Whiteboard/PhysicsCanvas";
import { FormulaBoard } from "@/components/Whiteboard/FormulaBoard";
import { MainSolverWorkspace } from "@/components/Whiteboard/MainSolverWorkspace";
import { RightCurriculumSidebar } from "@/components/Curriculum/RightCurriculumSidebar";
import { BktModal } from "@/components/StudentModel/BktModal";
import { TymmSelectorModal } from "@/components/Curriculum/TymmSelectorModal";
import { getMasteryStatus } from "@/lib/bkt-engine";
import {
  Atom,
  BookOpen,
  BrainCircuit,
  FileQuestion,
  FlaskConical,
  AlertTriangle,
} from "lucide-react";

export default function ITSHomePage() {
  const {
    skills,
    activeUnit,
    selectedOutcomeCode,
    whiteboardMode,
    setWhiteboardMode,
    mobileTab,
    setMobileTab,
    setBktModalOpen,
    setTymmModalOpen,
    activeMisconception,
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
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 truncate max-w-[440px]">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {activeUnit.gradeName} • {activeUnit.subject} •{" "}
                  <strong>{selectedOutcomeCode}</strong>
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              Çözemediğin Sınav Sorularını Proaktif (Sokratik) veya ⚡ Hızlı Çöz
              (Reaktif) Moduyla Çöz
            </p>
          </div>
        </div>

        {/* Sağ Üst: Tam Ekran Katalog ve BKT Ustalık Göstergesi */}
        <div className="flex items-center gap-2 shrink-0">
          {activeMisconception && (
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Yanılgı: {activeMisconception.code}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setTymmModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
            title="Tam Ekran TYMM Müfredat Katalogunu Aç"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Tüm Müfredat Katalogu</span>
          </button>

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

      {/* Ana Split-Pane Çalışma Alanı: SOL BÜYÜK EKRAN (Soru Sor & Çöz) + SAĞ PANEL (Sınıf, Ders, Kazanım Seçici) */}
      <main className="flex-1 min-h-0 p-2.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-hidden">
        {/* SOL BÜYÜK EKRAN (8 Sütun): SORU SORMA VE PROAKTİF / REAKTİF ÇÖZÜM ALANI */}
        <section
          aria-label="Ana Soru Sorma ve Çözüm Ekranı"
          className={`lg:col-span-8 flex flex-col gap-2.5 min-h-0 h-full overflow-hidden ${
            mobileTab === "whiteboard" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Sol Üst Görünüm Seçici */}
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
                <FileQuestion className="w-3.5 h-3.5" />
                <span>
                  Soru Sor & Çözüm Ekranı (Proaktif & ⚡ Hızlı Çöz)
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

            <span className="hidden xl:inline text-[11px] font-medium text-emerald-400 truncate max-w-[260px]">
              {activeUnit.gradeName} • {selectedOutcomeCode}
            </span>
          </div>

          {whiteboardMode === "physics-sim" ? (
            <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto">
              <div className="flex-1 min-h-[340px] flex flex-col">
                <PhysicsCanvas />
              </div>
              <FormulaBoard />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden">
              <MainSolverWorkspace />
            </div>
          )}
        </section>

        {/* SAĞ PANEL (4 Sütun): SINIF, DERS, ÜNİTE VE KAZANIM SEÇİCİ */}
        <section
          aria-label="Sınıf, Ders ve Kazanım Seçici Panel"
          className={`lg:col-span-4 flex flex-col min-h-0 h-full overflow-hidden ${
            mobileTab === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          <RightCurriculumSidebar />
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
          <FileQuestion className="w-4 h-4" />
          <span>Soru Sor & Çözüm Ekranı</span>
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
          <BookOpen className="w-4 h-4" />
          <span>Ders & Kazanım Seç ({selectedOutcomeCode})</span>
        </button>
      </nav>

      {/* Modallar: BKT Bilişsel Ustalık & Tam Ekran TYMM Müfredat Seçici */}
      <BktModal />
      <TymmSelectorModal />
    </div>
  );
}
