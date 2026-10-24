"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useITSStore } from "@/store/useITSStore";
import {
  TymmCatalog,
  TymmCatalogUnitSummary,
  TymmUnitDetail,
} from "@/types/its";
import {
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const FEATURED_SCIENCE_UNITS = [
  {
    unitId: 368,
    badge: "5. Sınıf • Kütle & Ağırlık",
    title: "2. ÜNİTE: KUVVETİ TANIYALIM (FB.5.2.2.1)",
  },
  {
    unitId: 429,
    badge: "7. Sınıf • Kuvvet & Enerji",
    title: "2. ÜNİTE: KUVVET VE ENERJİYİ KEŞFEDELİM (FB.7.2.1.1)",
  },
  {
    unitId: 416,
    badge: "7. Sınıf • Uzay Çağı",
    title: "1. ÜNİTE: UZAY ÇAĞI (FB.7.1.1.1)",
  },
];

export const TymmSelectorModal: React.FC = () => {
  const {
    isTymmModalOpen,
    setTymmModalOpen,
    activeUnit,
    setActiveUnit,
  } = useITSStore();

  const [catalog, setCatalog] = useState<TymmCatalog | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number>(
    activeUnit?.grade ?? 5
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    activeUnit?.subject || "Fen Bilimleri Dersi"
  );
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [previewUnit, setPreviewUnit] = useState<TymmUnitDetail | null>(
    activeUnit
  );
  const [loadingUnit, setLoadingUnit] = useState(false);

  const fetchUnitDetail = useCallback(
    async (unitId: number, overrideGrade?: number, overrideSubject?: string) => {
      setLoadingUnit(true);
      try {
        const res = await fetch(`/api/tymm?unitId=${unitId}`);
        const data = await res.json();
        if (data.unit) {
          setPreviewUnit(data.unit);
          if (typeof overrideGrade === "number") {
            setSelectedGrade(overrideGrade);
          } else if (typeof data.unit.grade === "number") {
            setSelectedGrade(data.unit.grade);
          }
          if (overrideSubject) {
            setSelectedSubject(overrideSubject);
          } else if (data.unit.subject) {
            setSelectedSubject(data.unit.subject);
          }
        }
      } catch (e) {
        console.error("Ünite detayı yüklenemedi:", e);
      } finally {
        setLoadingUnit(false);
      }
    },
    []
  );

  // Katalog verisini yükle
  useEffect(() => {
    if (!isTymmModalOpen) return;
    setPreviewUnit(activeUnit);
    setSelectedGrade(activeUnit?.grade ?? 5);
    setSelectedSubject(activeUnit?.subject || "Fen Bilimleri Dersi");

    if (!catalog) {
      fetch("/api/tymm")
        .then((r) => r.json())
        .then((data) => {
          if (data.catalog) {
            setCatalog(data.catalog);
          }
        })
        .catch((err) => console.error("Katalog yüklenemedi:", err));
    }
  }, [isTymmModalOpen, activeUnit, catalog]);

  if (!isTymmModalOpen) return null;

  const currentGradeObj =
    catalog?.classes.find((c) => c.grade === selectedGrade) ||
    catalog?.classes[0];

  const allSubjectsInGrade = currentGradeObj?.subjects || [];
  const filteredSubjects = subjectSearch.trim()
    ? allSubjectsInGrade.filter(
        (s) =>
          s.subject.toLowerCase().includes(subjectSearch.toLowerCase()) ||
          s.units.some((u) =>
            u.title.toLowerCase().includes(subjectSearch.toLowerCase())
          )
      )
    : allSubjectsInGrade;

  const currentSubjectObj =
    filteredSubjects.find((s) => s.subject === selectedSubject) ||
    allSubjectsInGrade.find((s) => s.subject === selectedSubject) ||
    filteredSubjects[0] ||
    allSubjectsInGrade[0];

  const unitsList: TymmCatalogUnitSummary[] = currentSubjectObj?.units || [];

  // 1. Sınıf değiştiğinde: O sınıfın ilk dersini (veya Fen/Matematik dersini) ve ilk ünitesini otomatik yükle!
  const handleGradeChange = (gradeNum: number) => {
    setSelectedGrade(gradeNum);
    setSubjectSearch("");
    const targetGrade = catalog?.classes.find((c) => c.grade === gradeNum);
    if (targetGrade && targetGrade.subjects.length > 0) {
      // Eğer mevcut ders bu sınıfta da varsa onu koru, yoksa ilk dersi seç
      const sameSubj = targetGrade.subjects.find(
        (s) => s.subject === selectedSubject
      );
      const chosenSubj = sameSubj || targetGrade.subjects[0];
      setSelectedSubject(chosenSubj.subject);
      if (chosenSubj.units.length > 0) {
        fetchUnitDetail(
          chosenSubj.units[0].unitId,
          gradeNum,
          chosenSubj.subject
        );
      }
    }
  };

  // 2. Ders değiştiğinde: O dersin ilk ünitesini otomatik yükle!
  const handleSubjectChange = (subjName: string) => {
    setSelectedSubject(subjName);
    const targetSubj = allSubjectsInGrade.find((s) => s.subject === subjName);
    if (targetSubj && targetSubj.units.length > 0) {
      fetchUnitDetail(
        targetSubj.units[0].unitId,
        selectedGrade,
        targetSubj.subject
      );
    }
  };

  // 3. Üniteye tıklandığında: O üniteyi yükle ve hemen uygula / önizle
  const handleUnitClick = (unitId: number) => {
    fetchUnitDetail(unitId, selectedGrade, currentSubjectObj?.subject);
  };

  const handleApplyUnit = () => {
    if (previewUnit) {
      setActiveUnit(previewUnit);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tymm-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Üst Başlık */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="tymm-modal-title"
                  className="text-base font-bold text-white"
                >
                  Türkiye Yüzyılı Maarif Modeli (TYMM) Müfredat Motoru
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  2.321 Ünite • 1.208 Beceri & Değer Kodu
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1. Sınıftan 12. Sınıfa istediğiniz sınıfı, dersi ve üniteyi
                seçerek Proaktif Sınav tahtasını ve Sokratik öğretmeni
                güncelleyin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTymmModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hızlı Fizik / Fen Simülasyon Üniteleri Seçim Çubuğu */}
        <div className="px-5 py-2 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Fizik Laboratuvarı Üniteleri:
          </span>
          {FEATURED_SCIENCE_UNITS.map((item) => {
            const isCurrent = previewUnit?.unitId === item.unitId;
            return (
              <button
                key={item.unitId}
                type="button"
                onClick={() => fetchUnitDetail(item.unitId)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                  isCurrent
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-sm"
                    : "bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-800"
                }`}
              >
                <span className="font-semibold text-[10px] opacity-85">
                  [{item.badge}]
                </span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Ana Gövde: Sol Katalog Seçici + Sağ Ünite Detay & Beceri Kodları */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
          {/* SOL: Sınıf -> Ders -> Ünite Ağacı */}
          <div className="lg:col-span-5 p-4 overflow-y-auto space-y-4 bg-slate-950/30">
            {/* 1. Sınıf Seçimi */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                1. Sınıf Düzeyi Seçin
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(catalog?.classes || []).map((cls) => {
                  const isGradeSelected = selectedGrade === cls.grade;
                  return (
                    <button
                      key={cls.grade}
                      type="button"
                      onClick={() => handleGradeChange(cls.grade)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                        isGradeSelected
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {cls.gradeName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Ders Seçimi (Arama + Liste & Dropdown) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  2. Ders Seçin ({filteredSubjects.length} Ders)
                </label>
              </div>

              {/* Ders Arama Kutusu */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Ders veya ünite adı ara (Örn: Matematik, Fizik, Tarih)..."
                  className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Ders Seçim Butonları (Kaydırılabilir Hızlı Liste) */}
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-800/80 rounded-xl p-1.5 bg-slate-950/60">
                {filteredSubjects.map((subj) => {
                  const isSubjSelected =
                    currentSubjectObj?.subject === subj.subject;
                  return (
                    <button
                      key={subj.subject}
                      type="button"
                      onClick={() => handleSubjectChange(subj.subject)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between gap-2 ${
                        isSubjSelected
                          ? "bg-emerald-600/25 text-emerald-200 border border-emerald-500/40"
                          : "text-slate-300 hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="truncate">{subj.subject}</span>
                      <span className="text-[10px] opacity-75 shrink-0">
                        {subj.units.length} Ünite
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Ünite / Tema Listesi */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                3. Ünite / Tema Seçin ({unitsList.length} Ünite)
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {unitsList.map((u) => {
                  const isSelected = previewUnit?.unitId === u.unitId;
                  return (
                    <button
                      key={u.unitId}
                      type="button"
                      onClick={() => handleUnitClick(u.unitId)}
                      onDoubleClick={() => {
                        fetchUnitDetail(u.unitId).then(() => {
                          if (previewUnit) setActiveUnit(previewUnit);
                        });
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 ${
                        isSelected
                          ? "bg-indigo-600/25 border-indigo-400 text-white shadow-sm"
                          : "bg-slate-900/80 border-slate-800/90 text-slate-300 hover:bg-slate-800/70"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold leading-snug">
                          {u.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1">
                          <span>Ünite ID: #{u.unitId}</span>
                          {u.hours && <span>• {u.hours} Ders Saati</span>}
                          <span>• {u.outcomesCount} Çıktı</span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SAĞ: Seçili Ünite Detayları, Süreç Bileşenleri ve Çözümlenmiş Beceri Kodları */}
          <div className="lg:col-span-7 p-5 overflow-y-auto space-y-4">
            {loadingUnit ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                TYMM ünite detayları ve beceri kodları yükleniyor...
              </div>
            ) : previewUnit ? (
              <>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {previewUnit.gradeName} • {previewUnit.subject}
                    </span>
                    <div className="flex items-center gap-2">
                      {previewUnit.hours && (
                        <span className="text-xs text-slate-400">
                          Süre: <strong>{previewUnit.hours} Saat</strong> •
                          Ünite #{previewUnit.unitId}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleApplyUnit}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Hemen Seç & Başla</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {previewUnit.title}
                  </h3>
                  {previewUnit.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {previewUnit.description}
                    </p>
                  )}
                  {previewUnit.keyConcepts && (
                    <div className="pt-1 text-xs text-emerald-300">
                      <strong>Anahtar Kavramlar: </strong>
                      {previewUnit.keyConcepts}
                    </div>
                  )}
                </div>

                {/* Öğrenme Çıktıları ve Süreç Bileşenleri */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>
                      Öğrenme Çıktıları ve Süreç Bileşenleri (BKT Hedefleri)
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {(previewUnit.outcomes || []).map((out, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-3 space-y-1.5"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                            {out.code}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {out.title}
                          </span>
                        </div>
                        {out.processComponents &&
                          out.processComponents.length > 0 && (
                            <ul className="pl-3 space-y-1 text-xs text-slate-300 border-l-2 border-slate-800 ml-2">
                              {out.processComponents.map((pc, pIdx) => (
                                <li key={pIdx}>{pc}</li>
                              ))}
                            </ul>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Çözümlenmiş TYMM Beceri, Eğilim ve Değer Kodları (codes.json) */}
                {previewUnit.resolvedSkills &&
                  previewUnit.resolvedSkills.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span>
                          Eşleşen TYMM Beceri, Eğilim ve Değer Kodları (
                          {previewUnit.resolvedSkills.length} Kod)
                        </span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {previewUnit.resolvedSkills.map((sk) => (
                          <div
                            key={sk.code}
                            className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-xs flex items-center gap-1.5"
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

                {/* Farklılaştırma: Zenginleştirme & Öğretme Yaşantıları */}
                {previewUnit.enrichment && previewUnit.enrichment.length > 0 && (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5 space-y-1.5">
                    <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" />
                      <span>
                        TYMM Farklılaştırma (Zenginleştirme & Bilim Tarihi)
                      </span>
                    </div>
                    {previewUnit.enrichment.map((enr, i) => (
                      <p
                        key={i}
                        className="text-xs text-indigo-100/90 leading-relaxed"
                      >
                        {enr}
                      </p>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Alt Aksiyon Çubuğu */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Seçili Ünite:{" "}
            <strong className="text-white">
              {previewUnit?.gradeName} • {previewUnit?.subject} —{" "}
              {previewUnit?.title}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTymmModalOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleApplyUnit}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Bu Üniteyi Sokratik AI ve BKT Modeline Uygula</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
