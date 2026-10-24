import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import {
  PlanetId,
  TutorAPIRequest,
  TutorAPIResponse,
} from "@/types/its";
import {
  DEFAULT_TYMM_UNIT,
  MISCONCEPTIONS,
  PLANETS,
} from "@/lib/curriculum-graph";

const SYSTEM_PROMPT = `Sen MEB Türkiye Yüzyılı Maarif Modeli (TYMM) müfredatına hakim "Proaktif Sınav" Sokratik öğretmenisin. Öğrenciye doğrudan cevabı asla verme. JSON formatında { reply, detectedMisconception, updateSimulation: { planet, mass }, bktUpdate, quickReplies } döndür.

PEDAGOJİK KURALLAR:
1. Aktif TYMM ünitesinin Sınıfını, Dersini, Öğrenme Çıktılarını (outcomes), Süreç Bileşenlerini (a, b, c), Anahtar Kavramlarını, Öğrenme-Öğretme Yaşantılarını ve Zenginleştirme bilgilerini rehberliğinde aktif olarak kullan.
2. Öğrenciye doğrudan bilgi anlatımı veya hazır cevap VERME. Onu düşündüren, süreç bileşenlerini adım adım keşfettiren Sokratik sınav soruları sor.
3. Eğer aktif ünite Kuvvet/Kütle/Ağırlık ile ilgiliyse kavram yanılgılarını ("MY-01", "MY-02", "MY-03", "MY-04") tespit et ve "updateSimulation" ile tahtayı güncelle. Farklı bir ders/ünite seçiliyse (Matematik, Türkçe, Tarih, Kimya, Biyoloji vb.) o dersin kazanımlarına odaklan ve "updateSimulation" için null döndür.
4. "bktUpdate" alanında öğrencinin yanıtının bilimsel/akademik doğruluğuna göre aktif ünitenin öğrenme çıktısı kodunu kullanarak değerlendir.
5. Matematiksel ve bilimsel ifadelerde LaTeX formatı ($...$) kullanabilirsin.`;

