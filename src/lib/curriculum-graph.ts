import {
  MisconceptionItem,
  PlanetId,
  PlanetInfo,
  SkillMastery,
  TymmCatalogSubject,
  TymmUnitDetail,
} from "@/types/its";

export const PLANETS: Record<PlanetId, PlanetInfo> = {
  earth: {
    id: "earth",
    name: "Dünya",
    gravity: 9.81,
    color: "#3b82f6",
    accentColor: "#60a5fa",
    skyGradient: ["#0f172a", "#1e3a5f"],
    surfaceColor: "#1e293b",
    description:
      "Standart yerçekimi ivmesi (g = 9.81 m/s²). Kütle ve ağırlık ölçümlerinin referans noktası.",
    badgeText: "g = 9.81 m/s²",
  },
  moon: {
    id: "moon",
    name: "Ay",
    gravity: 1.62,
    color: "#94a3b8",
    accentColor: "#cbd5e1",
    skyGradient: ["#050811", "#111827"],
    surfaceColor: "#334155",
    description:
      "Dünya'nın yaklaşık 1/6'sı kadar kütleçekim kuvveti (g = 1.62 m/s²). Kütle değişmez, ağırlık azalır.",
    badgeText: "g = 1.62 m/s² (≈ 1/6 Dünya)",
  },
  mars: {
    id: "mars",
    name: "Mars",
    gravity: 3.71,
    color: "#ef4444",
    accentColor: "#f87171",
    skyGradient: ["#1c0d0a", "#3b1812"],
    surfaceColor: "#451a14",
    description:
      "Kızıl Gezegen (g = 3.71 m/s²). Dünya'nın yaklaşık %38'i kadar çekim ivmesine sahiptir.",
    badgeText: "g = 3.71 m/s²",
  },
  jupiter: {
    id: "jupiter",
    name: "Jüpiter",
    gravity: 24.79,
    color: "#f59e0b",
    accentColor: "#fbbf24",
    skyGradient: ["#1f1408", "#3d2610"],
    surfaceColor: "#42280e",
    description:
      "Dev gaz gezegeni (g = 24.79 m/s²). Dünya'nın yaklaşık 2.5 katı çekim kuvveti uygular; dinamometre yayı maksimum uzar.",
    badgeText: "g = 24.79 m/s² (≈ 2.5x Dünya)",
  },
  space: {
    id: "space",
    name: "Derin Uzay",
    gravity: 0.0,
    color: "#8b5cf6",
    accentColor: "#a78bfa",
    skyGradient: ["#030308", "#090718"],
    surfaceColor: "#131126",
    description:
      "Kütleçekimsiz ortam (g = 0 m/s²). Ağırlık sıfırdır (G = 0 N) ancak madde miktarı (kütle) hâlâ aynıdır!",
    badgeText: "g = 0.00 m/s² (Ağırlıksız)",
  },
};

