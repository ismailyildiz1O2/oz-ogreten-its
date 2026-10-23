import {
  MisconceptionItem,
  PlanetId,
  PlanetInfo,
  SkillMastery,
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
    description: "Standart yerçekimi ivmesi (g = 9.81 m/s²). Kütle ve ağırlık ölçümlerinin referans noktası.",
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
    description: "Dünya'nın yaklaşık 1/6'sı kadar kütleçekim kuvveti (g = 1.62 m/s²). Kütle değişmez, ağırlık azalır.",
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
    description: "Kızıl Gezegen (g = 3.71 m/s²). Dünya'nın yaklaşık %38'i kadar çekim ivmesine sahiptir.",
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
    description: "Dev gaz gezegeni (g = 24.79 m/s²). Dünya'nın yaklaşık 2.5 katı çekim kuvveti uygular; dinamometre yayı maksimum uzar.",
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
    description: "Kütleçekimsiz ortam (g = 0 m/s²). Ağırlık sıfırdır (G = 0 N) ancak madde miktarı (kütle) hâlâ aynıdır!",
    badgeText: "g = 0.00 m/s² (Ağırlıksız)",
  },
};

export const INITIAL_SKILLS: Record<string, SkillMastery> = {
  "F.7.3.1.1": {
    skillId: "F.7.3.1.1",
    code: "F.7.3.1.1",
    title: "Kütle Değişmezliği (Madde Miktarı)",
    description:
      "Kütlenin değişmeyen madde miktarı olduğunu, eşit kollu terazi ile ölçüldüğünü ve biriminin kg/g olduğunu kavrar.",
    params: {
      pL: 0.42,
      pT: 0.16,
      pS: 0.1,
      pG: 0.2,
    },
    attempts: 1,
  },
  "F.7.3.1.2": {
    skillId: "F.7.3.1.2",
    code: "F.7.3.1.2",
    title: "Ağırlık ve Kütleçekim İlişkisi (G = m·g)",
    description:
      "Ağırlığın cisme etki eden yerçekimi kuvveti olduğunu, dinamometre ile ölçüldüğünü ve biriminin Newton (N) olduğunu açıklar.",
    params: {
      pL: 0.35,
      pT: 0.15,
      pS: 0.1,
      pG: 0.2,
    },
    attempts: 1,
  },
  "F.7.3.1.3": {
    skillId: "F.7.3.1.3",
    code: "F.7.3.1.3",
    title: "Gezegenler Arası Ölçüm ve Araç Analizi",
    description:
      "Farklı gök cisimlerinde eşit kollu terazi ve dinamometre ölçümlerinin nasıl değişeceğini matematiksel olarak yorumlar.",
    params: {
      pL: 0.28,
      pT: 0.15,
      pS: 0.12,
      pG: 0.18,
    },
    attempts: 1,
  },
};

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
    relatedSkillId: "F.7.3.1.1",
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
    relatedSkillId: "F.7.3.1.1",
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
      "Kuvvetin (ve ağırlığın) uluslararası birimi Newton (N)'dur ve yayların esneklik özelliğine dayanan dinamometre ile ölçülür.",
    socraticHint:
      "Formül panosundaki G = m · g denklemine göz at. Kütle (kg) ile yerçekimi ivmesini (m/s²) çarptığımızda elde ettiğimiz kuvvetin birimi nedir?",
    relatedSkillId: "F.7.3.1.2",
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
    relatedSkillId: "F.7.3.1.3",
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
  "Jüpiter'de dinamometre ve terazi ne gösterir?",
  "Uzay boşluğunda (g=0) kütle sıfır olur mu?",
  "Bana simülasyon üzerinden bir soru sor!",
];