function buildGeneralTymmUnitResponse(body: TutorAPIRequest): TutorAPIResponse {
  const unit = body.activeUnit || DEFAULT_TYMM_UNIT;
  const text = (body.message || "").toLowerCase();
  const validOutcomes = (unit.outcomes || []).filter(
    (o) => o.code && !o.code.startsWith("KAZ.")
  );
  const outcomesList =
    validOutcomes.length > 0 ? validOutcomes : unit.outcomes || [];
  const firstOutcome = outcomesList[0] || {
    code: `ÜNİTE-${unit.unitId}`,
    title: unit.title,
    processComponents: [],
  };

  const concepts = (unit.keyConcepts || "")
    .split(/[,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  // 1. Zenginleştirme / Üst Düzey Soru İsteği
  if (
    text.includes("zenginleştirme") ||
    text.includes("farklılaştırma") ||
    text.includes("üst düzey")
  ) {
    const enrich =
      unit.enrichment?.[0] ||
      unit.teachingApplications?.[0] ||
      unit.description ||
      `${unit.title} kapsamında derinlemesine analiz.`;

    return {
      reply: `🌟 **TYMM Üst Düzey (Zenginleştirme) Sınav Senaryosu (${unit.gradeName} • ${unit.subject}):**\n\n> ${enrich}\n\nBu bağlamı dikkate aldığında, **${firstOutcome.code}** (*${firstOutcome.title}*) çıktısındaki temel ilkeyi günlük yaşamdan özgün bir örnekle nasıl kanıtlarsın?`,
      detectedMisconception: null,
      updateSimulation: null,
      bktUpdate: null,
      quickReplies: [
        `${concepts[0] || "Temel kavram"} üzerinden bir örnek verebilirim`,
        `${firstOutcome.code} süreç bileşenlerini adım adım inceleyelim`,
        "Bana bir ipucu verir misin?",
      ],
      source: "socratic-engine",
    };
  }

  // 2. Belirli bir öğrenme çıktısı kodu tıklandıysa / sorulduysa
  const matchedOutcome = outcomesList.find((o) =>
    text.includes(o.code.toLowerCase())
  );
  if (matchedOutcome) {
    const pcs =
      matchedOutcome.processComponents &&
      matchedOutcome.processComponents.length > 0
        ? matchedOutcome.processComponents.map((p) => `- ${p}`).join("\n")
        : `- ${matchedOutcome.title}`;

    const firstPc =
      matchedOutcome.processComponents?.[0] || matchedOutcome.title;

    return {
      reply: `🎯 **Proaktif Sınav Odak Noktası: \`${matchedOutcome.code}\`**\n**${matchedOutcome.title}**\n\n**TYMM Süreç Bileşenlerimiz:**\n${pcs}\n\nİlk adımımız olan **"${firstPc}"** bileşeninden başlayalım: Bu durumu kendi cümlelerinle nasıl tanımlarsın ve hangi anahtar kavramlarla (${concepts
        .slice(0, 3)
        .join(", ")}) ilişkilendirirsin?`,
      detectedMisconception: null,
      updateSimulation: null,
      bktUpdate: null,
      quickReplies: [
        `${concepts[0] || "Kavram"} ile doğrudan ilişkilidir çünkü...`,
        "Günlük hayattan bir örnekle açıklayabilirim.",
        "Bu süreç bileşeni için küçük bir ipucu ver.",
      ],
      source: "socratic-engine",
    };
  }

  // 3. Öğrenci bir açıklama / çıkarım yazdıysa (BKT Değerlendirmesi)
  const mentionedConcept = concepts.find(
    (c) => c.length > 2 && text.includes(c.toLowerCase())
  );
  const isThoughtfulAnswer =
    text.length > 18 &&
    !text.endsWith("?") &&
    (Boolean(mentionedConcept) ||
      text.includes("çünkü") ||
      text.includes("bağlı") ||
      text.includes("ilişki") ||
      text.includes("örnek") ||
      text.includes("sonuç"));

  if (isThoughtfulAnswer) {
    const nextOutcome =
      outcomesList[Math.min(1, outcomesList.length - 1)] || firstOutcome;
    return {
      reply: `👏 **Harika bir çıkarım!** Yanıtında **${
        mentionedConcept || unit.title
      }** bağlamını doğru kurguladın ve **\`${
        firstOutcome.code
      }\`** çıktısındaki ustalığını yükselttin.\n\nŞimdi bir sonraki süreç bileşenine geçelim (**\`${
        nextOutcome.code
      }\` — ${nextOutcome.title}**):\n${
        nextOutcome.processComponents?.[0]
          ? `*${nextOutcome.processComponents[0]}*`
          : ""
      }\n\nSence bu iki durum arasındaki en temel fark veya örüntü nedir?`,
      detectedMisconception: null,
      updateSimulation: null,
      bktUpdate: {
        skillId: firstOutcome.code,
        isCorrect: true,
        reason: `Öğrenci ${unit.title} (${firstOutcome.code}) kapsamında doğru kavramsal bağlantı kurdu.`,
      },
      quickReplies: [
        ...(outcomesList
          .slice(0, 2)
          .map((o) => `${o.code} çıktısından yeni soru sor`)),
        "Zenginleştirme (Farklılaştırma) sorusu sor!",
      ],
      source: "socratic-engine",
    };
  }

  // 4. Varsayılan: Ünitenin ilk öğrenme çıktısı ve anahtar kavramı üzerinden Sokratik sınav sorusu
  const targetConcept = concepts[0] || unit.title;
  const teachingHint =
    unit.teachingApplications?.[0]?.slice(0, 240) ||
    unit.description ||
    unit.title;

  return {
    reply: `📘 **${unit.gradeName} • ${unit.subject} — ${unit.title}**\n\nTYMM Öğrenme-Öğretme çerçevesine göre:\n> *${teachingHint}...*\n\n**Sokratik Sınav Sorumuz (\`${firstOutcome.code}\`):**\n**"${targetConcept}"** kavramını düşündüğünde, *${firstOutcome.title}* sürecinde gözlemlememiz gereken en önemli özellik sence nedir?`,
    detectedMisconception: null,
    updateSimulation: null,
    bktUpdate: null,
    quickReplies: [
      `${firstOutcome.code} çıktısını adım adım inceleyelim`,
      `"${targetConcept}" kavramının temel özelliği...`,
      "Zenginleştirme (Farklılaştırma) sorusu sor!",
    ],
    source: "socratic-engine",
  };
}

function buildFallbackSocraticResponse(body: TutorAPIRequest): TutorAPIResponse {
  const unit = body.activeUnit || DEFAULT_TYMM_UNIT;
  const text = (body.message || "").toLowerCase();

  // Eğer seçilen ünite Kütle ve Ağırlık (368) değilse ve mesaj doğrudan terazi/dinamometre/gezegen içermiyorsa,
  // seçilen dersin/ünitenin kendi TYMM Sokratik Sınav motorunu çalıştır!
  const isPhysicsLabQuery =
    unit.unitId === 368 ||
    text.includes("dinamometre") ||
    text.includes("terazi") ||
    text.includes("jüpiter") ||
    text.includes("ağırlık") ||
    text.includes("hazin");

  if (!isPhysicsLabQuery) {
    return buildGeneralTymmUnitResponse(body);
  }

  const currentPlanet = body.simulationState?.planet || "earth";
  const currentMass = body.simulationState?.mass || 5;
  const skillKeys = Object.keys(body.skills || {});
  const primarySkillId =
    skillKeys.find((k) => k.includes("2.2.1")) ||
    skillKeys[0] ||
    "FB.5.2.2.1";
  const secondarySkillId =
    skillKeys.find((k) => k.includes("2.1.1")) ||
    skillKeys[0] ||
    "FB.5.2.1.1";

  // 0. TYMM Bilim Tarihi / Zenginleştirme (Hazinî ve Birûnî)
  if (
    text.includes("hazin") ||
    text.includes("birun") ||
    text.includes("birûn") ||
    text.includes("zenginleştirme") ||
    text.includes("farklılaştırma")
  ) {
    const enrichmentText =
      unit.enrichment && unit.enrichment.length > 0
        ? unit.enrichment[0]
        : DEFAULT_TYMM_UNIT.enrichment[0];

    return {
      reply: `🌟 **TYMM Zenginleştirme & Bilim Tarihi Bağlantısı (${unit.title}):**\n\n${enrichmentText}\n\nŞimdi simülasyonu **Dünya** ($g = 9.81\\text{ m/s}^2$) ve **$10\\text{ kg}$** kütleye ayarladım. **Birûnî**'nin *"Merkezde bir çekicilik olduğu için her şey Dünya'nın merkezine düşer"* fikrini ve **Hazinî**'nin kütleçekim görüşünü tahtadaki **Dinamometre**'nin aşağı yönlü $\\vec{G}$ kuvvet okuyla nasıl ilişkilendirirsin? Gezegeni **Derin Uzay** ($g=0$) yaparsak bu merkezî çekim gücüne ne olur?`,
      detectedMisconception: null,
      updateSimulation: {
        planet: "earth",
        mass: 10,
      },
      bktUpdate: {
        skillId: primarySkillId,
        isCorrect: true,
        reason:
          "TYMM Zenginleştirme: Hazinî ve Birûnî'nin yer çekimi yaklaşımları sorgulandı.",
      },
      quickReplies: [
        "Dinamometredeki G oku tam olarak Hazinî'nin bahsettiği merkeze çekim kuvvetidir!",
        "Derin uzayda (g=0) merkeze çeken kuvvet sıfırlanır.",
        "Birûnî'nin sorusunu Ay ortamında test edelim!",
      ],
      source: "socratic-engine",
    };
  }

  // 1. MY-02: Ay'da veya uzayda kütlenin değiştiği / sıfırlandığı yanılgısı
  if (
    (text.includes("kütle") &&
      (text.includes("azalı") ||
        text.includes("düşer") ||
        text.includes("değişir") ||
        text.includes("sıfır") ||
        text.includes("6'da") ||
        text.includes("altıda"))) ||
    text.includes("uzayda kütle sıfır")
  ) {
    const targetPlanet: PlanetId = text.includes("uzay") ? "space" : "moon";
    return {
      reply:
        targetPlanet === "space"
          ? `İlginç bir hipotez! Hemen test etmek için simülasyonu **Derin Uzay** ($g = 0\\text{ m/s}^2$) ortamına aldım. Dinamometrenin ibresi $0\\text{ N}$ gösteriyor çünkü kütleçekim kuvveti yok.\n\nPeki **TYMM \`${primarySkillId}\` süreç bileşenini** düşünerek tahtadaki **$${currentMass}\\text{ kg}$'lık metal bloğa** bak: Bu bloğun içindeki atomlar ve madde miktarı uzaya çıkınca yok mu oldu? Madde miktarı yok olmadıysa **kütle** sıfırlanmış olabilir mi?`
          : `Çok yaygın bir düşünceyi dile getirdin! Şimdi bunu **TYMM \`${primarySkillId}\`** (*Dünya ve Ay'daki kütle ile ağırlık ölçümlerini karşılaştırma*) kapsamında test edelim: Simülasyonu **Ay**'a ($g = 1.62\\text{ m/s}^2$) taşıdım.\n\nSol taraftaki **Eşit Kollu Terazi** ile sağdaki **Dinamometre**'ye dikkatlice bak (Veri Okuryazarlığı \`OB7\`). Dinamometredeki Newton değeri azaldı ama eşit kollu terazinin kefeleri hâlâ **$m = ${currentMass}\\text{ kg}$** ile dengede! Cismin içinden bir parça koparmadığımıza göre, değişen şey **kütle** mi yoksa **ağırlık** mı?`,
      detectedMisconception: "MY-02",
      updateSimulation: {
        planet: targetPlanet,
        mass: currentMass,
      },
      bktUpdate: {
        skillId: primarySkillId,
        isCorrect: false,
        reason:
          "Öğrenci konum değiştiğinde (Ay/Uzay) kütlenin de azalacağını veya sıfırlanacağını düşündü (MY-02).",
      },
      quickReplies: [
        "Madde miktarı değişmedi, o halde kütle sabit kalır!",
        "Ama dinamometredeki sayı neden küçüldü?",
        "Terazi neden Ay'da da aynı sonucu verdi?",
      ],
      source: "socratic-engine",
    };
  }

  // 2. MY-01: Ağırlığım X kg / Kütle ve ağırlık aynıdır yanılgısı
  if (
    (text.includes("ağırlı") && text.includes("kg")) ||
    (text.includes("ağırlı") && text.includes("kilogram")) ||
    text.includes("aynı şey") ||
    text.includes("fark yok")
  ) {
    return {
      reply: `Günlük hayatta markette veya tartıda sıkça *"Ağırlığım 60 kg"* deriz, değil mi? Ancak **TYMM \`${primarySkillId}\`** süreç bileşenlerine göre burada bilimsel bir gizem var!\n\nSimülasyonda kütleyi **$6\\text{ kg}$** yaptım ve bizi **Ay**'a götürdüm. Eğer ağırlık ile kütle aynı şey olsaydı, hem terazinin ($\\text{kg}$) hem de dinamometrenin ($\\text{N}$) aynı sayıyı göstermesi gerekmez miydi? Neden biri sabit kalırken diğeri değişiyor?`,
      detectedMisconception: "MY-01",
      updateSimulation: {
        planet: "moon",
        mass: 6,
      },
      bktUpdate: {
        skillId: primarySkillId,
        isCorrect: false,
        reason:
          "Öğrenci ağırlık kavramını kilogram birimiyle eşleştirerek kütle-ağırlık yanılgısı sergiledi (MY-01).",
      },
      quickReplies: [
        "Çünkü kg kütlenin birimidir, ağırlık Newton ile ölçülür!",
        "Ağırlık yerçekimi kuvvetine bağlıdır.",
        "Hazinî ve Birûnî yer çekimini nasıl açıklamıştır?",
      ],
      source: "socratic-engine",
    };
  }

  // 3. MY-03: Birim / Ölçü aleti karışıklığı
  if (
    (text.includes("kütle") && text.includes("dinamometre")) ||
    (text.includes("kütle") && text.includes("newton")) ||
    (text.includes("ağırlık") && text.includes("terazi"))
  ) {
    return {
      reply: `Ölçüm araçlarının çalışma prensibini **TYMM \`${secondarySkillId}\`** (*Kuvvetin büyüklüğünü dinamometre ile ölçer ve Newton birimi ile tanımlar*) üzerinden inceleyelim! Simülasyonu **Jüpiter**'e ($g = 24.79\\text{ m/s}^2$) ayarladım.\n\nSağdaki aracın içinde sarmal bir **yay** var ve Jüpiter cisimleri güçlü çektiği için yay aşağı doğru uzadı. Yayların uzaması cisme etki eden **kuvveti** ölçer. Peki kuvveti ölçen bu yaylı aracın adı ve gösterdiği birim ($\\text{N}$) hangi kavrama aittir?`,
      detectedMisconception: "MY-03",
      updateSimulation: {
        planet: "jupiter",
        mass: currentMass,
      },
      bktUpdate: {
        skillId: secondarySkillId,
        isCorrect: false,
        reason:
          "Kütle ve ağırlığın ölçüm aletleri / birimleri arasında karışıklık tespit edildi (MY-03).",
      },
      quickReplies: [
        "Dinamometre ağırlığı (Newton) ölçer, terazi kütleyi (kg) ölçer.",
        "Eşit kollu terazi neden Jüpiter'de etkilenmedi?",
        "Formüldeki G = m · g ne anlama geliyor?",
      ],
      source: "socratic-engine",
    };
  }

  // 4. MY-04: Terazinin Jüpiter/Ay'da farklı ölçeceği yanılgısı
  if (
    text.includes("terazi") &&
    (text.includes("farklı") ||
      text.includes("artar") ||
      text.includes("azalır") ||
      text.includes("değişir") ||
      text.includes("fazla gösterir"))
  ) {
    return {
      reply: `Harika bir nokta yakaladın! Simülasyonu **Jüpiter**'e ($g = 24.79\\text{ m/s}^2$) ve **$10\\text{ kg}$** kütleye getirdim.\n\nEşit kollu terazinin sol kefesinde bizim cismimiz, sağ kefesinde ise referans kütlelerimiz var. Jüpiter'in devasa yerçekimi sol kefeyi $2.5$ kat daha güçlü çekerken, **sağ kefedeki referans kütleleri** de aynı oranda çekmiyor mu? İki kefe de aynı oranda çekilirse denge bozulur mu?`,
      detectedMisconception: "MY-04",
      updateSimulation: {
        planet: "jupiter",
        mass: 10,
      },
      bktUpdate: {
        skillId: primarySkillId,
        isCorrect: false,
        reason:
          "Öğrenci eşit kollu terazinin farklı çekim ivmesinde farklı değer göstereceğini düşündü (MY-04).",
      },
      quickReplies: [
        "İki kefeye de aynı g etki ettiği için denge bozulmaz!",
        "Peki uzay boşluğunda (g=0) terazi çalışır mı?",
        "Mars'ta ölçüm yapalım!",
      ],
      source: "socratic-engine",
    };
  }

  // 5. Öğrenci doğru kavramsal çıkarım yaptığında
  if (
    text.includes("değişmez") ||
    text.includes("sabit") ||
    text.includes("newton") ||
    text.includes("bozulmaz") ||
    text.includes("merkeze çekim") ||
    (text.includes("kütle") && text.includes("madde"))
  ) {
    const nextPlanet: PlanetId =
      currentPlanet === "earth"
        ? "mars"
        : currentPlanet === "mars"
        ? "jupiter"
        : "moon";
    const pInfo = PLANETS[nextPlanet];
    const nextWeight = (currentMass * pInfo.gravity).toFixed(2);

    return {
      reply: `Tebrik ederim, **TYMM \`${primarySkillId}\`** süreç bileşenlerine tam uyumlu bilimsel bir çıkarım yaptın! **Kütle ($m$)** madde miktarı olduğu için konumdan bağımsızdır ve sabit kalır; **ağırlık ($G = m \\cdot g$)** ise yerçekimi ivmesine bağlı bir kuvvettir.\n\nŞimdi bir adım ileri gidelim: Simülasyonu **${pInfo.name}** gezegenine ($g = ${pInfo.gravity}\\text{ m/s}^2$) taşıdım. Kütleyi **$${currentMass}\\text{ kg}$** iken **2 katına ($${Math.min(
        20,
        currentMass * 2
      )}\\text{ kg}$)** çıkarırsak, dinamometredeki uzama miktarı ve $G$ ağırlığı nasıl bir oranda değişir?`,
      detectedMisconception: null,
      updateSimulation: {
        planet: nextPlanet,
        mass: currentMass,
      },
      bktUpdate: {
        skillId: text.includes("newton") ? secondarySkillId : primarySkillId,
        isCorrect: true,
        reason: `Öğrenci TYMM ${primarySkillId} kapsamında kütle değişmezliğini ve ağırlık (${nextWeight} N) ilişkisini doğru yorumladı.`,
      },
      quickReplies: [
        "Kütle 2 katına çıkarsa ağırlık da doğru orantılı olarak 2 katına çıkar!",
        "Hazinî ve Birûnî yer çekimini nasıl açıklamıştır?",
        "Derin uzayda (g=0) kütleyi artırırsak ağırlık ne olur?",
      ],
      source: "socratic-engine",
    };
  }

  // Varsayılan TYMM Sokratik yönlendirme
  const targetPlanet: PlanetId = currentPlanet === "earth" ? "moon" : "earth";
  const targetInfo = PLANETS[targetPlanet];
  return {
    reply: `**${unit.gradeName} • ${unit.title}** kapsamında bunu keşfetmenin en iyi yolu deney yapmaktır! Şimdi tahtadaki simülasyonu **${targetInfo.name}** ortamına ($g = ${targetInfo.gravity}\\text{ m/s}^2$) ve **$${currentMass}\\text{ kg}$** kütleye ayarladım.\n\nFormül panosundaki $$G = m \\cdot g$$ bağıntısına ve tahtadaki iki araca bakarak söyle: Gezegen değiştiğinde **Eşit Kollu Terazi** ile **Dinamometre**'den hangisinin ölçtüğü değer değişti, neden?`,
    detectedMisconception: null,
    updateSimulation: {
      planet: targetPlanet,
      mass: currentMass,
    },
    bktUpdate: null,
    quickReplies: [
      "Dinamometre değişti çünkü ağırlık yerçekimine (g) bağlıdır.",
      "Eşit kollu terazi sabit kaldı çünkü kütle değişmeyen madde miktarıdır.",
      "Hazinî ve Birûnî yer çekimini nasıl açıklamıştır?",
    ],
    source: "socratic-engine",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: TutorAPIRequest = await req.json();
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      const fallback = buildFallbackSocraticResponse(body);
      return NextResponse.json(fallback);
    }

    const ai = new GoogleGenAI({ apiKey });
    const activeUnit = body.activeUnit || DEFAULT_TYMM_UNIT;

    const skillsSummary = Object.values(body.skills || {})
      .map(
        (s) =>
          `${s.code} (${s.title}): P(L)=${(s.params.pL * 100).toFixed(0)}%`
      )
      .join("\n");

    const tymmOutcomesText = (activeUnit.outcomes || [])
      .map(
        (o) =>
          `- ${o.code}: ${o.title}\n  Süreç Bileşenleri: ${(
            o.processComponents || []
          ).join(" | ")}`
      )
      .join("\n");

    const tymmSkillsText = (activeUnit.resolvedSkills || [])
      .map((sk) => `${sk.code} (${sk.label} - ${sk.category})`)
      .join(", ");

    const misconceptionsCatalog = Object.values(MISCONCEPTIONS)
      .map((m) => `${m.code}: ${m.title} (${m.studentPattern})`)
      .join("\n");

    const conversationContext = (body.history || [])
      .slice(-6)
      .map(
        (h) => `${h.role === "tutor" ? "Öğretmen" : "Öğrenci"}: ${h.content}`
      )
      .join("\n");

    const userPrompt = `AKTİF TYMM (TÜRKİYE YÜZYILI MAARİF MODELİ) ÜNİTESİ:
- Sınıf & Ders: ${activeUnit.gradeName} - ${activeUnit.subject}
- Ünite: ${activeUnit.title} (Ünite ID: #${activeUnit.unitId})
- Anahtar Kavramlar: ${activeUnit.keyConcepts}
- Öğrenme Çıktıları ve Süreç Bileşenleri:
${tymmOutcomesText}
- Eşleşen TYMM Beceri ve Değer Kodları (codes.json):
${tymmSkillsText}
- Zenginleştirme (Farklılaştırma): ${(activeUnit.enrichment || []).join(" ")}
- Öğrenme-Öğretme Yaşantıları: ${(activeUnit.teachingApplications || []).join(" ")}

MEVCUT SİMÜLASYON DURUMU:
- Aktif Gezegen: ${body.simulationState?.planet} (g = ${body.simulationState?.gravity} m/s²)
- Kütle (m): ${body.simulationState?.mass} kg
- Ağırlık (G = m·g): ${body.simulationState?.weight?.toFixed(2)} N

ÖĞRENCİ BKT USTALIK DURUMU:
${skillsSummary}

KAVRAM YANILGISI KODLARI:
${misconceptionsCatalog}

SON SOHBET GEÇMİŞİ:
${conversationContext}

ÖĞRENCİNİN YENİ MESAJI:
"${body.message}"

Lütfen Proaktif Sınav Sokratik öğretmeni olarak yanıtını belirtilen JSON şemasında üret.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description:
                "Öğrenciye doğrudan cevabı vermeyen, TYMM süreç bileşenlerini gözlemlemeye yönlendiren Türkçe Sokratik öğretmen yanıtı.",
            },
            detectedMisconception: {
              type: Type.STRING,
              nullable: true,
              description:
                "Tespit edilen kavram yanılgısı kodu ('MY-01', 'MY-02', 'MY-03', 'MY-04') veya yoksa null.",
            },
            updateSimulation: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                planet: {
                  type: Type.STRING,
                  description:
                    "Gezegen ID: 'earth', 'moon', 'mars', 'jupiter' veya 'space'",
                },
                mass: {
                  type: Type.NUMBER,
                  description: "Kütle (kg), 1 ile 20 arası tam sayı",
                },
              },
            },
            bktUpdate: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                skillId: {
                  type: Type.STRING,
                  description:
                    "Aktif TYMM öğrenme çıktısı kodu (Örn: 'FB.5.2.2.1', 'MAT.1.1.1' vb.)",
                },
                isCorrect: {
                  type: Type.BOOLEAN,
                  description:
                    "Öğrencinin bilimsel çıkarımı doğruysa true, kavram yanılgısı varsa false",
                },
                reason: {
                  type: Type.STRING,
                  description: "Kısa değerlendirme nedeni",
                },
              },
            },
            quickReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "Öğrencinin bir sonraki adımda tıklayabileceği 3 adet kısa Sokratik yanıt/hipotez çipi.",
            },
          },
          required: ["reply"],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return NextResponse.json(buildFallbackSocraticResponse(body));
    }

    const parsed = JSON.parse(rawText) as TutorAPIResponse;
    return NextResponse.json({
      reply: parsed.reply,
      detectedMisconception: parsed.detectedMisconception || null,
      updateSimulation: parsed.updateSimulation || null,
      bktUpdate: parsed.bktUpdate || null,
      quickReplies:
        parsed.quickReplies && parsed.quickReplies.length > 0
          ? parsed.quickReplies
          : [
              "Süreç bileşenlerini adım adım inceleyelim",
              "Zenginleştirme (Farklılaştırma) sorusu sor!",
              "Bana yeni bir soru sor!",
            ],
      source: "gemini",
    });
  } catch (error) {
    console.error("Tutor API Gemini fallback triggered:", error);
    try {
      const cloneBody = await req.clone().json().catch(() => ({}));
      return NextResponse.json(
        buildFallbackSocraticResponse(cloneBody as TutorAPIRequest)
      );
    } catch {
      return NextResponse.json({
        reply:
          "Bu ünitenin süreç bileşenlerine tekrar bakalım: Gözlemlediğin temel ilişkiyi kendi cümlelerinle paylaşır mısın?",
        detectedMisconception: null,
        updateSimulation: null,
        bktUpdate: null,
        source: "socratic-engine",
      });
    }
  }
}