export const DEFAULT_TYMM_UNIT: TymmUnitDetail = {
  unitId: 368,
  grade: 5,
  gradeName: "5. Sınıf",
  subject: "Fen Bilimleri Dersi",
  title: "2. ÜNİTE: KUVVETİ TANIYALIM (Kütle ve Ağırlık İlişkisi)",
  hours: "24",
  description:
    "Bu ünitede kuvvetin büyüklüğünün dinamometre ile ölçülmesinin gösterilmesi, Dünya ve Ay’daki kütle ile ağırlık kavramlarının karşılaştırılması ve eşit kollu terazi ile dinamometre ölçümlerinin yorumlanması amaçlanmaktadır.",
  outcomes: [
    {
      code: "FB.5.2.1.1",
      title: "Kuvveti büyüklüğü ile tanımlayabilme (Dinamometre ve Newton)",
      processComponents: [
        "a) Kuvvetin niteliklerini tanımlar.",
        "b) Kuvvetin büyüklüğünü dinamometre ile ölçer.",
        "c) Kuvvetin büyüklüğünü Newton (N) birimi ile tanımlar.",
      ],
    },
    {
      code: "FB.5.2.1.2",
      title: "Basit araç gereçler kullanarak bir dinamometre modeli tasarlayabilme",
      processComponents: [
        "a) Basit araç gereçler kullanarak bir dinamometre modeli önerir.",
        "b) Tasarladığı dinamometre modelini yeni kanıtlara göre geliştirir.",
      ],
    },
    {
      code: "FB.5.2.2.1",
      title: "Kütleye etki eden yer çekimi kuvvetini ağırlık olarak tanımlayabilme",
      processComponents: [
        "a) Kütle ve ağırlık kavramlarına ait nitelikleri tanımlar.",
        "b) Dinamometre kullanarak ağırlık, eşit kollu terazi ile kütle ölçümü yapar.",
        "c) Ağırlığı bir kuvvet olarak tanımlar; Dünya ve Ay'daki ölçümleri karşılaştırır.",
      ],
    },
  ],
  keyConcepts:
    "kuvvet, kuvvet birimi (Newton), dinamometre, eşit kollu terazi, kütle, ağırlık, yer çekimi",
  support: [
    "Eğitsel dijital içerikler (video, animasyon, simülasyon vb.) soyut kavramların somutlaştırılmasında ve kavramsal anlayışın pekiştirilmesinde kullanılabilir.",
  ],
  enrichment: [
    "Hazinî'nin bilime yaptığı önemli katkılardan biri yer çekimi konusundaki görüşleridir. Hazinî, yer çekiminin her cismi yerkürenin merkezine doğru çeken bir gücün varlığı ile ilgili bir teori ileri sürmüştür. Bu teori, kendisinden yaklaşık 500 yıl sonra gelen Newton tarafından kanıtlanmıştır.",
    "Birûnî'nin 'Dünya dönüyorsa, ağaçlar ve taşlar neden fırlamıyor?' sorusuna 'Merkezde bir çekicilik olduğu için her şey dünyanın merkezine düşer.' cevabı üzerinden tarihsel yaklaşım incelenebilir.",
  ],
  assessment: [
    "Öğrenme çıktılarının değerlendirilmesinde kavram/zihin haritası, tanılayıcı dallanmış ağaç ve dinamometre model performansı kullanılabilir.",
  ],
  teachingApplications: [
    "FB.5.2.2.1 Öğrencilerin kütle hakkındaki ön bilgilerini tespit etmek için sorular sorulur. Dinamometre kullanarak cisimlerin ağırlıklarını ölçmeleri, eşit kollu terazi kullanarak kütlesini ölçmeleri ve sonuçların birbirinden farklı çıkma durumlarını (Dünya ve Ay karşılaştırması) yorumlamaları sağlanır (D3.3, OB7, OB1, E1.1, E3.8).",
  ],
  skills: {
    deger: ["D3.3", "D16.3"],
    egilim: ["E1.1", "E3.5", "E3.8", "E3.11"],
    kavramsal: ["KB2.6"],
    okuryazarlik: ["OB1", "OB7"],
    sosyal_duygusal: ["SDB1.2", "SDB1.3", "SDB2.1"],
  },
  sourceUrl: "https://tymm.meb.gov.tr/1/unite/368",
  resolvedSkills: [
    {
      category: "Kavramsal Beceriler (KB)",
      code: "KB2.6",
      label: "Bilgi Toplama Becerisi",
    },
    {
      category: "Okuryazarlık Becerileri (OB)",
      code: "OB1",
      label: "Bilgi Okuryazarlığı",
    },
    {
      category: "Okuryazarlık Becerileri (OB)",
      code: "OB7",
      label: "Veri Okuryazarlığı",
    },
    {
      category: "Eğilimler (E)",
      code: "E1.1",
      label: "Merak",
    },
    {
      category: "Eğilimler (E)",
      code: "E3.8",
      label: "Soru Sorma",
    },
    {
      category: "Değerler (D)",
      code: "D3.3",
      label: "Çalışkanlık (Bilimsel yaklaşım ve ölçüm disiplini)",
    },
    {
      category: "Sosyal-Duygusal Öğrenme Becerileri (SDB)",
      code: "SDB1.2",
      label: "Öz Düzenleme Becerisi",
    },
  ],
};

/**
 * Herhangi bir TYMM ünitesinin öğrenme çıktılarını (outcomes) BKT SkillMastery nesnelerine dönüştürür.
 */
