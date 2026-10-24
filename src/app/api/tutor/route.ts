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

const SYSTEM_PROMPT = `Sen MEB Türkiye Yüzyılı Maarif Modeli (TYMM) müfredatına hakim Sokratik bir öğretmensin. Öğrenciye doğrudan cevabı asla verme. Kütle ve ağırlık kavram yanılgılarını tespit et, JSON formatında { reply, detectedMisconception, updateSimulation: { planet, mass }, bktUpdate, quickReplies } döndür.

PEDAGOJİK KURALLAR:
1. Aktif TYMM ünitesinin Öğrenme Çıktılarını (outcomes), Süreç Bileşenlerini (a, b, c), Anahtar Kavramlarını, Öğrenme-Öğretme Yaşantılarını ve Zenginleştirme (örn. Hazinî ve Birûnî'nin yer çekimi çalışmaları) bilgilerini rehberliğinde aktif olarak kullan.
2. Öğrenciye doğrudan bilgi anlatımı veya hazır cevap VERME. Onu simülasyondaki Eşit Kollu Terazi ve Dinamometre göstergelerini gözlemlemeye yönlendiren Sokratik sorular sor.
3. Öğrencinin cümlesinde aşağıdaki kavram yanılgılarından biri varsa "detectedMisconception" alanına ilgili kodu ("MY-01", "MY-02", "MY-03" veya "MY-04") yaz; yanılgı yoksa null döndür:
   - "MY-01": Kütle ve ağırlığı aynı kavram sanma (Örn: "Ağırlığım 60 kg", "İkisi de aynı şey").
   - "MY-02": Ay'da veya uzayda kütlenin azaldığını ya da sıfırlandığını düşünme (Örn: "Ay'da kütlem 6'da 1'ine düşer", "Uzayda kütle sıfırdır").
   - "MY-03": Birim ve ölçü aleti karışıklığı (Örn: "Ağırlık teraziyle ölçülür", "Kütlenin birimi Newton'dur").
   - "MY-04": Eşit kollu terazinin farklı gezegenlerde farklı kütle ölçeceğini düşünme (Örn: "Jüpiter'de terazi daha fazla kg gösterir").
4. Öğrencinin hipotezini test etmesi için simülasyonu proaktif olarak güncelle ("updateSimulation"):
   - "planet": "earth" | "moon" | "mars" | "jupiter" | "space"
   - "mass": 1 ile 20 arasında tam sayı (kg)
5. "bktUpdate" alanında öğrencinin yanıtının bilimsel doğruluğuna göre aktif ünitenin öğrenme çıktısı kodunu (Örn: "FB.5.2.2.1", "FB.5.2.1.1" vb.) kullanarak değerlendir.
6. Matematiksel ifadelerde LaTeX formatı ($G = m \\cdot g$, $\\text{N}$, $\\text{kg}$) kullanabilirsin.`;

function buildFallbackSocraticResponse(body: TutorAPIRequest): TutorAPIResponse {
  const text = (body.message || "").toLowerCase();
  const currentPlanet = body.simulationState?.planet || "earth";
  const currentMass = body.simulationState?.mass || 5;
  const unit = body.activeUnit || DEFAULT_TYMM_UNIT;
  const skillKeys = Object.keys(body.skills || {});
  const primarySkillId =
    skillKeys.find((k) => k.includes("2.2.1")) ||
    skillKeys[0] ||
    "FB.5.2.2.1";
  const secondarySkillId =
    skillKeys.find((k) => k.includes("2.1.1")) ||
    skillKeys[0] ||
    "FB.5.2.1.1";

  // 0. TYMM Bilim Tarihi / Zenginleştirme (Hazinî ve Birûnî) veya farklılaştırma sorusu
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
          : `Çok yaygın bir düşünceyi dile getirdin! Şimdi bunu **TYMM \`${primarySkillId}\`** (*Dünya ve Ay'daki kütle ile ağırlık ölçümlerini karşılaştırma*) kapsamında test edelim: Simülasyonu **Ay**'a ($g = 1.62\\text{ m/s}^2$) taşıdım.\n\nSol taraftaki **Eşit Kollu Terazi** ile sağdaki **Dinamometre**'ye dikkatlice bak (` +
            `Veri Okuryazarlığı \`OB7\`` +
            `). Dinamometredeki Newton değeri azaldı ama eşit kollu terazinin kefeleri hâlâ **$m = ${currentMass}\\text{ kg}$** ile dengede! Cismin içinden bir parça koparmadığımıza göre, değişen şey **kütle** mi yoksa **ağırlık** mı?`,
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

  // 6. Seçili TYMM ünitesinin özel bir öğrenme çıktısı sorulduğunda
  const matchedOutcome = (unit.outcomes || []).find((o) =>
    text.includes(o.code.toLowerCase())
  );
  if (matchedOutcome) {
    const pcs =
      matchedOutcome.processComponents?.join("\n- ") ||
      "Kavramsal gözlem ve çıkarım";
    return {
      reply: `🎯 **TYMM Öğrenme Çıktısı Odaklı Keşif (\`${matchedOutcome.code}\`):**\n*${matchedOutcome.title}*\n\n**Süreç Bileşenlerimiz:**\n- ${pcs}\n\nŞimdi tahtadaki **Eşit Kollu Terazi** ve **Dinamometre** simülasyonunu kullanarak bu süreç bileşenini test edelim: Kütle sürgüsünü veya gezegeni değiştirdiğinde gözlemlediğin ilk örüntü nedir?`,
      detectedMisconception: null,
      updateSimulation: {
        planet: "moon",
        mass: 8,
      },
      bktUpdate: null,
      quickReplies: [
        "Dinamometre kuvveti Newton (N) birimiyle ölçüyor!",
        "Dünya ve Ay'da kütle sabit kalırken ağırlık değişiyor.",
        "Hazinî ve Birûnî yer çekimini nasıl açıklamıştır?",
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

Lütfen TYMM Sokratik öğretmeni olarak yanıtını belirtilen JSON şemasında üret.`;

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
                "Öğrenciye doğrudan cevabı vermeyen, simülasyonu ve TYMM süreç bileşenlerini gözlemlemeye yönlendiren Türkçe Sokratik öğretmen yanıtı.",
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
                    "Aktif TYMM öğrenme çıktısı kodu (Örn: 'FB.5.2.2.1', 'FB.5.2.1.1')",
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
              "Terazi ve dinamometreyi karşılaştıralım",
              "Hazinî ve Birûnî yer çekimini nasıl açıklamıştır?",
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
          "Simülasyondaki **Eşit Kollu Terazi** ve **Dinamometre** göstergelerine tekrar bakalım: Gezegeni değiştirdiğimizde hangi ölçüm aracının değeri sabit kalıyor?",
        detectedMisconception: null,
        updateSimulation: null,
        bktUpdate: null,
        source: "socratic-engine",
      });
    }
  }
}
