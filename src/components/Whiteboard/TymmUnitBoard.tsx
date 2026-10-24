"use client";

import React from "react";
import { useITSStore } from "@/store/useITSStore";
import { getMasteryStatus } from "@/lib/bkt-engine";
import {
  BookOpen,
  BrainCircuit,
  Compass,
  GraduationCap,
  Layers,
  Play,
  Sparkles,
  Tag,
} from "lucide-react";

interface TymmUnitBoardProps {
  onAskTutor: (promptText: string) => void;
}

export const TymmUnitBoard: React.FC<TymmUnitBoardProps> = ({
  onAskTutor,
}) => {
  const { activeUnit, skills, setTymmModalOpen, setMobileTab } = useITSStore();

  const conceptsList = (activeUnit.keyConcepts || "")
    .split(/[,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const skillEntries = Object.values(skills);

  const handleTriggerQuestion = (text: string) => {
    onAskTutor(text);
    setMobileTab("chat");
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* Üst Ünite Kimlik Kartı */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeUnit.gradeName} • {activeUnit.subject}
            </span>
            {activeUnit.hours && (
              <span className="text-xs text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                {activeUnit.hours} Ders Saati
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setTymmModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Başka Sınıf / Ders Seç</span>
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-white">
          {activeUnit.title}
        </h2>

        {activeUnit.description && (
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {activeUnit.description}
          </p>
        )}

        {/* Etkileşimli Anahtar Kavram Çipleri */}
        {conceptsList.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>
                Anahtar Kavramlar (Kavrama tıklayarak Proaktif Sınav sorusu
                başlatın):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {conceptsList.map((concept, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    handleTriggerQuestion(
                      `"${concept}" kavramını ${activeUnit.title} ünitesi kapsamında Sokratik bir sınav sorusuyla bana sorar mısın?`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-indigo-600/25 text-slate-200 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>{concept}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Öğrenme Çıktıları, Süreç Bileşenleri ve Canlı BKT Sınav Kartları */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>
              TYMM Öğrenme Çıktıları ve Süreç Bileşenleri ({skillEntries.length}{" "}
              Hedef)
            </span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Her çıktının BKT ustalık düzeyi canlı takip edilir
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {skillEntries.map((sk) => {
            const pct = Math.round(sk.params.pL * 100);
            const status = getMasteryStatus(sk.params.pL);

            return (
              <div
                key={sk.skillId}
                className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {sk.code}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-white">
                        {sk.title}
                      </h4>
                    </div>

                    {sk.processComponents && sk.processComponents.length > 0 && (
                      <ul className="pl-3 space-y-1 text-xs text-slate-300 border-l-2 border-slate-800 ml-1 mt-1.5">
                        {sk.processComponents.map((pc, i) => (
                          <li key={i}>{pc}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${status.bgClass} ${status.textClass}`}
                    >
                      BKT Ustalık: %{pct}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleTriggerQuestion(
                          `${sk.code} (${sk.title}) öğrenme çıktısından ve süreç bileşenlerinden beni Sokratik sınav yap!`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 shadow-sm"
                    >
                      <Play className="w-3 h-3" />
                      <span>Bu Çıktıdan Sınav Yap</span>
                    </button>
                  </div>
                </div>

                {/* Ustalık Çubuğu */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: status.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alt Bölüm: Çözümlenmiş TYMM Becerileri + Zenginleştirme & Öğretme Yaşantıları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Çözümlenmiş Beceri ve Değer Kodları */}
        {activeUnit.resolvedSkills && activeUnit.resolvedSkills.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>
                TYMM Beceri, Eğilim ve Değer Kodları (
                {activeUnit.resolvedSkills.length})
              </span>
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {activeUnit.resolvedSkills.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() =>
                    handleTriggerQuestion(
                      `${s.code} (${s.label}) becerisini kullanarak ${activeUnit.title} konusuyla ilgili bir çıkarım sorusu sorar mısın?`
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 text-[11px] flex items-center gap-1.5 text-left transition"
                  title={s.category}
                >
                  <span className="font-bold text-emerald-400">{s.code}</span>
                  <span className="text-slate-300">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zenginleştirme & Değerlendirme */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>Farklılaştırma & Ölçme-Değerlendirme</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
              {activeUnit.enrichment?.[0] ||
                activeUnit.assessment?.[0] ||
                activeUnit.teachingApplications?.[0] ||
                "Bu ünite kapsamında açık uçlu Sokratik sorular, tanılayıcı dallanmış ağaç ve süreç bileşeni analizleri uygulanır."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              handleTriggerQuestion(
                `${activeUnit.title} ünitesinin zenginleştirme ve üst düzey düşünme (farklılaştırma) senaryosuna göre bana zorlayıcı bir Sokratik soru sor!`
              )
            }
            className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition flex items-center justify-center gap-1.5"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Üst Düzey (Zenginleştirme) Sınav Sorusu İste</span>
          </button>
        </div>
      </div>
    </div>
  );
};
