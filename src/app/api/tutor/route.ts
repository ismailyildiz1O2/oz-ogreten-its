import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import {
  PlanetId,
  TutorAPIRequest,
  TutorAPIResponse,
} from "@/types/its";
import { MISCONCEPTIONS, PLANETS } from "@/lib/curriculum-graph";

const SYSTEM_PROMPT = `Sen MEB müfredatına hakim Sokratik bir öğretmensin. Öğrenciye doğrudan cevabı asla verme. Kütle ve ağırlık kavram yanılgılarını tespit et, JSON formatında { reply, detectedMisconception, updateSimulation: { planet, mass }, bktUpdate, quickReplies } döndür.

PEDAGOJİK KURALLAR:
1. Konu: MEB 7. Sınıf Fen Bilimleri (F.7.3.1) - Kütle ve Ağırlık İlişkisi, Yerçekimi Kuvveti, Eşit Kollu Terazi ve Dinamometre.
2. Öğrenciye doğrudan bilgi anlatımı veya hazır cevap VERME. Onu simülasyondaki Eşit Kollu Terazi ve Dinamometre göstergelerini gözlemlemeye yönlendiren Sokratik sorular sor.
3. Öğrencinin cümlesinde aşağıdaki kavram yanılgılarından biri varsa "detectedMisconception" alanına ilgili kodu ("MY-01", "MY-02", "MY-03" veya "MY-04") yaz; yanılgı yoksa null döndür:
   - "MY-01": Kütle ve ağırlığı aynı kavram sanma (Örn: "Ağırlığım 60 kg", "İkisi de aynı şey").
   - "MY-02": Ay'da veya uzayda kütlenin azaldığını ya da sıfırlandığını düşünme (Örn: "Ay'da kütlem 6'da 1'ine düşer", "Uzayda kütle sıfırdır").
   - "MY-03": Birim ve ölçü aleti karışıklığı (Örn: "Ağırlık teraziyle ölçülür", "Kütlenin birimi Newton'dur").
   - "MY-04": Eşit kollu terazinin farklı gezegenlerde farklı kütle ölçeceğini düşünme (Örn: "Jüpiter'de terazi daha fazla kg gösterir").
4. Öğrencinin hipotezini test etmesi için simülasyonu proaktif olarak güncelle ("updateSimulation"):
   - "planet": "earth" | "moon" | "mars" | "jupiter" | "space" (veya değiştirmemek için mevcut gezegen)
   - "mass": 1 ile 20 arasında tam sayı (kg)
5. "bktUpdate" alanında öğrencinin yanıtının bilimsel doğruluğuna göre:
   - "skillId": "F.7.3.1.1" (Kütle değişmezliği) | "F.7.3.1.2" (Ağırlık G=m.g ve Newton) | "F.7.3.1.3" (Gezegenler arası terazi/dinamometre analizi)
   - "isCorrect": Öğrenci doğru bir kavramsal çıkarım yaptıysa true, kavram yanılgısı sergilediyse false.
   - "reason": Kısa pedagojik değerlendirme açıklaması.
6. Matematiksel ifadelerde LaTeX formatı ($G = m \\cdot g$, $\\text{N}$, $\\text{kg}$) kullanabilirsin.`;

