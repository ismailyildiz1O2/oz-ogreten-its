import { TymmUnitDetail } from "@/types/its";

/**
 * Türkçe karakter duyarlı güvenli küçük harfe çevirme (İ -> i, I -> ı, \u0307 temizleme)
 */
export function normalizeTr(text: string): string {
  return (text || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/i\u0307/g, "i")
    .trim();
}

export interface ParsedOption {
  letter: string;
  text: string;
}

export interface SubQuestionItem {
  index: number;
  title: string;
  prompt: string;
  proactiveHint: string;
  socraticQuestion: string;
  reactiveAnswer: string;
}

export type VisualSceneKind =
  | "biology-cell"
  | "solar-system"
  | "trablusgarp"
  | "physics-gravity"
  | "math-visual"
  | "chemistry-visual"
  | "concept-flow";

export interface VisualStoryStep {
  title: string;
  desc: string;
  badge: string;
  highlightTag?: string;
}

export interface DeepQuestionAnalysis {
  sceneKind: VisualSceneKind;
  sceneTitle: string;
  isMultipleChoice: boolean;
  options: ParsedOption[];
  detectedKeywords: string[];
  contextSummary: string;
  subQuestions: SubQuestionItem[];
  storySteps: VisualStoryStep[];
  proactiveStep1Hint: string;
  proactiveStep1Question: string;
  proactiveStep1QuickReplies: string[];
  reactiveCorrectTitle: string;
  reactiveSteps: string[];
  distractorOrMisconceptionWarning: string;
  examTip: string;
}

export function parseOptionsFromText(qText: string): ParsedOption[] {
  const regex = /(?:^|\n)\s*([A-E])\s*[\)\.\-:]\s*([^\n]+)/gi;
  const result: ParsedOption[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(qText || "")) !== null) {
    result.push({
      letter: match[1].toUpperCase(),
      text: match[2].trim(),
    });
  }
  return result;
}

/**
 * Öğrencinin girdiği sorudan arka planda otomatik olarak ders, sınıf, ünite ve kazanım tespit eder.
 * Kullanıcı hiçbir ders/sınıf seçmek zorunda kalmaz.
 */
export function detectCurriculumInBackground(
  rawQuestion: string,
  fallbackUnit: TymmUnitDetail
): { unit: TymmUnitDetail; outcomeCode: string } {
  const qNorm = normalizeTr(rawQuestion || "");
  if (!qNorm) {
    const firstCode =
      fallbackUnit.outcomes?.find((o) => !o.code.startsWith("KAZ."))?.code ||
      fallbackUnit.outcomes?.[0]?.code ||
      "GENEL.1";
    return { unit: fallbackUnit, outcomeCode: firstCode };
  }

  if (
    qNorm.includes("hücre") ||
    qNorm.includes("mitoz") ||
    qNorm.includes("mayoz") ||
    qNorm.includes("eşeysiz") ||
    qNorm.includes("eşeyli") ||
    qNorm.includes("nöron") ||
    qNorm.includes("hidra") ||
    qNorm.includes("g_0") ||
    qNorm.includes("g0") ||
    qNorm.includes("dna") ||
    qNorm.includes("kalıtım") ||
    qNorm.includes("fotosentez") ||
    qNorm.includes("ekosistem")
  ) {
    return {
      unit: {
        ...fallbackUnit,
        unitId: 9001,
        grade: 12,
        gradeName: "Biyoloji",
        subject: "Biyoloji",
        title: "Hücre Bölünmeleri, Üreme ve Metabolizma",
        description:
          "Hücre döngüsü, mitoz/mayoz bölünme, eşeysiz/eşeyli üreme stratejileri ve hücresel kontrol mekanizmaları.",
        keyConcepts:
          "Hücre döngüsü, G0 evresi, mitoz, eşeysiz üreme, eşeyli üreme, adaptasyon, enerji maliyeti",
        outcomes: [
          {
            code: "BİY.12.1.1",
            title:
              "Hücre bölünmesinin ve üremenin canlılar için önemini yorumlayabilme",
            processComponents: [
              "a) Hücre bölünmesini ve üreme stratejilerini inceler.",
              "b) Hücre bölünmesinin nedenlerini ve G0 kontrolünü açıklar.",
              "c) Hücre bölünmesinin üreme, büyüme ve gelişme için önemini yorumlar.",
            ],
          },
        ],
        teachingApplications: [],
      },
      outcomeCode: "BİY.12.1.1",
    };
  }

  if (
    qNorm.includes("gezegen") ||
    qNorm.includes("güneş sistemi") ||
    qNorm.includes("merkür") ||
    qNorm.includes("jüpiter") ||
    qNorm.includes("satürn") ||
    qNorm.includes("asteroit") ||
    qNorm.includes("tutulma")
  ) {
    return {
      unit: {
        ...fallbackUnit,
        unitId: 9002,
        grade: 6,
        gradeName: "Fen Bilimleri",
        subject: "Astronomi & Fen Bilimleri",
        title: "Güneş Sistemi ve Tutulmalar",
        description:
          "Güneş sistemindeki gezegenlerin Güneş'e yakınlık sıralaması, karasal ve gazsal özellikleri ile Güneş/Ay tutulmaları.",
        keyConcepts:
          "Merkür, Venüs, Dünya, Mars, Jüpiter, Satürn, Uranüs, Neptün, Asteroit Kuşağı, Tutulmalar",
        outcomes: [
          {
            code: "FB.6.1.1.1",
            title:
              "Güneş sistemindeki gezegenleri niteliklerine göre sınıflandırabilme",
            processComponents: [
              "a) Gezegenlerin temel niteliklerini (karasal/gazsal, uydu, halka) belirler.",
              "b) Gezegenleri Güneş'e yakınlık ve büyüklüklerine göre sıralar.",
            ],
          },
        ],
        teachingApplications: [],
      },
      outcomeCode: "FB.6.1.1.1",
    };
  }

  if (
    qNorm.includes("trablusgarp") ||
    qNorm.includes("gazeteci şerif") ||
    qNorm.includes("derne") ||
    qNorm.includes("tobruk") ||
    qNorm.includes("bingazi") ||
    qNorm.includes("mustafa kemal") ||
    qNorm.includes("osmanlı") ||
    qNorm.includes("cephesi") ||
    qNorm.includes("inkılap")
  ) {
    return {
      unit: {
        ...fallbackUnit,
        unitId: 9003,
        grade: 12,
        gradeName: "Tarih & İnkılap",
        subject: "T.C. İnkılap Tarihi ve Atatürkçülük",
        title: "Mustafa Kemal'in Askerî Hayatı ve Kişilik Özellikleri",
        description:
          "Trablusgarp Savaşı, Mustafa Kemal'in vatanseverlik ve teşkilatçılık özellikleri.",
        keyConcepts:
          "Trablusgarp, Derne, Tobruk, Bingazi, Vatanseverlik, Teşkilatçılık",
        outcomes: [
          {
            code: "İTA.12.1.1",
            title:
              "Mustafa Kemal'in askerî hayatındaki olayları kişilik özellikleriyle ilişkilendirebilme",
            processComponents: [
              "a) Trablusgarp Savaşı'ndaki gönüllü mücadelesini (Vatanseverlik) açıklar.",
              "b) Derne, Tobruk ve Bingazi'de halkı örgütlemesini (Teşkilatçılık) yorumlar.",
            ],
          },
        ],
        teachingApplications: [],
      },
      outcomeCode: "İTA.12.1.1",
    };
  }

  if (
    qNorm.includes("kütle") ||
    qNorm.includes("ağırlık") ||
    qNorm.includes("dinamometre") ||
    qNorm.includes("yerçekimi") ||
    qNorm.includes("kuvvet") ||
    qNorm.includes("ivme") ||
    qNorm.includes("newton")
  ) {
    return {
      unit: {
        ...fallbackUnit,
        unitId: 9004,
        grade: 5,
        gradeName: "Fizik & Fen",
        subject: "Fizik / Fen Bilimleri",
        title: "Kuvvet, Kütle ve Ağırlık İlişkisi",
        description:
          "Kütle ve ağırlık kavramlarının karşılaştırılması, yerçekimi ivmesi ve dinamometre ölçümleri.",
        keyConcepts: "Kütle (m), Ağırlık (G), Yerçekimi İvmesi (g), Dinamometre",
        outcomes: [
          {
            code: "FİZ.KÜTLE.1",
            title:
              "Kütle ve ağırlık kavramlarını neden-sonuç ilişkisiyle karşılaştırabilme",
            processComponents: [
              "a) Kütlenin değişmeyen madde miktarı olduğunu belirler.",
              "b) Ağırlığın yerçekimi ivmesine bağlı bir kuvvet (G = m.g) olduğunu açıklar.",
            ],
          },
        ],
        teachingApplications: [],
      },
      outcomeCode: "FİZ.KÜTLE.1",
    };
  }

  if (
    qNorm.includes("örüntü") ||
    qNorm.includes("denklem") ||
    qNorm.includes("fonksiyon") ||
    qNorm.includes("üçgen") ||
    qNorm.includes("olasılık") ||
    qNorm.includes("polinom") ||
    qNorm.includes("integral") ||
    qNorm.includes("türev") ||
    /\d+\s*[\+\-\*\/]\s*\d+/.test(qNorm)
  ) {
    return {
      unit: {
        ...fallbackUnit,
        unitId: 9005,
        grade: 10,
        gradeName: "Matematik",
        subject: "Matematik",
        title: "Matematiksel Muhakeme, Örüntüler ve Fonksiyonlar",
        description:
          "Sayı örüntüleri, cebirsel ilişkiler, denklem çözümü ve analitik muhakeme.",
        keyConcepts: "Örüntü Kuralı, Değişim Oranı, Denklem, Fonksiyon",
        outcomes: [
          {
            code: "MAT.ANALİZ.1",
            title:
              "Verilen matematiksel ilişkilerden hareketle genel kuralı ve bilinmeyeni bulabilme",
            processComponents: [
              "a) Verilen sayısal veriler arasındaki artış/değişim kuralını tespit eder.",
              "b) Cebirsel modeli kurarak istenen adımı hesaplar.",
            ],
          },
        ],
        teachingApplications: [],
      },
      outcomeCode: "MAT.ANALİZ.1",
    };
  }

  if (
    qNorm.includes("atom") ||
    qNorm.includes("periyodik") ||
    qNorm.includes("mol") ||
    qNorm.includes("tepkime") ||
    qNorm.includes("asit") ||
    qNorm.includes("baz") ||
    qNorm.includes("bileşik") ||
    qNorm.includes("elektron")
  ) {
    return {
      unit: {
        ...fallbackUnit,
        unitId: 9006,
        grade: 11,
        gradeName: "Kimya",
        subject: "Kimya",
        title: "Atom Yapısı ve Kimyasal Tepkimeler",
        description:
          "Atom modelleri, kimyasal bağlar, madde etkileşimleri ve tepkime denklemleri.",
        keyConcepts: "Atom, Elektron Dizilimi, Kimyasal Bağ, Tepkime, Mol",
        outcomes: [
          {
            code: "KİM.11.1",
            title: "Kimyasal türler arası etkileşimleri ve tepkimeleri yorumlayabilme",
            processComponents: [
              "a) Tanecik yapısını ve elektron alışverişini belirler.",
              "b) Kimyasal değişimin korunum ilkelerini uygular.",
            ],
          },
        ],
        teachingApplications: [],
      },
      outcomeCode: "KİM.11.1",
    };
  }

  const firstCode =
    fallbackUnit.outcomes?.find((o) => !o.code.startsWith("KAZ."))?.code ||
    fallbackUnit.outcomes?.[0]?.code ||
    "GENEL.1";
  return { unit: fallbackUnit, outcomeCode: firstCode };
}

