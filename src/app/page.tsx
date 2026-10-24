"use client";

import React from "react";
import { useITSStore } from "@/store/useITSStore";
import { VisualSolutionBoard } from "@/components/Whiteboard/VisualSolutionBoard";
import { LeftQuestionAndChatPanel } from "@/components/TutorChat/LeftQuestionAndChatPanel";
import {
  Atom,
  ArrowLeftRight,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function ITSHomePage() {
  const {
    mobileTab,
    setMobileTab,
    isLayoutReversed,
    toggleLayoutReversed,
  } = useITSStore();

  return (
    <div className="h-dvh w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sade Üst Başlık Çubuğu */}
      <header className="safe-top px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/40 shrink-0">
            <Atom className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
              Proaktif Öğrenme & Akıllı Soru Çözüm Asistanı
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              Sorunu yaz, fotoğraf / ekran görüntüsü (Ctrl+V) / PDF / Word yükle •{" "}
              <strong>Proaktif Çöz</strong> ile beraber çöz veya{" "}
              <strong>Hızlı Çöz</strong> ile doğrudan gidiş yolunu gör
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleLayoutReversed}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium transition"
            title="Sol ve Sağ Panellerin Yerini Değiştir"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sol ⇄ Sağ Yer Değiştir</span>
          </button>
        </div>
      </header>

      {/* Ana İki Sütunlu Çalışma Alanı */}
      <main className="flex-1 min-h-0 p-2.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-hidden">
        {/* SOL PANEL (4 Sütun): Soru Ekleme + Proaktif Çöz / Hızlı Çöz + Çözüm Asistanı */}
        <section
          aria-label="Soru Ekleme ve Çözüm Asistanı"
          className={`lg:col-span-4 flex flex-col min-h-0 h-full overflow-hidden ${
            isLayoutReversed ? "lg:order-2" : "lg:order-1"
          } ${mobileTab === "chat" ? "flex" : "hidden lg:flex"}`}
        >
          <LeftQuestionAndChatPanel />
        </section>

        {/* SAĞ PANEL (8 Sütun): Çözüm & Gidiş Yolu + İsteğe Bağlı Görsel/Sesli Anlatım (Video, Avatar, Şema, Harita, Grafik) */}
        <section
          aria-label="Çözüm ve Görsel Anlatım Alanı"
          className={`lg:col-span-8 flex flex-col min-h-0 h-full overflow-hidden ${
            isLayoutReversed ? "lg:order-1" : "lg:order-2"
          } ${mobileTab === "whiteboard" ? "flex" : "hidden lg:flex"}`}
        >
          <VisualSolutionBoard />
        </section>
      </main>

      {/* Mobil Görünüm Geçiş Çubuğu */}
      <nav
        aria-label="Mobil Görünüm Seçici"
        className="lg:hidden safe-bottom px-3 pt-2 pb-2 bg-slate-900/95 border-t border-slate-800 grid grid-cols-2 gap-2 shrink-0 z-20"
      >
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition border ${
            mobileTab === "chat"
              ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/25"
              : "bg-slate-800/80 text-slate-300 border-slate-700/70"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Soru Ekle & Asistan</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("whiteboard")}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition border relative ${
            mobileTab === "whiteboard"
              ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/25"
              : "bg-slate-800/80 text-slate-300 border-slate-700/70"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Çözüm & Görsel Anlatım</span>
        </button>
      </nav>
    </div>
  );
}