function buildFallbackSocraticResponse(body: TutorAPIRequest): TutorAPIResponse {
  const text = (body.message || "").toLowerCase();
  const currentPlanet = body.simulationState?.planet || "earth";
  const currentMass = body.simulationState?.mass || 5;

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
          ? `İlginç bir hipotez! Hemen test etmek için simülasyonu **Derin Uzay** ($g = 0\\text{ m/s}^2$) ortamına aldım. Dinamometrenin ibresi $0\\text{ N}$ gösteriyor çünkü kütleçekim kuvveti yok.\n\nPeki tahtadaki **$${currentMass}\\text{ kg}$'lık metal bloğa** bak: Bu bloğun içindeki atomlar ve madde miktarı uzaya çıkınca yok mu oldu? Madde miktarı yok olmadıysa **kütle** sıfırlanmış olabilir mi?`
          : `Çok yaygın bir düşünceyi dile getirdin! Şimdi bunu birlikte test edelim: Simülasyonu **Ay**'a ($g = 1.62\\text{ m/s}^2$) taşıdım.\n\nSol taraftaki **Eşit Kollu Terazi** ile sağdaki **Dinamometre**'ye dikkatlice bak. Dinamometredeki Newton değeri azaldı ama eşit kollu terazinin kefeleri hâlâ **$m = ${currentMass}\\text{ kg}$** ile dengede! Cismin içinden bir parça koparmadığımıza göre, değişen şey **kütle** mi yoksa **ağırlık** mı?`,
      detectedMisconception: "MY-02",
      updateSimulation: {
        planet: targetPlanet,
        mass: currentMass,
      },
      bktUpdate: {
        skillId: "F.7.3.1.1",
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
      reply: `Günlük hayatta markette veya tartıda sıkça *"Ağırlığım 60 kg"* deriz, değil mi? Ancak fizik laboratuvarında bu ifadede bir gizem var!\n\nSimülasyonda kütleyi **$6\\text{ kg}$** yaptım ve bizi **Ay**'a götürdüm. Eğer ağırlık ile kütle aynı şey olsaydı, hem terazinin ($\\text{kg}$) hem de dinamometrenin ($\\text{N}$) aynı sayıyı göstermesi gerekmez miydi? Neden biri sabit kalırken diğeri değişiyor?`,
      detectedMisconception: "MY-01",
      updateSimulation: {
        planet: "moon",
        mass: 6,
      },
      bktUpdate: {
        skillId: "F.7.3.1.1",
        isCorrect: false,
        reason:
          "Öğrenci ağırlık kavramını kilogram birimiyle eşleştirerek kütle-ağırlık yanılgısı sergiledi (MY-01).",
      },
      quickReplies: [
        "Çünkü kg kütlenin birimidir, ağırlık Newton ile ölçülür!",
        "Ağırlık yerçekimi kuvvetine bağlıdır.",
        "Jüpiter'de denesek ne olur?",
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
      reply: `Ölçüm araçlarının çalışma prensibini birlikte inceleyelim! Simülasyonu **Jüpiter**'e ($g = 24.79\\text{ m/s}^2$) ayarladım.\n\nSağdaki aracın içinde sarmal bir **yay** var ve Jüpiter cisimleri güçlü çektiği için yay aşağı doğru uzadı. Yayların uzaması cisme etki eden **kuvveti** ölçer. Peki kuvveti ölçen bu yaylı aracın adı ve gösterdiği birim ($\text{N}$) hangi kavrama aittir?`,
      detectedMisconception: "MY-03",
      updateSimulation: {
        planet: "jupiter",
        mass: currentMass,
      },
      bktUpdate: {
        skillId: "F.7.3.1.2",
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
        skillId: "F.7.3.1.3",
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

  // 5. Öğrenci doğru kavramsal çıkarım yaptığında (kütle değişmez / ağırlık değişir / Newton)
  if (
    text.includes("değişmez") ||
    text.includes("sabit") ||
    text.includes("newton") ||
    text.includes("bozulmaz") ||
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
      reply: `Tebrik ederim, çok sağlam bir bilimsel çıkarım yaptın! **Kütle ($m$)** madde miktarı olduğu için konumdan bağımsızdır ve sabit kalır; **ağırlık ($G = m \\cdot g$)** ise yerçekimi ivmesine bağlı bir kuvvettir.\n\nŞimdi bir adım ileri gidelim: Simülasyonu **${pInfo.name}** gezegenine ($g = ${pInfo.gravity}\\text{ m/s}^2$) taşıdım. Kütleyi **$${currentMass}\\text{ kg}$** iken **2 katına ($${Math.min(20, currentMass * 2)}\\text{ kg}$)** çıkarırsak, dinamometredeki uzama miktarı ve $G$ ağırlığı nasıl bir oranda değişir?`,
      detectedMisconception: null,
      updateSimulation: {
        planet: nextPlanet,
        mass: currentMass,
      },
      bktUpdate: {
        skillId: text.includes("newton")
          ? "F.7.3.1.2"
          : text.includes("bozulmaz")
          ? "F.7.3.1.3"
          : "F.7.3.1.1",
        isCorrect: true,
        reason: `Öğrenci kütle değişmezliğini ve ağırlık (${nextWeight} N) ilişkisini doğru yorumladı.`,
      },
      quickReplies: [
        "Kütle 2 katına çıkarsa ağırlık da doğru orantılı olarak 2 katına çıkar!",
        "Kütleyi 10 kg yapıp tahtada görelim.",
        "Derin uzayda (g=0) kütleyi artırırsak ağırlık ne olur?",
      ],
      source: "socratic-engine",
    };
  }

  // 6. Gezegen / deney talepleri (Jüpiter, Mars, Uzay, Ay, Soru sor)
  if (text.includes("jüpiter")) {
    return {
      reply: `Simülasyonu güneş sisteminin en büyük gezegeni **Jüpiter**'e ($g = 24.79\\text{ m/s}^2$) ve **$8\\text{ kg}$** kütleye ayarladım!\n\nDinamometrenin yayının ne kadar çok uzadığına dikkat et ($G = ${(8 * 24.79).toFixed(1)}\\text{ N}$). Sence Dünya'ya kıyasla Jüpiter'de yay neden yaklaşık $2.5$ kat daha fazla gerildi, fakat eşit kollu terazi hâlâ tam $8\\text{ kg}$'da dengede duruyor?`,
      detectedMisconception: null,
      updateSimulation: { planet: "jupiter", mass: 8 },
      bktUpdate: null,
      quickReplies: [
        "Jüpiter'in kütleçekim ivmesi (g) Dünya'nın 2.5 katı olduğu için ağırlık arttı!",
        "Kütle değişmediği için terazi yine 8 kg ölçtü.",
        "Şimdi Derin Uzay'ı (g=0) deneyelim!",
      ],
      source: "socratic-engine",
    };
  }

  if (text.includes("uzay") || text.includes("g=0")) {
    return {
      reply: `Simülasyonu **Derin Uzay**'a ($g = 0\\text{ m/s}^2$) taşıdım! Kütleçekim ivmesi sıfır olduğu için dinamometrenin yayı hiç gerilmiyor ve **$G = 0\\text{ N}$** gösteriyor.\n\nSana kritik bir Sokratik soru: Uzay boşluğunda ağırlığı $0\\text{ N}$ olan bu **$${currentMass}\\text{ kg}$**'lık cisme elinle vurursan canın yanar mı? Yani **kütlesi** hâlâ orada mıdır?`,
      detectedMisconception: null,
      updateSimulation: { planet: "space", mass: currentMass },
      bktUpdate: null,
      quickReplies: [
        "Evet, ağırlığı 0 N olsa da kütlesi (madde miktarı) hâlâ " +
          currentMass +
          " kg'dır!",
        "Uzayda kütle de sıfır olur, hiç hissetmeyiz.",
        "Uzayda eşit kollu terazi ile ölçüm yapabilir miyiz?",
      ],
      source: "socratic-engine",
    };
  }

  // Varsayılan Sokratik yönlendirme
  const targetPlanet: PlanetId = currentPlanet === "earth" ? "moon" : "earth";
  const targetInfo = PLANETS[targetPlanet];
  return {
    reply: `Bunu keşfetmenin en iyi yolu deney yapmaktır! Şimdi tahtadaki simülasyonu **${targetInfo.name}** ortamına ($g = ${targetInfo.gravity}\\text{ m/s}^2$) ve **$${currentMass}\\text{ kg}$** kütleye ayarladım.\n\nFormül panosundaki $$G = m \\cdot g$$ bağıntısına ve tahtadaki iki araca bakarak söyle: Gezegen değiştiğinde **Eşit Kollu Terazi** ile **Dinamometre**'den hangisinin ölçtüğü değer değişti, neden?`,
    detectedMisconception: null,
    updateSimulation: {
      planet: targetPlanet,
      mass: currentMass,
    },
    bktUpdate: null,
    quickReplies: [
      "Dinamometre değişti çünkü ağırlık yerçekimine (g) bağlıdır.",
      "Eşit kollu terazi sabit kaldı çünkü kütle değişmeyen madde miktarıdır.",
      "Ay'da kütlem de 6'da 1'ine düşer mi?",
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

    const skillsSummary = Object.values(body.skills || {})
      .map(
        (s) =>
          `${s.code} (${s.title}): P(L)=${(s.params.pL * 100).toFixed(0)}%`
      )
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

    const userPrompt = `MEVCUT SİMÜLASYON DURUMU:
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

Lütfen Sokratik öğretmen olarak yanıtını belirtilen JSON şemasında üret.`;

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
                "Öğrenciye doğrudan cevabı vermeyen, simülasyonu gözlemlemeye yönlendiren Türkçe Sokratik öğretmen yanıtı.",
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
                    "İlgili MEB kazanım kodu: 'F.7.3.1.1', 'F.7.3.1.2' veya 'F.7.3.1.3'",
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
              "Gezegeni değiştirince ne oldu?",
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
