"use client";

import React, { useMemo } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import { getMasteryStatus } from "@/lib/bkt-engine";
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  History,
  Layers,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";

export const BktModal: React.FC = () => {
  const {
    isBktModalOpen,
    setBktModalOpen,
    setTymmModalOpen,
    activeUnit,
    skills,
    bktHistory,
    applyBKTUpdate,
    resetBKT,
  } = useITSStore();

  const bktFormulaHtml = useMemo(() => {
    try {
      const tex = `P(L_n \\mid \\text{Doğru}) = \\frac{P(L_n)(1 - P(S))}{P(L_n)(1 - P(S)) + (1 - P(L_n))P(G)}, \\quad P(L_{n+1}) = P(L_n \\mid \\text{Gözlem}) + (1 - P(L_n \\mid \\text{Gözlem}))P(T)`;
      return katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return "";
    }
  }, []);

  if (!isBktModalOpen) return null;

  const skillList = Object.values(skills);
  const averageMastery =
    skillList.length > 0
      ? skillList.reduce((acc, s) => acc + s.params.pL, 0) / skillList.length
      : 0.35;

  const handleSimulateObservation = async (
    skillId: string,
    isCorrect: boolean
  ) => {
    try {
      const target = skills[skillId];
      await fetch("/api/bkt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId,
          isCorrect,
          params: target?.params,
        }),
      });
    } catch {
      // Yerel BKT motoru her durumda senkron çalışır
    }
    applyBKTUpdate(
      skillId,
      isCorrect,
      isCorrect
        ? "BKT Simülatörü: Doğru TYMM süreç bileşeni gözlemi uygulandı."
        : "BKT Simülatörü: Yanılgı / hatalı gözlem uygulandı."
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bkt-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Üst Başlık */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="bkt-modal-title"
                className="text-base font-bold text-white"
              >
                Bayesian Knowledge Tracing (BKT) & TYMM Öğrenci Modeli
              </h2>
              <p className="text-xs text-slate-400">
                Aktif Ünite:{" "}
                <strong className="text-slate-200">
                  {activeUnit.gradeName} • {activeUnit.title}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBktModalOpen(false);
                setTymmModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>TYMM Ünite Değiştir</span>
            </button>
            <button
              type="button"
              onClick={resetBKT}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
            <button
              type="button"
              onClick={() => setBktModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal İçerik Gövdesi */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Genel Ustalık Özeti ve Matematiksel Model */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Genel Ünite Ustalık Skoru ({activeUnit.title})
                </span>
                <div className="text-2xl font-bold text-white mt-0.5">
                  %{(averageMastery * 100).toFixed(1)}
                </div>
              </div>
              <div className="text-xs text-slate-400 max-w-md">
                Ustalık eşiği <strong>%85 ($P(L_n) \ge 0.85$)</strong> olarak
                belirlenmiştir. Sokratik sohbetteki her yanıtınız Bayes teoremi
                ile arka olasılığı günceller.
              </div>
            </div>

            <div
              className="text-xs text-slate-200 bg-slate-900/90 border border-slate-800/90 rounded-lg p-2.5 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: bktFormulaHtml }}
            />
          </div>

          {/* Eşleşen TYMM Beceri, Eğilim ve Değer Kodları (codes.json) */}
          {activeUnit.resolvedSkills &&
            activeUnit.resolvedSkills.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Ünitenin TYMM Beceri, Eğilim ve Değer Profili (codes.json)
                  </span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {activeUnit.resolvedSkills.map((sk) => (
                    <div
                      key={sk.code}
                      className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center gap-1.5"
                      title={sk.category}
                    >
                      <span className="font-bold text-emerald-400">
                        {sk.code}
                      </span>
                      <span className="text-slate-300">{sk.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Kazanım / Öğrenme Çıktısı Bazlı BKT Kartları */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              TYMM Öğrenme Çıktıları, Süreç Bileşenleri ve BKT Parametreleri
            </h3>

            {skillList.map((skill) => {
              const pct = Math.round(skill.params.pL * 100);
              const status = getMasteryStatus(skill.params.pL);

              return (
                <div
                  key={skill.skillId}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {skill.code}
                        </span>
                        <h4 className="text-sm font-semibold text-white">
                          {skill.title}
                        </h4>
                      </div>
                      {skill.processComponents &&
                      skill.processComponents.length > 0 ? (
                        <ul className="pl-3 space-y-0.5 text-xs text-slate-400 border-l-2 border-slate-800 ml-1">
                          {skill.processComponents.map((pc, i) => (
                            <li key={i}>{pc}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">
                          {skill.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bgClass} ${status.textClass}`}
                      >
                        {status.label} • %{pct}
                      </span>
                    </div>
                  </div>

                  {/* İlerleme Çubuğu */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>

                  {/* Parametre Rozetleri ve Manuel Test Butonları */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        P(L) = <strong>{skill.params.pL.toFixed(2)}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        P(T) Geçiş = <strong>{skill.params.pT}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        P(S) Hata = <strong>{skill.params.pS}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        P(G) Tahmin = <strong>{skill.params.pG}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleSimulateObservation(skill.skillId, true)
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+ Doğru Gözlem</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSimulateObservation(skill.skillId, false)
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>- Yanılgı Gözlemi</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Son BKT Güncelleme Geçmişi */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <History className="w-3.5 h-3.5" />
              <span>Bilişsel Durum Güncelleme Günlüğü</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl divide-y divide-slate-800/80 max-h-44 overflow-y-auto">
              {bktHistory.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">
                        {item.skillId}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">{item.reason}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Saat: {item.timestamp}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 font-semibold px-2 py-0.5 rounded border text-[11px] ${
                      item.isCorrect
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    %{(item.previousPL * 100).toFixed(0)} → %
                    {(item.newPL * 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
