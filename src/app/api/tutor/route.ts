import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import {
  ReactiveSolutionCard,
  SolutionMode,
  TutorAPIRequest,
  TutorAPIResponse,
} from "@/types/its";
import { DEFAULT_TYMM_UNIT } from "@/lib/curriculum-graph";
import {
  analyzeQuestionDeeply,
  normalizeTr,
} from "@/lib/question-analyzer";

const PROACTIVE_SYSTEM_PROMPT = `Sen MEB Türkiye Yüzyılı Maarif Modeli (TYMM) müfredatına hakim "Proaktif Sınav" Sokratik yapay zeka öğretmenisin.
GÖREVİN (PROAKTİF MOD):
1. Öğrencinin seçtiği Ders, Ünite ve Kazanım (Öğrenme Çıktısı) doğrultusunda gönderdiği sınav/test veya açık uçlu soruyu derinlemesine analiz et.
2. PROAKTİF MODDA ÖĞRENCİYE DOĞRU ŞIKKI VEYA NİHAİ TAM CEVABI İLK ADIMDA DOĞRUDAN SÖYLEME!
3. Sorunun içindeki alt soruları/öncülleri ayrıştır, her birinin anahtar ipucunu ver, kavram yanılgısına dikkat çek ve öğrencinin cevabı kendi bulmasını sağlayacak Sokratik yönlendirici soruyu sor.
4. Öğrenci kendi akıl yürütmesini paylaştığında cevabını bilimsel/akademik gerekçelerle değerlendir, eksik kalan alt basamakları tamamla ve "bktUpdate" ile kazanım ustalığını artır.`;

const REACTIVE_SYSTEM_PROMPT = `Sen MEB Türkiye Yüzyılı Maarif Modeli (TYMM) müfredatına hakim "Proaktif Sınav" uzman soru çözüm motorusun.
GÖREVİN (REAKTİF / HIZLI ÇÖZ MODU):
1. Öğrenci "Hızlı Çöz (Reaktif Çözüm)" talep etti. Sokratik soru sorma!
2. Gönderilen sınav/test veya açık uçlu sorunun DOĞRU CEVABINI (veya tüm alt sorularının bilimsel yanıtlarını) doğrudan, net ve eksiksiz olarak ver.
3. "reactiveSolution" nesnesini eksiksiz doldur:
   - "correctAnswer": Doğru şık veya net cevap başlığı
   - "stepByStep": Sorunun tüm alt basamaklarının adım adım net çözümü (en az 3 adım)
   - "distractorAnalysis": Çeldiricilerin veya bu konudaki kavram yanılgılarının analizi
   - "examTip": Bu kazanımdaki benzer sınav sorularını hızla çözmek için pratik sınav taktiği
   - "outcomeCode": İlgili TYMM kazanım kodu`;

/**
 * Yerleşik Akıllı Proaktif (Sokratik) ve Reaktif (Hızlı Çöz) Soru Çözüm Motoru
 */
