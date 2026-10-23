"use client";

import React, { useMemo } from "react";
import katex from "katex";
import { useITSStore } from "@/store/useITSStore";
import { PLANETS } from "@/lib/curriculum-graph";
import { Calculator, Scale, Gauge } from "lucide-react";

function renderLatex(tex: string, displayMode = false): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return tex;
  }
}

export const FormulaBoard: React.FC = () => {
  const { planet, gravity, mass } = useITSStore();
  const planetInfo = PLANETS[planet];
  const weight = mass * gravity;
  const earthWeight = mass * PLANETS.earth.gravity;
  const weightRatio =
    earthWeight > 0 ? ((weight / earthWeight) * 100).toFixed(0) : "0";

  const mainEquationHtml = useMemo(() => {
    const tex = `\\vec{G} = m \\cdot \\vec{g} \\implies G = ${mass}\\text{ kg} \\times ${gravity.toFixed(
      2
    )}\\text{ m/s}^2 = \\mathbf{${weight.toFixed(2)}\\text{ N}}`;
    return renderLatex(tex, false);
  }, [mass, gravity, weight]);

  const massInvariantHtml = useMemo(() => {
    const tex = `m_{\\text{Dünya}} = m_{\\text{${planetInfo.name}}} = \\mathbf{${mass}\\text{ kg}} \\quad (\\Delta m = 0)`;
    return renderLatex(tex, false);
  }, [mass, planetInfo.name]);

  const balanceEquationHtml = useMemo(() => {
    if (gravity === 0) {
      return renderLatex(
        `g = 0 \\implies \\tau_{\\text{sol}} = \\tau_{\\text{sağ}} = 0\\text{ N\\cdot m (Serbest Süzülme)}`,
        false
      );
    }
    return renderLatex(
      `m_{\\text{cisim}} \\cdot \\cancel{g} = m_{\\text{referans}} \\cdot \\cancel{g} \\implies m = ${mass}\\text{ kg}`,
      false
    );
  }, [gravity, mass]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Canlı KaTeX Formül & Ölçüm Panosu
            </h3>
            <p className="text-[11px] text-slate-400">
              MEB F.7.3.1 — Kütle ve Ağırlık Matematiksel Modeli
            </p>
          </div>
        </div>

        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full border"
          style={{
            backgroundColor: `${planetInfo.color}20`,
            borderColor: `${planetInfo.color}60`,
            color: planetInfo.accentColor,
          }}
        >
          {planetInfo.name} ({planetInfo.badgeText})
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5">
        {/* 1. Dinamometre / Ağırlık Denklemi */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              Dinamometre (Ağırlık Kuvveti)
            </span>
            <span className="text-slate-400">Dünya&apos;nın %{weightRatio}&apos;i</span>
          </div>
          <div
            className="text-xs sm:text-sm text-slate-100 overflow-x-auto py-1"
            dangerouslySetInnerHTML={{ __html: mainEquationHtml }}
          />
        </div>

        {/* 2. Kütle Değişmezliği */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-medium mb-1">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Kütle Değişmezliği (Madde Miktarı)
            </span>
            <span className="text-emerald-400/80">Sabit</span>
          </div>
          <div
            className="text-xs sm:text-sm text-slate-100 overflow-x-auto py-1"
            dangerouslySetInnerHTML={{ __html: massInvariantHtml }}
          />
        </div>

        {/* 3. Eşit Kollu Terazi Denge İlkesi */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-indigo-400 font-medium mb-1">
            <span>Terazi Denge Prensibi</span>
            <span className="text-slate-400">
              {gravity > 0 ? "g sadeleşir" : "Ağırlıksız ortam"}
            </span>
          </div>
          <div
            className="text-xs sm:text-sm text-slate-100 overflow-x-auto py-1"
            dangerouslySetInnerHTML={{ __html: balanceEquationHtml }}
          />
        </div>
      </div>
    </div>
  );
};
