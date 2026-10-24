"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useITSStore } from "@/store/useITSStore";
import { getMasteryStatus } from "@/lib/bkt-engine";
import {
  findBestSubjectForGrade,
  getShortSubjectLabel,
} from "@/lib/curriculum-graph";
import {
  TymmCatalog,
  TymmCatalogUnitSummary,
  TymmUnitDetail,
} from "@/types/its";
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  Layers,
  Search,
} from "lucide-react";

export const RightCurriculumSidebar: React.FC = () => {
  const {
    activeUnit,
    setActiveUnit,
    selectedOutcomeCode,
    setSelectedOutcomeCode,
    skills,
    setBktModalOpen,
  } = useITSStore();

  const [catalog, setCatalog] = useState<TymmCatalog | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number>(
    activeUnit?.grade ?? 5
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    activeUnit?.subject || "Fen Bilimleri Dersi"
  );
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [loadingUnit, setLoadingUnit] = useState(false);

  // Katalog verisini ilk açılışta yükle
  useEffect(() => {
    fetch("/api/tymm")
      .then((r) => r.json())
      .then((data) => {
        if (data.catalog) {
          setCatalog(data.catalog);
        }
      })
      .catch((err) => console.error("TYMM Katalog yüklenemedi:", err));
  }, []);

  // activeUnit dışarıdan değişirse senkronize et
  useEffect(() => {
    if (activeUnit) {
      setSelectedGrade(activeUnit.grade);
      setSelectedSubject(activeUnit.subject);
    }
  }, [activeUnit]);

  const loadAndApplyUnit = useCallback(
    async (unitId: number, overrideGrade?: number, overrideSubject?: string) => {
      const targetGrade =
        typeof overrideGrade === "number" ? overrideGrade : selectedGrade;
      const targetSubject = overrideSubject || selectedSubject;
      setLoadingUnit(true);
      try {
        const params = new URLSearchParams({
          unitId: String(unitId),
          grade: String(targetGrade),
          subject: targetSubject,
        });
        const res = await fetch(`/api/tymm?${params.toString()}`);
        const data = await res.json();
        if (data.unit) {
          const normalizedUnit: TymmUnitDetail = {
            ...data.unit,
            grade: targetGrade,
            gradeName:
              targetGrade === 0
                ? "Hazırlık / Genel"
                : `${targetGrade}. Sınıf`,
            subject: targetSubject || data.unit.subject,
          };
          setSelectedGrade(targetGrade);
          setSelectedSubject(normalizedUnit.subject);
          setActiveUnit(normalizedUnit);
        }
      } catch (e) {
        console.error("Ünite yüklenemedi:", e);
      } finally {
        setLoadingUnit(false);
      }
    },
    [selectedGrade, selectedSubject, setActiveUnit]
  );

  const currentGradeObj =
    catalog?.classes.find((c) => c.grade === selectedGrade) ||
    catalog?.classes[0];

  const allSubjectsInGrade = currentGradeObj?.subjects || [];
  const searchNorm = subjectSearch.trim().toLocaleLowerCase("tr-TR");
  const filteredSubjects = searchNorm
    ? allSubjectsInGrade.filter(
        (s) =>
          s.subject.toLocaleLowerCase("tr-TR").includes(searchNorm) ||
          getShortSubjectLabel(s.subject)
            .toLocaleLowerCase("tr-TR")
            .includes(searchNorm) ||
          s.units.some((u) =>
            u.title.toLocaleLowerCase("tr-TR").includes(searchNorm)
          )
      )
    : allSubjectsInGrade;

  const currentSubjectObj =
    filteredSubjects.find((s) => s.subject === selectedSubject) ||
    allSubjectsInGrade.find((s) => s.subject === selectedSubject) ||
    filteredSubjects[0] ||
    allSubjectsInGrade[0];

  const unitsList: TymmCatalogUnitSummary[] = currentSubjectObj?.units || [];

  const handleGradeSelect = (gradeNum: number) => {
    setSelectedGrade(gradeNum);
    setSubjectSearch("");
    const targetGrade = catalog?.classes.find((c) => c.grade === gradeNum);
    if (targetGrade && targetGrade.subjects.length > 0) {
      const chosenSubj =
        findBestSubjectForGrade(targetGrade.subjects, selectedSubject) ||
        targetGrade.subjects[0];
      setSelectedSubject(chosenSubj.subject);
      if (chosenSubj.units.length > 0) {
        loadAndApplyUnit(
          chosenSubj.units[0].unitId,
          gradeNum,
          chosenSubj.subject
        );
      }
    }
  };

  const handleSubjectSelect = (subjName: string) => {
    setSelectedSubject(subjName);
    const targetSubj = allSubjectsInGrade.find((s) => s.subject === subjName);
    if (targetSubj && targetSubj.units.length > 0) {
      loadAndApplyUnit(
        targetSubj.units[0].unitId,
        selectedGrade,
        targetSubj.subject
      );
    }
  };

  const validOutcomes = (activeUnit.outcomes || []).filter(
    (o) => o.code && !o.code.startsWith("KAZ.")
  );
  const outcomesList =
    validOutcomes.length > 0 ? validOutcomes : activeUnit.outcomes || [];

  return (
    <aside className="flex flex-col h-full bg-slate-900/95 border border-slate-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Sağ Panel Başlığı */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white">
              Sınıf, Ders & Kazanım Seçici
            </h2>
            <p className="text-[11px] text-slate-400">
              TYMM Müfredatı (1-12. Sınıf • 2.321 Ünite)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setBktModalOpen(true)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1"
          title="Detaylı BKT Ustalık Tablosunu Aç"
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>BKT</span>
        </button>
      </div>

      {/* Kaydırılabilir Seçici Gövdesi */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* 1. SINIF SEÇİMİ */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            1. Sınıf Seçin
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(catalog?.classes || []).map((cls) => {
              const isSelected = selectedGrade === cls.grade;
              return (
                <button
                  key={cls.grade}
                  type="button"
                  onClick={() => handleGradeSelect(cls.grade)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                      : "bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {cls.gradeName}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. DERS SEÇİMİ */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            2. Ders Seçin ({filteredSubjects.length} Ders)
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              placeholder="Ders ara (Matematik, Fizik, İnkılap, Türkçe)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <select
            value={currentSubjectObj?.subject || ""}
            onChange={(e) => handleSubjectSelect(e.target.value)}
            aria-label="Ders seçin"
            className="w-full bg-slate-950 border border-slate-700/90 focus:border-emerald-500 rounded-lg px-2.5 py-2 text-xs font-medium text-white outline-none"
          >
            {filteredSubjects.map((subj) => (
              <option key={subj.subject} value={subj.subject}>
                {subj.subject} ({subj.units.length} Ünite)
              </option>
            ))}
          </select>
        </div>

        {/* 3. ÜNİTE / TEMA SEÇİMİ */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            3. Ünite / Öğrenme Alanı Seçin ({unitsList.length} Ünite)
          </label>
          <select
            value={activeUnit.unitId}
            onChange={(e) => loadAndApplyUnit(Number(e.target.value))}
            aria-label="Ünite seçin"
            className="w-full bg-slate-950 border border-slate-700/90 focus:border-indigo-500 rounded-lg px-2.5 py-2 text-xs font-medium text-white outline-none"
          >
            {unitsList.map((u) => (
              <option key={u.unitId} value={u.unitId}>
                {u.title} ({u.outcomesCount} Kazanım)
              </option>
            ))}
          </select>
        </div>

        {/* 4. KAZANIM (ÖĞRENME ÇIKTISI) SEÇİMİ VE SÜREÇ BİLEŞENLERİ */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>4. Kazanım (Öğrenme Çıktısı) Seçin</span>
            </label>
            {loadingUnit && (
              <span className="text-[10px] text-indigo-400 animate-pulse">
                Yükleniyor...
              </span>
            )}
          </div>

          <div className="space-y-2">
            {outcomesList.map((out) => {
              const isSelected = out.code === selectedOutcomeCode;
              const sk = skills[out.code];
              const pct = sk ? Math.round(sk.params.pL * 100) : 35;
              const status = getMasteryStatus(sk?.params.pL ?? 0.35);

              return (
                <button
                  key={out.code}
                  type="button"
                  onClick={() => setSelectedOutcomeCode(out.code)}
                  className={`w-full text-left p-3 rounded-xl border transition space-y-2 ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-400 text-white shadow-md shadow-indigo-950/50"
                      : "bg-slate-950/70 border-slate-800/90 text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-400"
                            : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                        }`}
                      >
                        {out.code}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.bgClass} ${status.textClass}`}
                    >
                      BKT: %{pct}
                    </span>
                  </div>

                  <div className="text-xs font-semibold leading-snug text-slate-100">
                    {out.title}
                  </div>

                  {/* Seçili kazanımın alt süreç bileşenleri */}
                  {isSelected &&
                    out.processComponents &&
                    out.processComponents.length > 0 && (
                      <ul className="pl-2.5 space-y-1 text-[11px] text-slate-300 border-l-2 border-indigo-500/60 mt-1.5">
                        {out.processComponents.map((pc, idx) => (
                          <li key={idx}>{pc}</li>
                        ))}
                      </ul>
                    )}

                  {/* Mini BKT Bar */}
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. ÜNİTENİN TYMM BECERİ VE DEĞER KODLARI */}
        {activeUnit.resolvedSkills && activeUnit.resolvedSkills.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Ünite TYMM Beceri & Değer Kodları ({activeUnit.resolvedSkills.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeUnit.resolvedSkills.map((sk) => (
                <span
                  key={sk.code}
                  className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                  title={sk.category}
                >
                  <strong className="text-emerald-400">{sk.code}</strong>{" "}
                  {sk.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