export function convertTymmUnitToSkills(
  unit: TymmUnitDetail
): Record<string, SkillMastery> {
  const validOutcomes = (unit.outcomes || []).filter(
    (o) => o.code && !o.code.startsWith("KAZ.") && o.processComponents.length > 0
  );

  const listToUse =
    validOutcomes.length > 0 ? validOutcomes : unit.outcomes || [];

  const result: Record<string, SkillMastery> = {};
  listToUse.forEach((outcome, index) => {
    const cleanCode = outcome.code.trim();
    const initialPL = Number(Math.max(0.25, 0.42 - index * 0.06).toFixed(2));
    result[cleanCode] = {
      skillId: cleanCode,
      code: cleanCode,
      title: outcome.title,
      description:
        outcome.processComponents.join(" ") ||
        `${unit.subject} - ${unit.title} kazanımı`,
      processComponents: outcome.processComponents,
      params: {
        pL: initialPL,
        pT: 0.16,
        pS: 0.1,
        pG: 0.2,
      },
      attempts: 1,
    };
  });

  if (Object.keys(result).length === 0) {
    const fallbackCode = `ÜNİTE-${unit.unitId}`;
    result[fallbackCode] = {
      skillId: fallbackCode,
      code: fallbackCode,
      title: unit.title,
      description: unit.description || unit.keyConcepts,
      processComponents: [],
      params: { pL: 0.4, pT: 0.15, pS: 0.1, pG: 0.2 },
      attempts: 1,
    };
  }

  return result;
}

export const INITIAL_SKILLS: Record<string, SkillMastery> =
  convertTymmUnitToSkills(DEFAULT_TYMM_UNIT);

export const MISCONCEPTIONS: Record<string, MisconceptionItem> = {
  "MY-01": {
    id: "MY-01",
    code: "MY-01",
    title: "Kütle ve Ağırlığı Aynı Kavram Sanma",
    studentPattern:
      "Öğrenci günlük dildeki 'Ağırlığım 50 kg' ifadesinden yola çıkarak kütle ile ağırlığın aynı büyüklük olduğunu düşünür.",
    scientificTruth:
      "Kütle madde miktarıdır (birimi kg, eşit kollu terazi ile ölçülür); ağırlık ise kütleye etki eden yerçekimi kuvvetidir (birimi Newton, dinamometre ile ölçülür).",
    socraticHint:
      "Tahtadaki iki ölçüm aracına dikkatlice bak: Biri kefeli terazi, diğeri yaylı dinamometre. Gezegeni değiştirdiğimizde hangisinin gösterdiği değer sabit kalıyor?",
    relatedSkillId: "FB.5.2.2.1",
    recommendedExperiment: {
      planet: "moon",
      mass: 6,
      focusPrompt:
        "Simülasyonu Ay'a (g=1.62 m/s²) ve 6 kg kütleye ayarladım. Eşit kollu terazi ile dinamometrenin göstergelerini karşılaştırır mısın?",
    },
  },
  "MY-02": {
    id: "MY-02",
    code: "MY-02",
    title: "Ay'da veya Uzayda Kütlenin Azaldığını / Sıfırlandığını Düşünme",
    studentPattern:
      "Öğrenci Ay'a gidildiğinde kütleçekimi 1/6 oranında azaldığı için cismin kütlesinin de 6'da 1'ine düşeceğini veya uzayda kütlenin sıfır olacağını varsayar.",
    scientificTruth:
      "Bir cismin içindeki atom/madde miktarı (kütle, m) bulunduğu konuma göre değişmez. Değişen yalnızca çekim ivmesi (g) ve dolayısıyla ağırlıktır (G = m·g).",
    socraticHint:
      "Cismin içindeki madde taneciklerinden bir kısmını yolda düşürmediysek, Ay'a gittiğimizde eşit kollu terazinin sol ve sağ kefesindeki kütle dengesi neden bozulsun?",
    relatedSkillId: "FB.5.2.2.1",
    recommendedExperiment: {
      planet: "space",
      mass: 8,
      focusPrompt:
        "Seni Derin Uzay'a (g=0 m/s²) götürdüm! Dinamometre 0 N gösteriyor. Peki bu 8 kg'lık demir bloğun kendisi yok mu oldu?",
    },
  },
  "MY-03": {
    id: "MY-03",
    code: "MY-03",
    title: "Birim ve Ölçü Aleti Karışıklığı (kg vs Newton)",
    studentPattern:
      "Öğrenci ağırlık birimi olarak kilogram (kg) veya kütle ölçüm aracı olarak dinamometre kullanır.",
    scientificTruth:
      "Kuvvetin (ve ağırlığın) uluslararası birimi Newton (N)'dur ve yayların esneklik özelliğine dayanan dinamometre ile ölçülür (TYMM FB.5.2.1.1).",
    socraticHint:
      "Formül panosundaki G = m · g denklemine göz at. Kütle (kg) ile yerçekimi ivmesini (m/s²) çarptığımızda elde ettiğimiz kuvvetin birimi nedir?",
    relatedSkillId: "FB.5.2.1.1",
    recommendedExperiment: {
      planet: "jupiter",
      mass: 5,
      focusPrompt:
        "Jüpiter'de 5 kg'lık kütleyi dinamometreye astık. Yay çok daha fazla uzadı! Dinamometrenin üzerindeki ibre hangi birimi gösteriyor?",
    },
  },
  "MY-04": {
    id: "MY-04",
    code: "MY-04",
    title: "Eşit Kollu Terazinin Farklı Gezegenlerde Farklı Ölçeceği Yanılgısı",
    studentPattern:
      "Öğrenci Jüpiter'de yerçekimi daha büyük olduğu için eşit kollu terazinin daha büyük bir kütle değeri göstereceğini düşünür.",
    scientificTruth:
      "Eşit kollu terazinin her iki kefesine de aynı yerçekimi ivmesi (g) etki eder (m₁·g = m₂·g). g'ler sadeleştiği için g > 0 olan her gezegende terazi aynı kütleyi ölçer.",
    socraticHint:
      "Jüpiter'in güçlü yerçekimi sadece sol kefedeki cismi mi çekiyor, yoksa sağ kefedeki referans ağırlıkları da aynı oranda mı çekiyor?",
    relatedSkillId: "FB.5.2.2.1",
    recommendedExperiment: {
      planet: "jupiter",
      mass: 10,
      focusPrompt:
        "Jüpiter'de (g=24.79 m/s²) 10 kg kütleyi teraziye koyduk. Her iki kefeye etki eden kuvveti düşünürsek terazi dengesi bozuldu mu?",
    },
  },
};