/**
 * Soru metnini derinlemesine analiz ederek
 * hem Görsel Anlatım (Video Animasyon, Avatar, Şema, Harita, Grafik) hem de
 * Proaktif/Reaktif Çözüm için soruya özel içerik üretir.
 */
export function analyzeQuestionDeeply(
  rawQuestion: string,
  fallbackUnit: TymmUnitDetail,
  fallbackOutcomeCode: string
): DeepQuestionAnalysis {
  const autoDetected = detectCurriculumInBackground(rawQuestion, fallbackUnit);
  const unit = rawQuestion?.trim() ? autoDetected.unit : fallbackUnit;
  const selectedOutcomeCode = rawQuestion?.trim()
    ? autoDetected.outcomeCode
    : fallbackOutcomeCode;

  const qText = (rawQuestion || "").trim();
  const qNorm = normalizeTr(qText);
  const subjNorm = normalizeTr(unit.subject);
  const unitTitleNorm = normalizeTr(unit.title);
  const codeUpper = (
    selectedOutcomeCode ||
    unit.outcomes?.[0]?.code ||
    ""
  ).toUpperCase();

  const validOutcomes = (unit.outcomes || []).filter(
    (o) => o.code && !o.code.startsWith("KAZ.")
  );
  const activeOutcome =
    validOutcomes.find((o) => o.code === selectedOutcomeCode) ||
    validOutcomes[0] ||
    unit.outcomes?.[0] || {
      code: selectedOutcomeCode || `ÜNİTE-${unit.unitId}`,
      title: unit.title,
      processComponents: [],
    };

  const options = parseOptionsFromText(qText);
  const isMultipleChoice = options.length > 0;

  // =========================================================================
  // 1. ÖZEL SENARYO: BİYOLOJİ — HÜCRE BÖLÜNMESİ, EŞEYSİZ/EŞEYLİ ÜREME VE G0 EVRESİ
  // =========================================================================
  if (
    qNorm.includes("hücre bölünmesi") ||
    qNorm.includes("mitoz") ||
    qNorm.includes("mayoz") ||
    qNorm.includes("eşeysiz") ||
    qNorm.includes("eşeyli") ||
    qNorm.includes("g_0") ||
    qNorm.includes("g0") ||
    qNorm.includes("hidra") ||
    qNorm.includes("nöron") ||
    qNorm.includes("somatik") ||
    qNorm.includes("hücre döngüsü") ||
    codeUpper.startsWith("BİY.12.1") ||
    codeUpper.startsWith("BIY.12.1") ||
    unitTitleNorm.includes("hücre bölünmesi") ||
    unitTitleNorm.includes("üreme")
  ) {
    const isHydraMultiPart =
      qNorm.includes("hidra") ||
      qNorm.includes("enerji maliyeti") ||
      qNorm.includes("g_0") ||
      qNorm.includes("g0") ||
      qNorm.includes("nöron") ||
      qNorm.includes("araştırmacının");

    const subQuestions: SubQuestionItem[] = isHydraMultiPart
      ? [
          {
            index: 1,
            title: "1. Evrimsel ve Enerjetik Analiz (Eşeysiz → Eşeyli Geçiş)",
            prompt:
              "Optimum şartlarda (ilkbahar/yaz) neden eşeysiz üreme tercih edilirken, sonbahar stresinde eşeyli üremeye geçilir? (Enerji maliyeti, zaman ve uyum kararlılığı)",
            proactiveHint:
              "Optimum ve sabit ortamda mevcut genotip zaten çevreye tam uyumludur (**uyum kararlılığı**). Eşeysiz üremede eş bulma ve gamet üretimi olmadığı için **enerji maliyeti çok düşüktür** ve **zaman** açısından hızla kolonileşme sağlar.",
            socraticQuestion:
              "Peki sonbaharda sıcaklık düşüp besin kıtlığı başladığında (stres ortamında) klon bireyler neden dezavantajlı hale gelir ve canlı yüksek enerji maliyetine rağmen **eşeyli üremeye** geçer?",
            reactiveAnswer:
              "1. Evrimsel ve Enerjetik Analiz: Optimum şartlarda (ilkbahar/yaz) çevre koşulları sabit ve elverişli olduğundan, mevcut başarılı genotipin bozulmadan korunması ('uyum/adaptasyon kararlılığı') avantajlıdır. Eşeysiz üreme (tomurcuklanma/partenogenez); gamet üretimi, kur yapma, eş bulma ve döllenme süreçlerini gerektirmediği için 'enerji maliyeti' çok düşüktür ve 'zaman' açısından birim sürede geometrik birey artışı sağlar. Ancak sonbaharda soğuk, kuraklık ve besin kıtlığı gibi stres faktörleri belirdiğinde, genetik olarak aynı olan klonların tamamı yok olma riskiyle karşılaşır; bu yüzden yüksek enerji ve zaman maliyetine rağmen genetik rekombinasyon (kalıtsal çeşitlilik) sağlayarak yeni ortama uyum (adaptasyon) şansını artıran eşeyli üremeye geçiş yapılır.",
          },
          {
            index: 2,
            title:
              "2. Hücresel ve Bireysel Düzey Kıyaslaması (Hipotez Çürütme)",
            prompt:
              "'Hücre bölünmesi tüm canlılarda üremeyi, üreme ise tüm bireylerin hayatta kalmasını sağlar' hipotezindeki iki temel bilimsel hata nedir?",
            proactiveHint:
              "Önermeyi ikiye bölelim:\n• **1. İddia:** *'Hücre bölünmesi tüm canlılarda üremeyi sağlar'* → Amip (tek hücreli) ile İnsanı (çok hücreli, karaciğer/deri hücresi mitozu) karşılaştır.\n• **2. İddia:** *'Üreme tüm bireylerin hayatta kalmasını sağlar'* → Üremeyen bir birey ölür mü?",
            socraticQuestion:
              "Çok hücreli bir canlıda (örneğin insanda) somatik hücrelerin mitoz bölünmesi üremeyi değil neyi sağlar? Ve üreme bireyin hayatını mı yoksa **türün (neslin)** devamını mı korur?",
            reactiveAnswer:
              "2. Hücresel ve Bireysel Düzey Kıyaslaması (2 Bilimsel Hatanın Çürütülmesi):\n• 1. Hata ('Hücre bölünmesi tüm canlılarda üremeyi sağlar' yanılgısı): Bu ifade yalnızca amip, öglena, paramesyum, bakteri gibi TEK HÜCRELİ canlılar için doğrudur (bölünme birey sayısını artırır). Ancak insan, memeli ve gelişmiş bitkiler gibi ÇOK HÜCRELİ canlılarda vücut (somatik) hücrelerinin mitoz bölünmesi üremeyi değil; BÜYÜME, GELİŞME ve DOKU ONARIMINI (rejenerasyon) sağlar.\n• 2. Hata ('Üreme tüm bireylerin hayatta kalmasını sağlar' yanılgısı): Üreme, tekil bir bireyin kendi metabolik yaşamını sürdürmesi (hayatta kalması) için zorunlu bir fizyolojik olay değildir (kısır veya üremeyen bir birey yaşamaya devam eder). Üreme bireyin hayatta kalmasını değil, TÜRÜN (NESLİN) DEVAMLILIĞINI ve genlerin gelecek kuşaklara aktarılmasını sağlar.",
          },
          {
            index: 3,
            title:
              "3. Hücre Döngüsü Sorgulaması (G₀ Evresi & Organizmal Bütünlük)",
            prompt:
              "Nöron ve retina gibi hücrelerin G₀ evresinde kalmayıp sürekli mitoz geçirmesi organizmanın bütünlüğü açısından nasıl bir dezavantaj yaratırdı?",
            proactiveHint:
              "Olgunlaşmış sinir hücreleri (**nöronlar**) binlerce sinaptik bağlantıyla hafıza ve sinyal ağlarını kurar; ayrıca sentrozomlarını kaybederek **$G_0$ durgunluk evresine** geçerler.",
            socraticQuestion:
              "Eğer beynimizdeki nöronlar veya retina hücreleri sürekli mitoz bölünme geçirseydi, hücre iskeleti yeniden düzenlenirken **mevcut sinaptik bağlantılar (hafıza/refleks ağları)** ve **doku kontrolü (tümörleşme riski)** bundan nasıl etkilenirdi?",
            reactiveAnswer:
              "3. Hücre Döngüsü Sorgulaması (G₀ Evresi ve Organizmal Bütünlük): Olgunlaşmış nöronlar, retina hücreleri ve çizgili kas hücreleri yüksek derecede farklılaşmış (özelleşmiş) hücrelerdir ve hücre döngüsünün G₁ noktasından çıkarak G₀ (durgunluk) evresinde kalırlar. Eğer bu hücreler sürekli mitoz geçirseydi:\n1) Bölünme sırasında akson ve dendrit uzantıları geri çekileceği için kurulmuş olan SİNAPTİK AĞLAR, HAFIZA İZLERİ ve SİNİRSEL İLETİM BÜTÜNLÜĞÜ sürekli kopar, merkezi sinir sistemi işlev yapamazdı.\n2) Sabit hacimli kafatası ve göz küresi içinde hücre sayısının sürekli artması doku mimarisini bozar, hücre döngüsü kontrol noktalarının (G₁, G₂, M) aşılmasıyla KONTROLSÜZ HÜCRE BÖLÜNMESİ (TÜMÖR / KANSER) riskini ortaya çıkarırdı.",
          },
        ]
      : [
          {
            index: 1,
            title: "1. Hücre Bölünmesinin Nedenleri (Hacim/Yüzey Oranı)",
            prompt:
              "Hücre büyüdükçe hacim ($r^3$) yüzey alanından ($r^2$) daha hızlı artar ve çekirdek yönetimi zorlaşır.",
            proactiveHint:
              "Hücre büyüdükçe zar yüzeyi madde alışverişine yetmez ($V/S$ oranı bozulur) ve çekirdek/sitoplazma oranı küçülür.",
            socraticQuestion:
              "Büyüyen bir hücre, yüzey/hacim dengesini yeniden kurmak ve çekirdek kontrolünü kolaylaştırmak için hangi olayı gerçekleştirir?",
            reactiveAnswer:
              "1. Hücre Bölünmesinin Nedenleri: Hücre büyüdükçe hacmi (r³), zar yüzey alanına (r²) göre çok daha hızlı artar. Yüzey alanı madde alışverişinde yetersiz kalır ve çekirdeğin sitoplazmayı yönetmesi güçleşir; çekirdek bölünme emri verir.",
          },
          {
            index: 2,
            title: "2. Tek Hücreli vs Çok Hücreli Canlılarda Bölünmenin Önemi",
            prompt:
              "Hücre bölünmesi tek hücrelilerde üremeyi, çok hücrelilerde büyüme, gelişme ve doku onarımını sağlar.",
            proactiveHint:
              "Tek hücreli amipte 1 hücre 2 yeni birey demektir; çok hücreli insanda ise mitoz doku hücrelerinin sayısını artırır.",
            socraticQuestion:
              "Buna göre hücre bölünmesi hangi canlı grubunda doğrudan 'üreme', hangisinde 'büyüme ve onarım' sağlar?",
            reactiveAnswer:
              "2. Canlılar İçin Önemi: Tek hücreli canlılarda (amip, bakteri) hücre bölünmesi doğrudan ÜREMEYİ (birey sayısı artışını) sağlarken; çok hücreli canlılarda (insan, bitki) somatik mitoz BÜYÜME, GELİŞME ve DOKU ONARIMINI sağlar.",
          },
          {
            index: 3,
            title: "3. Hücre Döngüsü (İnterfaz, Mitotik Evre ve G₀ Kontrolü)",
            prompt:
              "G₁, S, G₂ evrelerinde DNA eşlenir ve hazırlık yapılır; nöron ve çizgili kas hücreleri G₀ evresinde kalır.",
            proactiveHint:
              "İnterfazın S evresinde DNA replikasyonu gerçekleşir; G₁, G₂ ve M kontrol noktaları hatasız bölünmeyi denetler.",
            socraticQuestion:
              "Kontrol noktalarındaki 'Dur / Devam Et' sinyalleri bozulursa organizmada hangi patolojik durum ortaya çıkar?",
            reactiveAnswer:
              "3. Hücre Döngüsü ve Kontrolü: Hücre döngüsü G₁, G₂ ve M kontrol noktalarında siklin ve CDK proteinleriyle denetlenir. İleri derecede özelleşmiş nöronlar G₀ evresinde kalırken, kontrolün bozulması kontrolsüz hücre bölünmesine (kanser) yol açar.",
          },
        ];

    return {
      sceneKind: "biology-cell",
      sceneTitle:
        "🧬 Hücre Döngüsü (G₁-S-G₂-M & G₀), Mitoz ve Eşeysiz/Eşeyli Üreme Stratejileri Animasyonu",
      isMultipleChoice,
      options,
      detectedKeywords: [
        "Eşeysiz vs Eşeyli Üreme",
        "Enerji Maliyeti & Adaptasyon",
        "Tek vs Çok Hücreli Bölünme",
        "G₀ Evresi (Nöron & Kas)",
        "Hücre Döngüsü Kontrolü",
      ],
      contextSummary: isHydraMultiPart
        ? "Soruda 3 temel biyolojik problem analiz edilmektedir: (1) Hidra ve yaprak bitlerinde optimum şartlarda eşeysiz, stres şartlarında eşeyli üremeye geçişin enerji/zaman/adaptasyon analizi, (2) Hücre bölünmesi ve üreme hakkındaki hatalı hipotezin tek/çok hücreli canlılarla çürütülmesi, (3) Nöron ve retina hücrelerinin G₀ evresinde kalmasının organizmal bütünlük için önemi."
        : `${unit.gradeName} • ${unit.subject} (${activeOutcome.code}): ${activeOutcome.title}`,
      subQuestions,
      storySteps: [
        {
          title: "1. Eşeysiz vs Eşeyli Üreme Stratejisi",
          desc: "Optimum ortamda düşük enerji maliyeti ve hızlı artış için EŞEYSİZ; stres ortamında genetik çeşitlilik ve adaptasyon için EŞEYLİ üreme seçilir.",
          badge: "Evrimsel & Enerjetik Analiz",
          highlightTag: "strategy",
        },
        {
          title: "2. Tek vs Çok Hücrelide Bölünme & Üreme",
          desc: "Tek hücrelide bölünme = Üreme. Çok hücrelide somatik mitoz = Büyüme/Onarım. Üreme bireyin yaşamı için değil, NESLİN devamı için şarttır!",
          badge: "Hipotez Çürütme (2 Hata)",
          highlightTag: "hypothesis",
        },
        {
          title: "3. Hücre Döngüsü & G₀ Evresi (Nöron/Kas)",
          desc: "Nöron, retina ve çizgili kas hücreleri G₀ evresinde kalır. Sürekli bölünselerdi sinaptik hafıza ağları kopar ve doku mimarisi bozulurdu.",
          badge: "G₀ & Sinaptik Bütünlük",
          highlightTag: "g0",
        },
        {
          title: "4. Döngü Kontrolü & Tam Sentez",
          desc: "G₁, G₂ ve M kontrol noktaları somatik bölünmeyi sınırlar; kontrolsüz bölünme tümör/kanser oluşturur. Tüm öncüller sentezlenir.",
          badge: "Tam Çözüm Sentezi",
          highlightTag: "synthesis",
        },
      ],
      proactiveStep1Hint:
        `Sorun **3 ana biyolojik sorgulamadan** oluşuyor. Adım adım gidelim:\n\n` +
        `🔹 **1. Boyut (Evrimsel & Enerjetik Analiz):** Hidra ve yaprak bitleri ilkbahar/yazın (**optimum ve sabit ortamda**) eş arama ve gamet üretme zahmeti olmayan **eşeysiz üremeyi** seçerek **enerji maliyetini düşürür** ve **zamandan kazanıp** hızla çoğalır.\n` +
        `🔹 **2. Boyut (Hipotezdeki 2 Hata):** Çok hücrelilerde (insanda) mitoz bölünme üremeyi değil **büyüme ve onarımı** sağlar; ayrıca üreme bireyin hayatta kalması için değil **türün (neslin) devamı** için gereklidir.\n` +
        `🔹 **3. Boyut ($G_0$ Evresi — Nöron & Retina):** Sinir hücreleri bölünürse kurdukları **sinaptik ağlar ve hafıza bağlantıları** kopar.`,
      proactiveStep1Question:
        `Önce **1. ve 2. Boyuttan** başlayalım: Sonbaharda çevre stresli hale geldiğinde (soğuk, besin kıtlığı) neden yüksek enerji maliyetine rağmen **eşeyli üremeye** geçilir? Ve araştırmacının *"Üreme tüm bireylerin hayatta kalmasını sağlar"* iddiası neden yanlıştır?`,
      proactiveStep1QuickReplies: [
        "Stres ortamında genetik çeşitlilik (adaptasyon) için eşeyli üremeye geçilir",
        "Çok hücrelilerde mitoz büyüme/onarım sağlar; üreme bireyin değil neslin devamı içindir",
        "Nöronlar G₀'da kalmasaydı sinaptik ağlar kopar ve kontrolsüz bölünme (tümör) olurdu",
        "⚡ Hızlı Çöz (3 Alt Sorunun Tam Çözümünü Göster)",
      ],
      reactiveCorrectTitle: isHydraMultiPart
        ? "3 Alt Problemin Bilimsel Gerekçeli Tam Çözümü (BİY.12.1.1)"
        : `${activeOutcome.code} — ${activeOutcome.title}`,
      reactiveSteps: subQuestions.map((sq) => sq.reactiveAnswer),
      distractorOrMisconceptionWarning:
        "En Sık Yapılan 2 Kavram Yanılgısı:\n1) 'Mitoz bölünme tüm canlılarda üreme sağlar' yanılgısı (Çok hücrelilerde somatik mitoz yalnızca büyüme, gelişme ve doku onarımı sağlar).\n2) 'Üreme canlının kendi yaşamını sürdürmesi için zorunludur' yanılgısı (Üreme bireyin yaşaması için değil, türün neslini sürdürmesi için gereklidir).",
      examTip:
        "AYT / Yazılı Şifresi: 1) Sabit/Optimum Ortam = Eşeysiz (Düşük enerji, hızlı artış, sabit uyum) | Değişken/Stresli Ortam = Eşeyli (Genetik çeşitlilik, yüksek adaptasyon). 2) Nöron/Retina/Çizgili Kas = G₀ evresi (Sinaptik ağların ve doku mimarisinin korunması).",
    };
  }

  // =========================================================================
  // 2. ÖZEL SENARYO: GÜNEŞ SİSTEMİ, GEZEGENLER VE TUTULMALAR (FB.6.1)
  // =========================================================================
  if (
    qNorm.includes("gezegen") ||
    qNorm.includes("güneş sistemi") ||
    qNorm.includes("merkür") ||
    qNorm.includes("jüpiter") ||
    qNorm.includes("asteroit") ||
    qNorm.includes("tutulma") ||
    codeUpper.startsWith("FB.6.1") ||
    unitTitleNorm.includes("güneş sistemi")
  ) {
    const isEclipse = qNorm.includes("tutulma");
    return {
      sceneKind: "solar-system",
      sceneTitle: isEclipse
        ? "🌑 Güneş ve Ay Tutulmaları Doğrultu Animasyonu"
        : "🪐 Güneş Sistemi ve Gezegenlerin Dizilimi Animasyonu",
      isMultipleChoice,
      options,
      detectedKeywords: isEclipse
        ? ["Güneş Tutulması (GÜ-AY-DÜ)", "Ay Tutulması (GÜ-DÜ-AY)", "Yeni Ay vs Dolunay", "Doğrusal Yayılma"]
        : ["İç (Karasal) Gezegenler", "Asteroit Kuşağı", "Dış (Gazsal) Gezegenler", "Büyüklük & Yakınlık Sırası"],
      contextSummary: isEclipse
        ? "Güneş ve Ay tutulmalarında Güneş, Dünya ve Ay'ın aynı doğrultuda dizilimi, Ay'ın evreleri ve gölge oluşumu incelenmektedir."
        : "Güneş sistemindeki 8 gezegenin Güneş'e yakınlık sırası (Merkür → Venüs → Dünya → Mars → Jüpiter → Satürn → Uranüs → Neptün), karasal ve gazsal özellikleri incelenmektedir.",
      subQuestions: [
        {
          index: 1,
          title: "1. İç (Karasal) Gezegenler (1-4)",
          prompt: "Güneş'e en yakın ilk 4 gezegen: Merkür, Venüs, Dünya ve Mars.",
          proactiveHint: "İlk 4 gezegen kayalık yapılıdır ve halkaları yoktur.",
          socraticQuestion: "Güneş'e en yakın ilk 4 gezegenin sırası nedir?",
          reactiveAnswer:
            "1. Adım (İç / Karasal Gezegenler — İlk 4): Güneş'e en yakından başlayarak ilk 4 gezegen sırasıyla 1. Merkür, 2. Venüs, 3. Dünya ve 4. Mars'tır. Yüzeyleri sert kayaç yapılıdır, halkaları yoktur.",
        },
        {
          index: 2,
          title: "2. Asteroit Kuşağı ve Dış (Gazsal) Gezegenler (5-8)",
          prompt: "Mars ile Jüpiter arasında Asteroit Kuşağı bulunur; ardından Jüpiter, Satürn, Uranüs ve Neptün gelir.",
          proactiveHint: "Son 4 gezegen gazsal yapılıdır, hepsinin halkası ve çok sayıda uydusu vardır.",
          socraticQuestion: "Asteroit Kuşağı'ndan sonra gelen 4 gazsal gezegenin sırası nedir?",
          reactiveAnswer:
            "2. Adım (Asteroit Kuşağı ve Dış / Gazsal Gezegenler — Son 4): Mars ile Jüpiter arasında Asteroit Kuşağı yer alır. Dış 4 gezegen sırasıyla 5. Jüpiter, 6. Satürn, 7. Uranüs ve 8. Neptün'dür.",
        },
        {
          index: 3,
          title: "3. Büyüklük Sıralaması",
          prompt: "En büyük gezegen Jüpiter, en küçük gezegen Merkür'dür.",
          proactiveHint: "Büyükten küçüğe: Jüpiter > Satürn > Uranüs > Neptün > Dünya > Venüs > Mars > Merkür.",
          socraticQuestion: "En büyük ve en küçük gezegen hangileridir?",
          reactiveAnswer:
            "3. Adım (Büyüklükten Küçüğe Sıralama): Jüpiter > Satürn > Uranüs > Neptün > Dünya > Venüs > Mars > Merkür.",
        },
      ],
      storySteps: [
        {
          title: "1. Güneş'e Yakınlık Sırasıyla 8 Gezegen",
          desc: "Güneş'e en yakından uzağa doğru: Merkür → Venüs → Dünya → Mars → Jüpiter → Satürn → Uranüs → Neptün.",
          badge: "Gezegen Dizilimi",
        },
        {
          title: "2. İç (Karasal) Gezegenler: İlk 4 Gezegen",
          desc: "Merkür, Venüs, Dünya ve Mars kayalık yapıdadır, halkaları yoktur. Dünya ve Mars'ın doğal uydusu vardır.",
          badge: "Karasal Gezegenler",
        },
        {
          title: "3. Asteroit Kuşağı & Dış (Gazsal) Gezegenler",
          desc: "Mars ile Jüpiter arasında Asteroit Kuşağı bulunur. Jüpiter, Satürn, Uranüs ve Neptün gazsaldır; hepsinin halkası ve çok sayıda uydusu vardır.",
          badge: "Gazsal Gezegenler",
        },
        {
          title: "4. Büyüklük Sıralaması & Kodlama İpucu",
          desc: "En büyük gezegen Jüpiter, en küçük Merkür'dür. Yakınlık kodlaması: 'Meraklı Vedat Dünkü Maçta Jale'ye Sordu Umut Nasıldı?'",
          badge: "Sentez & Kodlama",
        },
      ],
      proactiveStep1Hint:
        "Güneş sistemindeki **8 gezegeni** Güneş'e yakınlık sırasına göre iki gruba ayırırız:\n1) **İç (Karasal/Kayaç) Gezegenler:** Güneş'e en yakın ilk 4 gezegen.\n2) **Dış (Gazsal/Dev) Gezegenler:** **Asteroit Kuşağı**'ndan (Mars ile Jüpiter arasından) sonra gelen son 4 gezegen.\n💡 *Baş harf şifresi:* **M**eraklı **V**edat **D**ünkü **M**açta **J**ale'ye **S**ordu **U**mut **N**asılsın? (**M - V - D - M - J - S - U - N**)",
      proactiveStep1Question:
        "Bu baş harf şifresine (**M-V-D-M** ve **J-S-U-N**) göre Güneş'e en yakın ilk 4 karasal gezegen ile en uzak 4 gazsal gezegen sırasıyla hangileridir?",
      proactiveStep1QuickReplies: [
        "Merkür, Venüs, Dünya, Mars — Jüpiter, Satürn, Uranüs, Neptün",
        "İlk 4'ü karasal (kayaç), son 4'ü gazsal gezegendir",
        "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
      ],
      reactiveCorrectTitle:
        "Güneş'e Yakınlık Sırası: 1. Merkür → 2. Venüs → 3. Dünya → 4. Mars → [Asteroit Kuşağı] → 5. Jüpiter → 6. Satürn → 7. Uranüs → 8. Neptün",
      reactiveSteps: [
        "1. Adım (İç / Karasal Gezegenler — İlk 4): Güneş'e en yakından başlayarak ilk 4 gezegen sırasıyla Merkür, Venüs, Dünya ve Mars'tır. Yüzeyleri sert kayaç yapılıdır, halkaları yoktur.",
        "2. Adım (Asteroit Kuşağı ve Dış / Gazsal Gezegenler — Son 4): Mars ile Jüpiter arasında Asteroit Kuşağı bulunur. Dış 4 gezegen sırasıyla Jüpiter, Satürn, Uranüs ve Neptün'dür. Tümü gazsal yapılıdır, halkaları ve çok sayıda uydusu vardır.",
        "3. Adım (Büyüklükten Küçüğe Sıralama): Büyükten küçüğe gezegenler: Jüpiter > Satürn > Uranüs > Neptün > Dünya > Venüs > Mars > Merkür şeklindedir.",
      ],
      distractorOrMisconceptionWarning:
        "Sınavlarda en sık yapılan hata Venüs ile Mars'ın veya Uranüs ile Neptün'ün sırasını karıştırmaktır. Ayrıca Plüton 'cüce gezegen' olduğu için 8 gezegen sıralamasına dâhil edilmez.",
      examTip:
        "Pratik Kodlama (Güneş'e Yakınlık Sırası): 'Meraklı (Merkür) Vedat (Venüs) Dünkü (Dünya) Maçta (Mars) Jale'ye (Jüpiter) Sordu (Satürn) Umut (Uranüs) Nasılsın (Neptün)?'",
    };
  }

  // =========================================================================
  // 3. ÖZEL SENARYO: TRABLUSGARP SAVAŞI VE MUSTAFA KEMAL (İTA.12.1.1 / İNKILAP)
  // =========================================================================
  if (
    qNorm.includes("trablusgarp") ||
    qNorm.includes("gazeteci şerif") ||
    qNorm.includes("derne") ||
    qNorm.includes("tobruk") ||
    qNorm.includes("bingazi") ||
    codeUpper.includes("İTA.12.1.1") ||
    codeUpper.includes("ITA.12.1.1")
  ) {
    return {
      sceneKind: "trablusgarp",
      sceneTitle:
        "🗺️ Trablusgarp Savaşı & Mustafa Kemal'in Kişilik Özellikleri Animasyonu",
      isMultipleChoice,
      options,
      detectedKeywords: [
        "Trablusgarp Cephesi",
        "Gazeteci Şerif (Gönüllülük)",
        "Derne • Tobruk • Bingazi",
        "Vatanseverlik & Teşkilatçılık",
      ],
      contextSummary:
        "Osmanlı Hükûmeti'nin Trablusgarp'a karadan ve denizden ordu gönderememesi üzerine Mustafa Kemal'in gizlice bölgeye gidip yerli halkı örgütlemesi incelenmektedir.",
      subQuestions: [
        {
          index: 1,
          title: "1. Kanıt 1: Gönüllü ve Gizlice Cepheye Gitmesi",
          prompt: "Gazeteci Şerif takma adıyla zorunluluğu yokken cepheye gitmesi.",
          proactiveHint: "Tehlikeyi göze alarak vatan toprağını savunmaya koşmak VATANSEVERLİK özelliğidir.",
          socraticQuestion: "Zorunluluğu yokken gönüllü cepheye gitmesi hangi kişilik özelliğini gösterir?",
          reactiveAnswer:
            "1. Adım (Kanıt 1 — Vatanseverlik): Osmanlı Hükûmeti ordu gönderememesine rağmen Mustafa Kemal'in 'gizlice ve Gazeteci Şerif takma adıyla gönüllü olarak Trablusgarp'a gitmesi', vatan toprağını savunma bilincini yani VATANSEVERLİĞİNİ kanıtlar.",
        },
        {
          index: 2,
          title: "2. Kanıt 2: Yerli Halkı Birleştirip Direnişe Geçirmesi",
          prompt: "Derne, Tobruk ve Bingazi'de dağınık halkı İtalyanlara karşı örgütlemesi.",
          proactiveHint: "Dağınık güçleri tek bir amaç etrafında birleştirmek TEŞKİLATÇILIK (Örgütleyicilik) özelliğidir.",
          socraticQuestion: "Yerli halkı bir araya getirip örgütlemesi hangi kişilik özelliğidir?",
          reactiveAnswer:
            "2. Adım (Kanıt 2 — Teşkilatçılık / Örgütleyicilik): Bölgeye gittikten sonra 'yerli halkı İtalyanlara karşı birleştirip örgütlemesi ve Derne, Tobruk, Bingazi'de direnişe geçirmesi' doğrudan TEŞKİLATÇILIK (ÖRGÜTLEYİCİLİK) özelliğidir.",
        },
      ],
      storySteps: [
        {
          title: "1. Jeopolitik Durum & Abluka",
          desc: "İtalya Trablusgarp'a saldırır. İtalyan donanması Akdeniz'i kapatır, İngiliz işgalindeki Mısır ise kara bağlantısını keser.",
          badge: "Tarihsel Arka Plan",
        },
        {
          title: "2. Gizli Yolculuk → Vatanseverlik",
          desc: "Mustafa Kemal, resmi zorunluluğu olmamasına rağmen 'Gazeteci Şerif' takma adıyla gizlice ve gönüllü olarak cepheye gider.",
          badge: "Kanıt 1: Vatanseverlik",
        },
        {
          title: "3. Halkı Örgütleme → Teşkilatçılık",
          desc: "Derne, Tobruk ve Bingazi'de dağınık yerel halkı birleştirip İtalyanlara karşı direniş cephesi oluşturur.",
          badge: "Kanıt 2: Teşkilatçılık",
        },
        {
          title: "4. Sentez & Doğru Şık",
          desc: "Gönüllü gitmesi VATANSEVERLİK, yerli halkı direnişe geçirmesi TEŞKİLATÇILIK (Örgütleyicilik) özelliğini kanıtlar.",
          badge: "Sonuç: B Şıkkı",
        },
      ],
      proactiveStep1Hint:
        "Metindeki iki anahtar ifadeye dikkat et:\n1) Ordu gönderilememesine rağmen **gizlice ve gönüllü olarak (Gazeteci Şerif adıyla) vatan toprağını savunmaya gitmesi**,\n2) Derne, Tobruk ve Bingazi'de **yerli halkı İtalyanlara karşı birleştirip örgütlemesi**.",
      proactiveStep1Question:
        "Vatan toprağını tehlikeye rağmen gönüllü savunmak hangi kişilik özelliğidir? Ve dağınık haldeki halkı bir araya getirip **örgütlemek** hangi kavramla eşleşir?",
      proactiveStep1QuickReplies: [
        "Bence doğru cevap B şıkkı (Vatanseverliği ve teşkilatçılığı)",
        "A ve D şıklarını elerim, çünkü inkılapçılıktan bahsedilmiyor",
        "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
      ],
      reactiveCorrectTitle:
        "B Şıkkı: Vatanseverliği ve teşkilatçılığı (örgütleyiciliği)",
      reactiveSteps: [
        "1. Adım (Kanıt 1 — Vatanseverlik): Osmanlı Hükûmeti ordu gönderememesine rağmen Mustafa Kemal'in 'gizlice ve Gazeteci Şerif takma adıyla gönüllü olarak Trablusgarp'a gitmesi', vatan toprağını savunma bilincini yani VATANSEVERLİĞİNİ kanıtlar.",
        "2. Adım (Kanıt 2 — Teşkilatçılık / Örgütleyicilik): Bölgeye gittikten sonra 'yerli halkı İtalyanlara karşı birleştirip örgütlemesi ve Derne, Tobruk, Bingazi'de direnişe geçirmesi' doğrudan TEŞKİLATÇILIK (ÖRGÜTLEYİCİLİK) özelliğidir.",
        "3. Adım (Sonuç): Her iki özelliği bir arada barındıran B seçeneği ('Vatanseverliği ve teşkilatçılığı') doğru cevaptır.",
      ],
      distractorOrMisconceptionWarning:
        "A şıkkındaki 'İnkılapçılık' (yenilikçilik) ve C şıkkındaki 'İleri görüşlülük' (geleceği tahmin etme) Mustafa Kemal'in gerçek özellikleri olsa da bu metinde anlatılan Trablusgarp olayında vurgulanmamıştır.",
      examTip:
        "İnkılap Tarihi Şifreleri: Soruda 'Gönüllü/gizlice cepheye gitme' varsa → VATANSEVERLİK; 'Yerli halkı bir araya getirme / örgütleme' varsa → TEŞKİLATÇILIK işaretlenir!",
    };
  }

  // =========================================================================
  // 4. ÖZEL SENARYO: KÜTLE VE AĞIRLIK (FB.5.2)
  // =========================================================================
  if (
    qNorm.includes("kütle") ||
    qNorm.includes("ağırlık") ||
    qNorm.includes("dinamometre") ||
    qNorm.includes("yerçekimi") ||
    codeUpper.startsWith("FB.5.2") ||
    unitTitleNorm.includes("kuvveti tanıyalım")
  ) {
    return {
      sceneKind: "physics-gravity",
      sceneTitle: "⚖️ Kütle, Yerçekimi İvmesi ve Ağırlık Vektör Animasyonu",
      isMultipleChoice,
      options,
      detectedKeywords: [
        "Kütle (m = Sabit, kg)",
        "Yerçekimi İvmesi (g)",
        "Ağırlık (G = m · g, N)",
        "Eşit Kollu Terazi vs Dinamometre",
      ],
      contextSummary:
        "Farklı gök cisimlerinde (Dünya ve Ay) cismin değişmeyen madde miktarı (kütle) ile yerçekimi kuvvetinin büyüklüğü (ağırlık) arasındaki ilişki incelenmektedir.",
      subQuestions: [
        {
          index: 1,
          title: "1. Kütle (m) Analizi",
          prompt: "Cisim Dünya'dan Ay'a götürüldüğünde madde miktarı (kütle) değişir mi?",
          proactiveHint: "Kütle değişmeyen madde miktarıdır; eşit kollu terazi ile ölçülür ve her yerde aynı kalır.",
          socraticQuestion: "Dünya'da 6 kg olan cismin Ay'daki kütlesi kaç kg olur?",
          reactiveAnswer:
            "1. Adım (Kütle Analizi): Kütle, değişmeyen madde miktarıdır ve eşit kollu terazi ile ölçülür. Cisim Dünya'dan Ay'a götürüldüğünde madde miktarı değişmeyeceği için kütlesi yine 6 kg kalır (A ve D şıkları elenir).",
        },
        {
          index: 2,
          title: "2. Ağırlık (G = m · g) Analizi",
          prompt: "Ay'ın çekim ivmesi Dünya'nın 1/6'sı olduğuna göre ağırlık nasıl değişir?",
          proactiveHint: "Ağırlık (G = m · g) yerçekimi kuvvetidir ve dinamometre ile ölçülür.",
          socraticQuestion: "Dünya'da 60 N gelen cisim Ay'da kaç N gelir?",
          reactiveAnswer:
            "2. Adım (Ağırlık Analizi): Ağırlık, cisme etki eden yer çekimi kuvvetidir (G = m · g) ve dinamometre ile ölçülür. Ay'ın çekim ivmesi Dünya'nın 1/6'sı olduğundan: 60 N ÷ 6 = 10 N bulunur. Doğru cevap B şıkkıdır (6 kg — 10 N).",
        },
      ],
      storySteps: [
        {
          title: "1. Kütle (m): Değişmeyen Madde Miktarı",
          desc: "Cismin içindeki madde miktarıdır. Eşit kollu terazi ile ölçülür; Dünya'da da Ay'da da aynı kalır.",
          badge: "Kütle = Sabit (kg)",
        },
        {
          title: "2. Yerçekimi Alanı (g)",
          desc: "Her gök cismi kütlesi nedeniyle çevresinde bir çekim alanı oluşturur. Gezegenden gezegene değişir.",
          badge: "Çekim İvmesi (m/s²)",
        },
        {
          title: "3. Ağırlık Kuvveti (G = m · g)",
          desc: "Kütleye etki eden yerçekimi kuvvetidir. Vektöreldir, yönü merkeze doğrudur ve dinamometre ile ölçülür.",
          badge: "Ağırlık = Kuvvet (Newton)",
        },
        {
          title: "4. Sentez & Soru Çözümü",
          desc: "Gezegen değiştiğinde kütle (m) sabit kalırken, ağırlık (G) yerçekimi ivmesiyle doğru orantılı değişir.",
          badge: "Kavram Sentezi",
        },
      ],
      proactiveStep1Hint:
        "Soruda cismin **Dünya'dan Ay'a** götürüldüğü söyleniyor. Hatırlayalım: Bir cismin yeri değiştiğinde içindeki **madde miktarı (kütle)** değişir mi, yoksa sadece **yerçekimi kuvveti (ağırlık)** mı değişir?",
      proactiveStep1Question:
        "Dünya'da kütlesi **6 kg** olan bu cismin Ay'daki kütlesi kaç kg olmalıdır? Buna göre hangi iki şıkkı hemen eleyebilirsin?",
      proactiveStep1QuickReplies: [
        "Kütle değişmez (6 kg kalır), A ve D şıklarını elerim",
        "Ay'da ağırlık 1/6'ya düşer, yani 60/6 = 10 N olur (B şıkkı)",
        "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
      ],
      reactiveCorrectTitle: "B Şıkkı (Kütle: 6 kg — Ağırlık: 10 N)",
      reactiveSteps: [
        "1. Adım (Kütle Analizi): Kütle, değişmeyen madde miktarıdır ve eşit kollu terazi ile ölçülür. Cisim Dünya'dan Ay'a götürüldüğünde madde miktarı değişmeyeceği için kütlesi yine 6 kg kalır (A ve D şıkları elenir).",
        "2. Adım (Ağırlık Analizi): Ağırlık, cisme etki eden yer çekimi kuvvetidir (G = m · g) ve dinamometre ile ölçülür. Ay'ın çekim ivmesi Dünya'nın 1/6'sı olduğundan: 60 N ÷ 6 = 10 N bulunur.",
        "3. Adım (Sonuç): Kütle 6 kg, Ağırlık 10 N olduğu için doğru cevap B seçeneğidir.",
      ],
      distractorOrMisconceptionWarning:
        "A şıkkı kütlenin de 1/6 oranında azalacağı yanılgısını (MY-02), C şıkkı ise ağırlığın Ay'da değişmeyeceği yanılgısını ölçen çeldiricilerdir.",
      examTip:
        "Kütle-Ağırlık sorularında ilk iş olarak 'Gezegen değişse de Kütle (kg) SABİT kalır' kuralıyla kütlesi değişen şıkları saniyeler içinde eleyin!",
    };
  }

  // =========================================================================
  // 5. GENEL AKILLI SORU PARÇALAYICI (TÜM DERSLER, ÇOK PARÇALI VEYA ŞIKLI SORULAR)
  // =========================================================================
  let sceneKind: VisualSceneKind = "concept-flow";
  if (subjNorm.includes("matematik") || codeUpper.startsWith("MAT")) {
    sceneKind = "math-visual";
  } else if (subjNorm.includes("kimya") || codeUpper.startsWith("KİM") || codeUpper.startsWith("KIM")) {
    sceneKind = "chemistry-visual";
  } else if (subjNorm.includes("biyoloji") || codeUpper.startsWith("BİY") || codeUpper.startsWith("BIY")) {
    sceneKind = "biology-cell";
  }

  // Soru metnindeki alt başlıkları ("Başlık: ...?" veya "1) ...") veya soru cümlelerini otomatik ayrıştır
  const extractedSubPrompts: Array<{ title: string; body: string }> = [];
  if (qText && !isMultipleChoice) {
    // Örn: "Evrimsel ve Enerjetik Analiz: ...?" gibi "Başlık: Açıklama" kalıplarını yakala
    const colonHeaderRegex =
      /([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü0-9\s\(\)\/\-]{4,48}):\s*([^:]+?(?:\.|!|\?)(?:\s+[^:]+?(?:\.|!|\?))*)/g;
    let m: RegExpExecArray | null;
    while ((m = colonHeaderRegex.exec(qText)) !== null) {
      const hdr = m[1].trim();
      const bdy = m[2].trim();
      if (
        !hdr.toLowerCase().includes("yukarıdaki") &&
        !hdr.toLowerCase().includes("aşağıdaki") &&
        bdy.length > 15
      ) {
        extractedSubPrompts.push({ title: hdr, body: bdy });
      }
    }

    // Eğer Başlık: kalıbı bulunamadıysa soru işareti (?) veya "yorumlayınız/açıklayınız/çürütünüz/bulunuz" içeren cümleleri yakala
    if (extractedSubPrompts.length === 0) {
      const sentences = qText
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 12);
      const actionSentences = sentences.filter((s) => {
        const sn = normalizeTr(s);
        return (
          s.includes("?") ||
          sn.includes("yorumla") ||
          sn.includes("açıkla") ||
          sn.includes("çürüt") ||
          sn.includes("karşılaştır") ||
          sn.includes("bulunuz") ||
          sn.includes("hesapla") ||
          sn.includes("nedir") ||
          sn.includes("nasıl") ||
          sn.includes("neden")
        );
      });

      actionSentences.slice(0, 3).forEach((s, i) => {
        extractedSubPrompts.push({
          title: `${i + 1}. Alt Soru / Analiz Basamağı`,
          body: s,
        });
      });
    }
  }

  const rawConcepts = (unit.keyConcepts || activeOutcome.title || unit.title)
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const keywords =
    rawConcepts.length > 0
      ? rawConcepts.slice(0, 5)
      : [unit.gradeName, unit.subject, activeOutcome.code, unit.title];

  const procComps =
    activeOutcome.processComponents && activeOutcome.processComponents.length > 0
      ? activeOutcome.processComponents
      : [
          `${activeOutcome.title} kapsamındaki temel verileri inceler.`,
          `${unit.title} ilkeleriyle neden-sonuç ilişkisi kurar.`,
          `Ulaşılan çıkarımı bilimsel/akademik gerekçelerle doğrular.`,
        ];

  const subQuestions: SubQuestionItem[] =
    extractedSubPrompts.length > 0
      ? extractedSubPrompts.slice(0, 4).map((sp, i) => {
          const relatedProc = procComps[i] || procComps[0];
          return {
            index: i + 1,
            title: `${i + 1}. ${sp.title}`,
            prompt: sp.body,
            proactiveHint: `"${sp.title}" basamağında **${
              keywords[i % keywords.length] || activeOutcome.title
            }** kavramını ve *${relatedProc}* ölçütünü temel almalısın.`,
            socraticQuestion: `"${sp.body.slice(
              0,
              120
            )}..." sorusunda neden-sonuç ilişkisini kurarken hangi temel kanıtı kullanırsın?`,
            reactiveAnswer: `${i + 1}. Adım (${sp.title}): "${
              sp.body
            }" sorgulamasında ${unit.subject} dersi ${
              activeOutcome.code
            } (${
              activeOutcome.title
            }) kazanımı gereğince; ${relatedProc} Bu doğrultuda temel mekanizma ${
              keywords.slice(0, 3).join(", ")
            } ilkeleri üzerinden doğrudan açıklanır.`,
          };
        })
      : procComps.slice(0, 3).map((pc, i) => ({
          index: i + 1,
          title: `${i + 1}. Analiz Basamağı (${activeOutcome.code})`,
          prompt: pc,
          proactiveHint: `${unit.title} ünitesinde bu basamak için **${
            keywords[i % keywords.length] || activeOutcome.title
          }** kavramına odaklanıyoruz.`,
          socraticQuestion: `Bu basamağı (${pc}) verilen soruya uyguladığımızda ilk çıkarımın ne olur?`,
          reactiveAnswer: `${i + 1}. Adım: ${pc} (${
            unit.description ? unit.description.slice(0, 140) : activeOutcome.title
          })`,
        }));

  // Şıklı soruysa doğru şıkkı puanlayarak bul
  let bestOption: ParsedOption | null = null;
  if (isMultipleChoice) {
    const scored = options.map((opt) => {
      const t = normalizeTr(opt.text);
      let score = 0;
      if (
        t.includes("hiçbir") ||
        t.includes("tesadüf") ||
        t.includes("yoktur") ||
        t.includes("yalnızca tek")
      ) {
        score -= 5;
      }
      if (
        t.includes("ilişki") ||
        t.includes("çıkarım") ||
        t.includes("analiz") ||
        t.includes("değiş") ||
        t.includes("birlikte") ||
        t.includes("artar")
      ) {
        score += 4;
      }
      return { opt, score };
    });
    scored.sort((a, b) => b.score - a.score);
    bestOption = scored[0]?.opt || options[0];
  }

  const storySteps: VisualStoryStep[] =
    extractedSubPrompts.length > 0
      ? [
          ...extractedSubPrompts.slice(0, 3).map((sp, i) => ({
            title: `${i + 1}. ${sp.title}`,
            desc: sp.body,
            badge: `Alt Problem ${i + 1}`,
          })),
          {
            title: `${Math.min(4, extractedSubPrompts.length + 1)}. Kazanım Sentezi (${activeOutcome.code})`,
            desc: `${activeOutcome.title} ilkeleri doğrultusunda tüm alt soruların bilimsel gerekçeleri birleştirilir.`,
            badge: "Tam Sentez",
          },
        ]
      : [
          {
            title: `1. Kazanım Hedefi (${activeOutcome.code})`,
            desc: `${unit.gradeName} • ${unit.subject}: "${activeOutcome.title}"`,
            badge: `${unit.gradeName} • ${activeOutcome.code}`,
          },
          {
            title: "2. Anahtar Kavramlar & Süreç Bileşeni",
            desc: procComps[0] || `Temel kavramlar: ${keywords.join(", ")}`,
            badge: "Kavramsal Çerçeve",
          },
          {
            title: "3. Neden-Sonuç & Kanıt Eşleşmesi",
            desc:
              procComps[1] ||
              unit.description?.slice(0, 150) ||
              "Sorudaki öncüller kazanım ölçütleriyle karşılaştırılır.",
            badge: "Analiz & Muhakeme",
          },
          {
            title: "4. Doğrulama & Çözüm Sentezi",
            desc:
              bestOption
                ? `Çeldirici seçenekler elenerek ${bestOption.letter} seçeneği doğrulanır.`
                : procComps[2] ||
                  "Ulaşılan çıkarım kazanım ölçütleriyle doğrulanır.",
            badge: "Çözüm Sentezi",
          },
        ];

  const proactiveStep1Hint =
    extractedSubPrompts.length > 0
      ? `Gönderdiğin soruyu inceledim; içinde **${extractedSubPrompts.length} temel analiz basamağı** yer alıyor:\n` +
        extractedSubPrompts
          .slice(0, 3)
          .map(
            (sp, i) =>
              `• **${i + 1}. Basamak (${sp.title}):** *${sp.body.slice(
                0,
                110
              )}${sp.body.length > 110 ? "..." : ""}*`
          )
          .join("\n") +
        `\n\n📌 **Kazanım Bağlantısı (\`${activeOutcome.code}\`):** *${activeOutcome.title}* (${procComps[0]})`
      : isMultipleChoice
      ? `Bu soru **${unit.gradeName} • ${unit.subject}** dersi **${activeOutcome.code}** (*${activeOutcome.title}*) kazanımını ölçüyor:\n• **1. Süreç Ölçütü:** ${procComps[0]}\n• **Anahtar Kavramlar:** ${keywords.join(", ")}`
      : `Sorduğun **"${qText.slice(0, 100)}${
          qText.length > 100 ? "..." : ""
        }"** sorusu, **${unit.gradeName} • ${unit.subject}** dersi **${activeOutcome.code}** (*${activeOutcome.title}*) kazanımıyla doğrudan ilişkilidir:\n• **1. İpucu:** ${procComps[0]}\n• **Anahtar Kavramlar:** ${keywords.join(", ")}`;

  const proactiveStep1Question =
    extractedSubPrompts.length > 0
      ? `Önce **1. Basamak (${extractedSubPrompts[0].title})** ile başlayalım: **${
          keywords[0] || activeOutcome.title
        }** ilkesini düşündüğünde bu ilk alt soruya nasıl bir bilimsel gerekçe sunarsın?`
      : isMultipleChoice
      ? `Verilen **${options
          .map((o) => o.letter)
          .join(", ")}** şıklarına baktığında, aşırı genelleme (*"hiçbir zaman", "yalnızca"*) içeren çeldiricileri elersen hangi şık öne çıkıyor?`
      : `Bu ilk ipucundan (**${procComps[0]}**) yola çıkarak sorunun temel neden-sonuç ilişkisini nasıl açıklarsın?`;

  const proactiveStep1QuickReplies =
    extractedSubPrompts.length > 0
      ? [
          `1. Basamak (${extractedSubPrompts[0].title}) için çıkarımım: ${keywords[0]} ilkesine dayanır`,
          `2. Basamak için de ipucu verir misin?`,
          "⚡ Hızlı Çöz (Tüm Basamakların Tam Çözümünü Göster)",
        ]
      : isMultipleChoice && bestOption
      ? [
          `Bence doğru cevap ${bestOption.letter} şıkkı çünkü kazanıma tam uyuyor`,
          "Kesinlik bildiren çeldirici şıkları elerim",
          "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
        ]
      : [
          `${keywords[0] || activeOutcome.title} ilkesinden yola çıkarak açıklayabiliriz`,
          "Bir sonraki süreç adımı için ipucu ver",
          "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
        ];

  return {
    sceneKind,
    sceneTitle: `🎯 ${unit.gradeName} • ${unit.subject} (${activeOutcome.code}) Görsel Konu & Soru Şeması`,
    isMultipleChoice,
    options,
    detectedKeywords: keywords,
    contextSummary:
      qText.length > 0
        ? qText.slice(0, 260) + (qText.length > 260 ? "..." : "")
        : unit.description || `${unit.subject} - ${unit.title}`,
    subQuestions,
    storySteps,
    proactiveStep1Hint,
    proactiveStep1Question,
    proactiveStep1QuickReplies,
    reactiveCorrectTitle: bestOption
      ? `${bestOption.letter} Şıkkı: "${bestOption.text}"`
      : `${activeOutcome.code} — ${activeOutcome.title} Tam Çözümü`,
    reactiveSteps: bestOption
      ? [
          `1. Adım (Soru Kökü ve Kazanım Tespiti): Soru, ${unit.gradeName} ${unit.subject} dersi "${activeOutcome.code} — ${activeOutcome.title}" kazanımını ölçmektedir.`,
          `2. Adım (Süreç Bileşenleri Analizi): ${procComps.join(" ")}`,
          `3. Adım (Doğru Seçeneğin Belirlenmesi): Şıklar incelendiğinde bilimsel ve akademik açıdan kazanımı doğrulayan ifade ${bestOption.letter} seçeneğindeki "${bestOption.text}" yargısıdır.`,
        ]
      : subQuestions.map((sq) => sq.reactiveAnswer),
    distractorOrMisconceptionWarning: `Bu kazanımda (${activeOutcome.code}) en sık yapılan kavram yanılgısı, "${keywords.join(
      ", "
    )}" kavramlarını birbirinden bağımsız düşünmek veya tek bir nedene indirgemektir.`,
    examTip: `"${activeOutcome.title}" sorularında süreç bileşenlerini (${procComps[0]}) temel alın; aşırı genelleme ("her zaman", "hiçbir koşulda") içeren öncülleri doğrudan eleyin.`,
  };
}