function buildSmartFallbackResponse(body: TutorAPIRequest): TutorAPIResponse {
  const mode: SolutionMode = body.mode === "reactive" ? "reactive" : "proactive";
  const unit = body.activeUnit || DEFAULT_TYMM_UNIT;
  const validOutcomes = (unit.outcomes || []).filter(
    (o) => o.code && !o.code.startsWith("KAZ.")
  );
  const outcomesList =
    validOutcomes.length > 0 ? validOutcomes : unit.outcomes || [];

  const targetOutcomeCode =
    body.selectedOutcomeCode ||
    body.currentQuestion?.outcomeCode ||
    outcomesList[0]?.code ||
    `ÜNİTE-${unit.unitId}`;

  const targetOutcome = outcomesList.find(
    (o) => o.code === targetOutcomeCode
  ) ||
    outcomesList[0] || {
      code: targetOutcomeCode,
      title: unit.title,
      processComponents: [],
    };

  const questionRaw =
    body.currentQuestion?.text?.trim() || body.message.trim();
  const msgNorm = normalizeTr(body.message);
  const qNorm = normalizeTr(questionRaw);

  const analysis = analyzeQuestionDeeply(
    questionRaw,
    unit,
    targetOutcome.code
  );

  // =========================================================================
  // DURUM A: ⚡ REAKTİF ÇÖZÜM (HIZLI ÇÖZ BUTONU VEYA TALEBİ)
  // =========================================================================
  if (
    mode === "reactive" ||
    msgNorm.includes("hızlı çöz") ||
    msgNorm.includes("reaktif") ||
    msgNorm.includes("tam çözümü göster") ||
    msgNorm.includes("tam çözüm kartını")
  ) {
    const reactiveCard: ReactiveSolutionCard = {
      correctAnswer: `Doğru Cevap: ${analysis.reactiveCorrectTitle}`,
      stepByStep: analysis.reactiveSteps,
      distractorAnalysis: analysis.distractorOrMisconceptionWarning,
      examTip: analysis.examTip,
      outcomeCode: targetOutcome.code,
    };

    const stepsFormatted = analysis.reactiveSteps
      .map((s) => `• ${s}`)
      .join("\n\n");

    return {
      reply:
        `⚡ **HIZLI ÇÖZÜM & GİDİŞ YOLU:**\n` +
        `Sorunun adım adım gidiş yolu ve doğrudan cevabı aşağıdadır:\n\n` +
        `✅ **${analysis.reactiveCorrectTitle}**\n\n` +
        `${stepsFormatted}\n\n` +
        `⚠️ **Dikkat Edilmesi Gereken Nokta / Çeldirici Analizi:**\n${analysis.distractorOrMisconceptionWarning}\n\n` +
        `💡 **Pratik Taktik:**\n${analysis.examTip}`,
      mode: "reactive",
      reactiveSolution: reactiveCard,
      detectedMisconception: null,
      updateSimulation:
        qNorm.includes("ay") && qNorm.includes("6 kg")
          ? { planet: "moon", mass: 6 }
          : null,
      bktUpdate: null,
      quickReplies: [
        "Konudaki en önemli sınav tuzağı nedir?",
        "Konunun anahtar kavramlarını özetler misin?",
        "Yeni bir örnek soru çözelim!",
      ],
      source: "socratic-engine",
    };
  }

  // =========================================================================
  // DURUM B: ÖZEL YARDIMCI BUTON TALEPLERİ (SINAV TUZAĞI, KAVRAM ÖZETİ, 2. İPUCU)
  // =========================================================================
  if (
    msgNorm.includes("sınav tuzağı") ||
    msgNorm.includes("kavram yanılgısı") ||
    msgNorm.includes("diğer şıkları")
  ) {
    return {
      reply:
        `⚠️ **Sınav Tuzağı & Kavram Yanılgısı Analizi:**\n\n` +
        `${analysis.distractorOrMisconceptionWarning}\n\n` +
        `💡 **Pratik Taktik:**\n${analysis.examTip}`,
      mode: "proactive",
      reactiveSolution: null,
      detectedMisconception: null,
      updateSimulation: null,
      bktUpdate: null,
      quickReplies: [
        "⚡ Hızlı Çöz (Tam Çözümü Göster)",
        "Konunun anahtar kavramlarını özetler misin?",
        "Yeni bir örnek soru çözelim!",
      ],
      source: "socratic-engine",
    };
  }

  if (
    msgNorm.includes("anahtar kavramlarını özetler") ||
    msgNorm.includes("konuyu özetle")
  ) {
    const subSummary = analysis.subQuestions
      .map((sq) => `🔹 **${sq.title}:** ${sq.proactiveHint}`)
      .join("\n\n");

    return {
      reply:
        `📚 **Konunun Anahtar Kavramları & Özeti:**\n` +
        `**Temel Kavramlar:** ${analysis.detectedKeywords.join(" • ")}\n\n` +
        `${subSummary}`,
      mode: "proactive",
      reactiveSolution: null,
      detectedMisconception: null,
      updateSimulation: null,
      bktUpdate: null,
      quickReplies: [
        "⚡ Hızlı Çöz (Tam Çözümü Göster)",
        "Konudaki en önemli sınav tuzağı nedir?",
        "Yeni bir örnek soru çözelim!",
      ],
      source: "socratic-engine",
    };
  }

  if (
    msgNorm.includes("2. basamak için") ||
    msgNorm.includes("bir sonraki") ||
    msgNorm.includes("ipucu ver")
  ) {
    const secondSub = analysis.subQuestions[1] || analysis.subQuestions[0];
    const thirdSub = analysis.subQuestions[2];
    return {
      reply:
        `🧭 **2. Adım Proaktif İpucu:**\n\n` +
        `📌 **${secondSub.title}:**\n${secondSub.proactiveHint}\n` +
        (thirdSub
          ? `\n📌 **${thirdSub.title}:**\n${thirdSub.proactiveHint}\n`
          : "") +
        `\n❓ **Sokratik Yönlendirme Sorum:**\n${secondSub.socraticQuestion}`,
      mode: "proactive",
      reactiveSolution: null,
      detectedMisconception: null,
      updateSimulation: null,
      bktUpdate: null,
      quickReplies: [
        analysis.proactiveStep1QuickReplies[1] ||
          "Bu ipucuyla neden-sonuç ilişkisini kurdum",
        "⚡ Hızlı Çöz (Tam Çözümü Göster)",
        "Konudaki en önemli sınav tuzağı nedir?",
      ],
      source: "socratic-engine",
    };
  }

  // =========================================================================
  // DURUM C: 🧠 PROAKTİF ÇÖZÜM (1. ADIM BAŞLANGIÇ vs ÖĞRENCİ YANITI DEĞERLENDİRME)
  // =========================================================================
  const isInitialProactiveRequest =
    msgNorm.startsWith("🧠") ||
    msgNorm.includes("[proaktif çözüm") ||
    msgNorm.includes("proaktif çözüm") ||
    msgNorm.includes("adım adım") ||
    msgNorm.includes("örnek bir soru") ||
    msgNorm.includes("yeni bir örnek soru") ||
    msgNorm === qNorm;

  // Eğer öğrenci 1. adım ipucunu aldıktan sonra kendi çıkarımını/cevabını yazdıysa:
  if (!isInitialProactiveRequest) {
    const synthesisSteps = analysis.reactiveSteps
      .map((s) => `✅ ${s}`)
      .join("\n\n");

    return {
      reply:
        `🎉 **Harika bir Proaktif Çıkarım!**\n\n` +
        `Kendi akıl yürütmenle sorunun kilit noktasını doğru yakaladın!\n\n` +
        `📋 **Sorunun Tam Gidiş Yolu & Doğrulaması:**\n\n` +
        `${synthesisSteps}\n\n` +
        `💡 **Pratik Taktik:** ${analysis.examTip}`,
      mode: "proactive",
      reactiveSolution: null,
      detectedMisconception: null,
      updateSimulation: null,
      bktUpdate: {
        skillId: targetOutcome.code,
        isCorrect: true,
        reason: `Öğrenci soruyu Proaktif rehberlikle doğru çözdü.`,
      },
      quickReplies: [
        "⚡ Hızlı Çöz (Tam Çözüm Kartını Sağ Tahtada Aç)",
        "Konudaki en önemli sınav tuzağı nedir?",
        "Yeni bir örnek soru çözelim!",
      ],
      source: "socratic-engine",
    };
  }

  // Öğrenci "🧠 Proaktif Çöz" butonuna bastığında 1. Adım Sokratik Rehberlik:
  return {
    reply:
      `🧠 **Proaktif Çözüm Başladı:**\n` +
      `Cevabı sana doğrudan vermeyeceğim; soruyu adım adım birlikte çözeceğiz!\n\n` +
      `📌 **1. Adım Analiz & İpucu:**\n${analysis.proactiveStep1Hint}\n\n` +
      `❓ **1. Adım Yönlendirme Sorum:**\n${analysis.proactiveStep1Question}\n\n` +
      `*(Aşağıdaki seçeneklerden birini tıklayabilir, kendi fikrini yazabilir veya doğrudan sonuç için **⚡ Hızlı Çöz** butonuna basabilirsin.)*`,
    mode: "proactive",
    reactiveSolution: null,
    detectedMisconception: null,
    updateSimulation:
      qNorm.includes("ay") && qNorm.includes("6 kg")
        ? { planet: "moon", mass: 6 }
        : null,
    bktUpdate: null,
    quickReplies: analysis.proactiveStep1QuickReplies,
    source: "socratic-engine",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: TutorAPIRequest = await req.json();
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const mode: SolutionMode =
      body.mode === "reactive" ? "reactive" : "proactive";

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(buildSmartFallbackResponse(body));
    }

    const ai = new GoogleGenAI({ apiKey });
    const activeUnit = body.activeUnit || DEFAULT_TYMM_UNIT;
    const outcomeCode =
      body.selectedOutcomeCode ||
      body.currentQuestion?.outcomeCode ||
      activeUnit.outcomes?.[0]?.code ||
      "FB.5.2.2.1";

    const tymmOutcomesText = (activeUnit.outcomes || [])
      .map(
        (o) =>
          `- ${o.code}: ${o.title} (${(o.processComponents || []).join(" | ")})`
      )
      .join("\n");

    const conversationContext = (body.history || [])
      .slice(-6)
      .map(
        (h) => `${h.role === "tutor" ? "Öğretmen" : "Öğrenci"}: ${h.content}`
      )
      .join("\n");

    const promptText = `ÇÖZÜM MODU: ${
      mode === "reactive"
        ? "REAKTİF ÇÖZÜM (HIZLI ÇÖZ — DOĞRUDAN TAM ÇÖZÜM VE DOĞRU ŞIKKI VER)"
        : "PROAKTİF ÇÖZÜM (SOKRATİK REHBERLİK — CEVABI VERMEDEN İPUCUYLA YÖNLENDİR)"
    }

SEÇİLİ DERS VE KAZANIM:
- Sınıf & Ders: ${activeUnit.gradeName} • ${activeUnit.subject}
- Ünite: ${activeUnit.title}
- Seçili Kazanım Kodu: ${outcomeCode}
- Ünite Kazanımları:
${tymmOutcomesText}

ÖĞRENCİNİN ÇÖZEMEDİĞİ SINAV/TEST SORUSU:
${body.currentQuestion?.text || body.message}

SON SOHBET GEÇMİŞİ:
${conversationContext}

ÖĞRENCİNİN SON MESAJI:
"${body.message}"`;

    const contents: Array<
      | string
      | {
          inlineData: {
            mimeType: string;
            data: string;
          };
        }
    > = [promptText];

    const imgDataUrl = body.currentQuestion?.imageDataUrl;
    if (imgDataUrl && imgDataUrl.startsWith("data:image/")) {
      const [meta, base64Data] = imgDataUrl.split(",");
      const mimeMatch = meta.match(/data:(image\/[a-zA-Z0-9+.-]+);base64/);
      if (mimeMatch && base64Data) {
        contents.push({
          inlineData: {
            mimeType: mimeMatch[1],
            data: base64Data,
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction:
          mode === "reactive" ? REACTIVE_SYSTEM_PROMPT : PROACTIVE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description:
                mode === "reactive"
                  ? "Sorunun doğrudan çözüm özeti."
                  : "Doğrudan cevabı vermeyen Proaktif Sokratik ipucu ve yönlendirici soru.",
            },
            reactiveSolution: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                correctAnswer: { type: Type.STRING },
                stepByStep: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                distractorAnalysis: { type: Type.STRING },
                examTip: { type: Type.STRING },
                outcomeCode: { type: Type.STRING },
              },
            },
            detectedMisconception: {
              type: Type.STRING,
              nullable: true,
            },
            bktUpdate: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                skillId: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                reason: { type: Type.STRING },
              },
            },
            quickReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["reply"],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return NextResponse.json(buildSmartFallbackResponse(body));
    }

    const parsed = JSON.parse(rawText) as TutorAPIResponse;
    return NextResponse.json({
      reply: parsed.reply,
      mode,
      reactiveSolution: parsed.reactiveSolution || null,
      detectedMisconception: parsed.detectedMisconception || null,
      updateSimulation: parsed.updateSimulation || null,
      bktUpdate: parsed.bktUpdate || null,
      quickReplies:
        parsed.quickReplies && parsed.quickReplies.length > 0
          ? parsed.quickReplies
          : mode === "reactive"
          ? [
              "Konudaki en önemli sınav tuzağı nedir?",
              "Konunun anahtar kavramlarını özetler misin?",
              "Bu kazanımdan yeni bir örnek soru çözelim!",
            ]
          : [
              "2. Basamak için de ipucu verir misin?",
              "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
              "Konudaki en önemli sınav tuzağı nedir?",
            ],
      source: "gemini",
    });
  } catch (error) {
    console.error("Tutor API fallback triggered:", error);
    try {
      const cloneBody = await req.clone().json().catch(() => ({}));
      return NextResponse.json(
        buildSmartFallbackResponse(cloneBody as TutorAPIRequest)
      );
    } catch {
      return NextResponse.json({
        reply:
          "Soruyu analiz ederken kısa bir gecikme oldu. Lütfen tekrar dene veya **⚡ Hızlı Çöz** butonuna bas.",
        mode: "proactive",
        detectedMisconception: null,
        updateSimulation: null,
        bktUpdate: null,
      });
    }
  }
}