export const DEFAULT_QUICK_REPLIES: string[] = [
  "Ay'a gidersek kütlem de 6'da 1'ine düşer mi?",
  "Ağırlığım 60 kg demek bilimsel olarak doğru mu?",
  "Hazinî ve Birûnî yer çekimini nasıl açıklamıştır?",
  "Jüpiter'de dinamometre ve terazi ne gösterir?",
  "Uzay boşluğunda (g=0) kütle sıfır olur mu?",
];

/**
 * Temel sınav ve okul derslerini seçmeli/özel okul derslerinden ayıran öncelik skoru.
 * Küçük sayı = Daha yüksek öncelik (Listenin en üstünde yer alır).
 */
export function getCoreSubjectPriority(subjectName: string): number {
  const s = subjectName.trim();
  const lower = s.toLocaleLowerCase("tr-TR");

  // Özel okul modülleri en sonda yer alsın
  if (lower.includes("müzik okulları") || lower.includes("spor okulları")) {
    return 900;
  }

  // 1. Matematik (İlkokul / Ortaokul / Lise)
  if (
    s === "İlkokul Matematik Dersi" ||
    s === "İlkokul Matematik Dersi (Maarif Modeli)" ||
    s === "Ortaokul Matematik Dersi" ||
    s === "Ortaokul Matematik Dersi (Maarif Modeli)" ||
    s === "Matematik Dersi"
  ) {
    return lower.includes("maarif") ? 10 : 11;
  }

  // 2. Türkçe / Türk Dili ve Edebiyatı
  if (
    s === "İlkokul Türkçe Dersi" ||
    s === "İlkokul Türkçe Dersi (Maarif Modeli)" ||
    s === "Ortaokul Türkçe Dersi" ||
    s === "Ortaokul Türkçe Dersi (Maarif Modeli)" ||
    s === "Türk Dili Ve Edebiyatı Dersi"
  ) {
    return lower.includes("maarif") ? 20 : 21;
  }

  // 3. Fen Bilimleri / Fizik / Kimya / Biyoloji / Hayat Bilgisi
  if (
    s === "Fen Bilimleri Dersi" ||
    s === "Fen Bilimleri Dersi (Maarif Modeli)"
  ) {
    return lower.includes("maarif") ? 30 : 31;
  }
  if (s === "Fizik Dersi") return 32;
  if (s === "Kimya Dersi") return 33;
  if (s === "Biyoloji Dersi") return 34;
  if (s === "Hayat Bilgisi Dersi") return 35;

  // 4. Sosyal Bilgiler / T.C. İnkılap Tarihi / Tarih / Coğrafya
  if (
    s === "Sosyal Bilgiler Dersi" ||
    s === "Sosyal Bilgiler Dersi (Maarif Modeli)"
  ) {
    return lower.includes("maarif") ? 40 : 41;
  }
  if (
    s === "T.C. İnkılap Tarihi ve Atatürkçülük Dersi" ||
    s === "T.C. İnkılap Tarihi ve Atatürkçülük Dersi (Maarif Modeli)"
  ) {
    return lower.includes("maarif") ? 42 : 43;
  }
  if (s === "Tarih Dersi") return 44;
  if (s === "Coğrafya Dersi") return 45;
  if (s === "Çağdaş Türk ve Dünya Tarihi Dersi") return 46;

  // 5. Felsefe / Psikoloji / Sosyoloji / Mantık
  if (s === "Felsefe Dersi") return 50;
  if (s === "Psikoloji Dersi") return 51;
  if (s === "Sosyoloji Dersi") return 52;
  if (s === "Mantık Dersi") return 53;

  // 6. Din Kültürü ve Ahlak Bilgisi
  if (
    s === "Din Kültürü ve Ahlak Bilgisi Dersi" ||
    s === "Din Kültürü ve Ahlak Bilgisi Dersi (Maarif Modeli)"
  ) {
    return lower.includes("maarif") ? 60 : 61;
  }

  // 7. İngilizce (Yabancı Dil)
  if (
    s === "İngilizce Dersi" ||
    s === "İngilizce Dersi (Maarif Modeli)" ||
    s === "İngilizce Dersi (9-12)"
  ) {
    return lower.includes("maarif") ? 70 : 71;
  }

  // 8. Diğer temel okul dersleri
  if (
    s.startsWith("İnsan Hakları,Vatandaşlık") ||
    s.startsWith("Trafik Güvenliği") ||
    s === "Bilişim Teknolojileri ve Yazılım Dersi" ||
    s === "Teknoloji ve Tasarım Dersi" ||
    s === "Teknoloji ve Tasarım Dersi (Maarif Modeli)" ||
    s === "Sağlık Bilgisi ve Trafik Kültürü Dersi"
  ) {
    return 80;
  }

  if (
    s.startsWith("Görsel Sanatlar Dersi") ||
    s.startsWith("Müzik Dersi") ||
    s.startsWith("Beden Eğitimi ve")
  ) {
    return 90;
  }

  // Seçmeli dersler
  return 500;
}

