"use client";

import React from "react";
import { useITSStore } from "@/store/useITSStore";
import { AlertTriangle, FlaskConical, X } from "lucide-react";

export const MisconceptionAlert: React.FC = () => {
  const {
    activeMisconception,
    dismissMisconception,
    applySimulationUpdate,
    setMobileTab,
  } = useITSStore();

  if (!activeMisconception) return null;

  const handleRunExperiment = () => {
    applySimulationUpdate({
      planet: activeMisconception.recommendedExperiment.planet,
      mass: activeMisconception.recommendedExperiment.mass,
    });
    setMobileTab("whiteboard");
  };

  return (
    <div className="bg-amber-950/60 border border-amber-500/50 rounded-xl p-3 mb-2.5 text-amber-100 shadow-lg backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-400/30">
                Kavram Yanılgısı Tespiti • {activeMisconception.code}
              </span>
              <h4 className="text-xs font-semibold text-amber-200">
                {activeMisconception.title}
              </h4>
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              <span className="font-semibold text-amber-300">
                Sokratik İpucu:{" "}
              </span>
              {activeMisconception.socraticHint}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRunExperiment}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-400/40 transition"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Önerilen Deneyi Tahtada Uygula</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissMisconception}
          className="text-amber-400/70 hover:text-amber-200 p-1 rounded-lg transition"
          aria-label="Kavram yanılgısı uyarısını kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
