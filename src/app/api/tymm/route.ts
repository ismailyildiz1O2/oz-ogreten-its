import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { TymmCatalog, TymmCodeItem, TymmUnitDetail } from "@/types/its";
import { getCoreSubjectPriority } from "@/lib/curriculum-graph";

let cachedCatalog: TymmCatalog | null = null;
let cachedCodesMap: Map<string, TymmCodeItem> | null = null;
let syntheticUnitsMap: Map<number, TymmUnitDetail> | null = null;

function makeSubjectPrefix(subject: string): string {
  const words = subject
    .replace(/Dersi|\(.*?\)|[^A-Za-zÇĞİÖŞÜçğıöşü\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "DRS";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function getCodesMap(): Map<string, TymmCodeItem> {
  if (cachedCodesMap) return cachedCodesMap;
  const codesPath = path.join(process.cwd(), "public", "tymm", "codes.json");
  const raw = fs.readFileSync(codesPath, "utf8");
  const list: TymmCodeItem[] = JSON.parse(raw);
  const map = new Map<string, TymmCodeItem>();
  for (const item of list) {
    map.set(item.code.trim().toUpperCase(), item);
  }
  cachedCodesMap = map;
  return map;
}

function getCatalog(): TymmCatalog {
  if (cachedCatalog && syntheticUnitsMap) return cachedCatalog;
  const catalogPath = path.join(
    process.cwd(),
    "public",
    "tymm",
    "catalog.json"
  );
  const raw = fs.readFileSync(catalogPath, "utf8");
  const parsed = JSON.parse(raw) as TymmCatalog;
  const synthMap = new Map<number, TymmUnitDetail>();

  // 12. Sınıfta YKS/AYT öğrencileri için 11. Sınıftaki Felsefe ve Tarih dersleri yoksa ekle
  const grade11 = parsed.classes.find((c) => c.grade === 11);
  const grade12 = parsed.classes.find((c) => c.grade === 12);
  if (grade11 && grade12) {
    for (const extraSubj of ["Tarih Dersi", "Felsefe Dersi"]) {
      if (!grade12.subjects.some((s) => s.subject === extraSubj)) {
        const from11 = grade11.subjects.find((s) => s.subject === extraSubj);
        if (from11) {
          grade12.subjects.push({
            subject: from11.subject,
            units: from11.units.map((u) => ({ ...u })),
          });
        }
      }
    }
  }

  // Tüm sınıflarda:
  // 1) Ünitesi boş (0 ünite) olan derslere otomatik ünite ve kazanım oluştur
  // 2) Dersleri önce Temel Sınav/Okul Dersleri, sonra Seçmeli Dersler olacak şekilde sırala
  for (const cls of parsed.classes) {
    cls.subjects.forEach((subj, sIdx) => {
      if (!subj.units || subj.units.length === 0) {
        const prefix = makeSubjectPrefix(subj.subject);
        const gNum = cls.grade || 1;
        const unitId1 = 990000 + gNum * 1000 + sIdx * 10 + 1;
        const unitId2 = 990000 + gNum * 1000 + sIdx * 10 + 2;
        const cleanSubj = subj.subject.replace(/ Dersi$/i, "");

        const code1 = `${prefix}.${gNum}.1.1`;
        const code2 = `${prefix}.${gNum}.1.2`;
        const code3 = `${prefix}.${gNum}.2.1`;

        subj.units = [
          {
            unitId: unitId1,
            title: `1. ÜNİTE: ${cleanSubj.toLocaleUpperCase("tr-TR")} TEMEL KAVRAMLARI VE İLKELERİ`,
            hours: "18",
            outcomesCount: 2,
            outcomeCodes: [code1, code2],
          },
          {
            unitId: unitId2,
            title: `2. ÜNİTE: ${cleanSubj.toLocaleUpperCase("tr-TR")} UYGULAMALARI VE ANALİZİ`,
            hours: "18",
            outcomesCount: 1,
            outcomeCodes: [code3],
          },
        ];

        synthMap.set(unitId1, {
          unitId: unitId1,
          grade: cls.grade,
          gradeName: cls.grade === 0 ? "Hazırlık / Genel" : `${cls.grade}. Sınıf`,
          subject: subj.subject,
          title: subj.units[0].title,
          hours: "18",
          description: `${cls.gradeName} ${subj.subject} kapsamında temel kavramların anlaşılması, günlük yaşam durumlarıyla ilişkilendirilmesi ve problem çözme becerilerinin geliştirilmesi amaçlanmaktadır.`,
          outcomes: [
            {
              code: code1,
              title: `${cleanSubj} alanındaki temel kavram ve ilkeleri açıklayabilme`,
              processComponents: [
                `a) ${cleanSubj} ile ilgili temel kavramların niteliklerini belirler.`,
                `b) Kavramlar arasındaki ilişkileri günlük yaşam örnekleriyle açıklar.`,
              ],
            },
            {
              code: code2,
              title: `${cleanSubj} kapsamındaki kuralları ve süreçleri analiz edebilme`,
              processComponents: [
                `a) Karşılaşılan durumlarda doğru ilkeleri seçer.`,
                `b) Neden-sonuç ilişkisi kurarak çıkarımda bulunur.`,
              ],
            },
          ],
          keyConcepts: `${cleanSubj.toLocaleLowerCase("tr-TR")}, temel ilkeler, uygulama, analiz, değerlendirme`,
          support: [],
          enrichment: [],
          assessment: [],
          teachingApplications: [],
          skills: {
            deger: ["D3.3"],
            egilim: ["E1.1", "E3.8"],
            kavramsal: ["KB2.6"],
            okuryazarlik: ["OB1"],
            sosyal_duygusal: ["SDB1.2"],
          },
          sourceUrl: "https://tymm.meb.gov.tr",
        });

        synthMap.set(unitId2, {
          unitId: unitId2,
          grade: cls.grade,
          gradeName: cls.grade === 0 ? "Hazırlık / Genel" : `${cls.grade}. Sınıf`,
          subject: subj.subject,
          title: subj.units[1].title,
          hours: "18",
          description: `${cls.gradeName} ${subj.subject} kapsamında uygulamalı çalışmalar ve örnek olay analizleri yapılması amaçlanmaktadır.`,
          outcomes: [
            {
              code: code3,
              title: `${cleanSubj} kazanımlarını gerçek yaşam problemlerinin çözümünde uygulayabilme`,
              processComponents: [
                `a) Örnek olay ve sorulardaki temel problemi tespit eder.`,
                `b) Çözüm için bilimsel ve kurallı çıkarımlar yapar.`,
              ],
            },
          ],
          keyConcepts: `${cleanSubj.toLocaleLowerCase("tr-TR")}, problem çözme, örnek olay analizi, uygulama`,
          support: [],
          enrichment: [],
          assessment: [],
          teachingApplications: [],
          skills: {
            deger: ["D3.3"],
            egilim: ["E1.1"],
            kavramsal: ["KB2.10"],
            okuryazarlik: ["OB1"],
            sosyal_duygusal: ["SDB2.1"],
          },
          sourceUrl: "https://tymm.meb.gov.tr",
        });
      }
    });

    cls.subjects.sort((a, b) => {
      const pa = getCoreSubjectPriority(a.subject);
      const pb = getCoreSubjectPriority(b.subject);
      if (pa !== pb) return pa - pb;
      return a.subject.localeCompare(b.subject, "tr-TR");
    });
  }

  cachedCatalog = parsed;
  syntheticUnitsMap = synthMap;
  return cachedCatalog;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unitIdParam = searchParams.get("unitId");
    const gradeParam = searchParams.get("grade");
    const subjectParam = searchParams.get("subject");

    const catalog = getCatalog();

    // Eğer unitId verilmişse ilgili ünitenin detayını ve çözümlenmiş beceri kodlarını döndür
    if (unitIdParam) {
      const unitId = Number(unitIdParam);
      if (isNaN(unitId)) {
        return NextResponse.json(
          { error: "Geçersiz unitId parametresi" },
          { status: 400 }
        );
      }

      let unitData: TymmUnitDetail | null = null;

      if (syntheticUnitsMap?.has(unitId)) {
        unitData = JSON.parse(
          JSON.stringify(syntheticUnitsMap.get(unitId)!)
        ) as TymmUnitDetail;
      } else {
        const unitPath = path.join(
          process.cwd(),
          "public",
          "tymm",
          "units",
          `${unitId}.json`
        );

        if (!fs.existsSync(unitPath)) {
          return NextResponse.json(
            { error: `Ünite dosyası bulunamadı: ${unitId}` },
            { status: 404 }
          );
        }

        const unitRaw = fs.readFileSync(unitPath, "utf8");
        unitData = JSON.parse(unitRaw) as TymmUnitDetail;
      }

      // Kullanıcının seçtiği sınıf ve ders bilgisini koru (Ortaokul/Lise ortak derslerinin 0 veya 9. sınıfa atlamasını önler!)
      if (gradeParam !== null && gradeParam !== "" && !isNaN(Number(gradeParam))) {
        const requestedGrade = Number(gradeParam);
        unitData.grade = requestedGrade;
        unitData.gradeName =
          requestedGrade === 0
            ? "Hazırlık / Genel"
            : `${requestedGrade}. Sınıf`;
      } else if (unitData.grade === 0) {
        // Eğer grade parametresi gelmediyse fakat ünite katalogda 1-12 arası bir sınıfta yer alıyorsa onu eşleştir
        for (const cls of catalog.classes) {
          if (cls.grade > 0) {
            const foundSubj = cls.subjects.find((s) =>
              s.units.some((u) => u.unitId === unitId)
            );
            if (foundSubj) {
              unitData.grade = cls.grade;
              unitData.gradeName = `${cls.grade}. Sınıf`;
              break;
            }
          }
        }
      }

      if (subjectParam && subjectParam.trim()) {
        unitData.subject = subjectParam.trim();
      }

      // Eğer ünitenin kazanım (outcomes) listesi boşsa veya sadece KAZ.1 gibi başlıksız kayıt varsa anlamlı kazanım üret
      if (!unitData.outcomes || unitData.outcomes.length === 0) {
        const prefix = makeSubjectPrefix(unitData.subject);
        const gNum = unitData.grade || 1;
        unitData.outcomes = [
          {
            code: `${prefix}.${gNum}.1.1`,
            title: `${unitData.title} kapsamındaki temel kavramları ve ilişkileri çözümleyebilme`,
            processComponents: [
              "a) Temel kavram ve ilkeleri belirler.",
              "b) Kavramlar arasındaki ilişkileri bağlam içinde yorumlar.",
            ],
          },
        ];
      } else {
        const realOutcomes = unitData.outcomes.filter(
          (o) => o.code && !o.code.startsWith("KAZ.")
        );
        if (realOutcomes.length > 0) {
          unitData.outcomes = realOutcomes;
        } else {
          const prefix = makeSubjectPrefix(unitData.subject);
          const gNum = unitData.grade || 1;
          unitData.outcomes = unitData.outcomes.map((o, idx) => ({
            ...o,
            code: `${prefix}.${gNum}.${idx + 1}`,
            title: o.title || `${unitData!.title} - Kazanım ${idx + 1}`,
          }));
        }
      }

      const codesMap = getCodesMap();
      const allSkillCodes = new Set<string>();
      if (unitData.skills) {
        Object.values(unitData.skills).forEach((arr) => {
          if (Array.isArray(arr)) {
            arr.forEach((c) => allSkillCodes.add(c.trim().toUpperCase()));
          }
        });
      }

      const resolvedSkills: TymmCodeItem[] = [];
      allSkillCodes.forEach((code) => {
        const found = codesMap.get(code);
        if (found) {
          resolvedSkills.push(found);
        } else {
          resolvedSkills.push({
            category: "TYMM Becerisi",
            code,
            label: code,
          });
        }
      });

      unitData.resolvedSkills = resolvedSkills;
      return NextResponse.json({ unit: unitData });
    }

    // Parametre yoksa katalog özetini döndür
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("TYMM API Error:", error);
    return NextResponse.json(
      { error: "TYMM verileri okunurken hata oluştu." },
      { status: 500 }
    );
  }
}