export function isCoreSubject(subjectName: string): boolean {
  return getCoreSubjectPriority(subjectName) < 100;
}

export function isPrimaryExamSubject(subjectName: string): boolean {
  return getCoreSubjectPriority(subjectName) < 80;
}

export function getShortSubjectLabel(subjectName: string): string {
  const map: Record<string, string> = {
    "İlkokul Matematik Dersi": "Matematik",
    "İlkokul Matematik Dersi (Maarif Modeli)": "Matematik (TYMM)",
    "Ortaokul Matematik Dersi": "Matematik",
    "Ortaokul Matematik Dersi (Maarif Modeli)": "Matematik (TYMM)",
    "Matematik Dersi": "Matematik",
    "İlkokul Türkçe Dersi": "Türkçe",
    "İlkokul Türkçe Dersi (Maarif Modeli)": "Türkçe (TYMM)",
    "Ortaokul Türkçe Dersi": "Türkçe",
    "Ortaokul Türkçe Dersi (Maarif Modeli)": "Türkçe (TYMM)",
    "Türk Dili Ve Edebiyatı Dersi": "Türk Dili ve Edebiyatı",
    "Fen Bilimleri Dersi": "Fen Bilimleri",
    "Fen Bilimleri Dersi (Maarif Modeli)": "Fen Bilimleri (TYMM)",
    "Fizik Dersi": "Fizik",
    "Kimya Dersi": "Kimya",
    "Biyoloji Dersi": "Biyoloji",
    "Hayat Bilgisi Dersi": "Hayat Bilgisi",
    "Sosyal Bilgiler Dersi": "Sosyal Bilgiler",
    "Sosyal Bilgiler Dersi (Maarif Modeli)": "Sosyal Bilgiler (TYMM)",
    "T.C. İnkılap Tarihi ve Atatürkçülük Dersi": "T.C. İnkılap Tarihi",
    "T.C. İnkılap Tarihi ve Atatürkçülük Dersi (Maarif Modeli)":
      "T.C. İnkılap Tarihi (TYMM)",
    "Tarih Dersi": "Tarih",
    "Coğrafya Dersi": "Coğrafya",
    "Çağdaş Türk ve Dünya Tarihi Dersi": "Çağdaş Türk ve Dünya Tarihi",
    "Felsefe Dersi": "Felsefe",
    "Psikoloji Dersi": "Psikoloji",
    "Sosyoloji Dersi": "Sosyoloji",
    "Mantık Dersi": "Mantık",
    "Din Kültürü ve Ahlak Bilgisi Dersi": "Din Kültürü",
    "Din Kültürü ve Ahlak Bilgisi Dersi (Maarif Modeli)": "Din Kültürü (TYMM)",
    "İngilizce Dersi": "İngilizce",
    "İngilizce Dersi (Maarif Modeli)": "İngilizce (TYMM)",
    "İngilizce Dersi (9-12)": "İngilizce",
  };
  return map[subjectName] || subjectName.replace(/ Dersi$/i, "");
}

/**
 * Sınıf değiştirildiğinde, kullanıcının önceki dersine en uygun (aynı veya eşdeğer branştaki) dersi bulur.
 */
export function findBestSubjectForGrade(
  subjects: TymmCatalogSubject[],
  previousSubject: string
): TymmCatalogSubject | undefined {
  if (!subjects || subjects.length === 0) return undefined;

  // 1. Birebir aynı isimde ders varsa onu seç
  const exact = subjects.find((s) => s.subject === previousSubject);
  if (exact) return exact;

  const prevLower = previousSubject.toLocaleLowerCase("tr-TR");

  // 2. Branş ailesi eşleştirmesi (Matematik, Türkçe/Edebiyat, Fen/Fizik, Sosyal/Tarih/İnkılap, İngilizce, Din Kültürü)
  const isMath =
    prevLower.includes("matematik") && !prevLower.includes("uygulamaları");
  if (isMath) {
    const m = subjects.find(
      (s) =>
        getCoreSubjectPriority(s.subject) >= 10 &&
        getCoreSubjectPriority(s.subject) <= 19
    );
    if (m) return m;
  }

  const isTurkish =
    prevLower.includes("türkçe") || prevLower.includes("edebiyat");
  if (isTurkish) {
    const t = subjects.find(
      (s) =>
        getCoreSubjectPriority(s.subject) >= 20 &&
        getCoreSubjectPriority(s.subject) <= 29
    );
    if (t) return t;
  }

  const isScience =
    prevLower.includes("fen bilimleri") ||
    prevLower.includes("fizik") ||
    prevLower.includes("kimya") ||
    prevLower.includes("biyoloji") ||
    prevLower.includes("hayat bilgisi");
  if (isScience) {
    const sci = subjects.find(
      (s) =>
        getCoreSubjectPriority(s.subject) >= 30 &&
        getCoreSubjectPriority(s.subject) <= 39
    );
    if (sci) return sci;
  }

  const isSocial =
    prevLower.includes("sosyal bilgiler") ||
    prevLower.includes("inkılap") ||
    prevLower.includes("tarih") ||
    prevLower.includes("coğrafya");
  if (isSocial) {
    const soc = subjects.find(
      (s) =>
        getCoreSubjectPriority(s.subject) >= 40 &&
        getCoreSubjectPriority(s.subject) <= 49
    );
    if (soc) return soc;
  }

  const isEnglish = prevLower.includes("ingilizce");
  if (isEnglish) {
    const eng = subjects.find(
      (s) =>
        getCoreSubjectPriority(s.subject) >= 70 &&
        getCoreSubjectPriority(s.subject) <= 79
    );
    if (eng) return eng;
  }

  const isReligion = prevLower.includes("din kültürü");
  if (isReligion) {
    const rel = subjects.find(
      (s) =>
        getCoreSubjectPriority(s.subject) >= 60 &&
        getCoreSubjectPriority(s.subject) <= 69
    );
    if (rel) return rel;
  }

  // 3. Hiçbiri eşleşmezse o sınıfın en yüksek öncelikli temel dersini (Matematik/Türkçe/Fen) seç
  const sorted = [...subjects].sort(
    (a, b) =>
      getCoreSubjectPriority(a.subject) - getCoreSubjectPriority(b.subject)
  );
  return sorted[0];
}

