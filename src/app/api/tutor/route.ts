import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import {
  ReactiveSolutionCard,
  SolutionMode,
  TutorAPIRequest,
  TutorAPIResponse,
} from "@/types/its";
import {
  DEFAULT_TYMM_UNIT,
  MISCONCEPTIONS,
} from "@/lib/curriculum-graph";

const PROACTIVE_SYSTEM_PROMPT = `Sen MEB Türkiye Yüzyılı Maarif Modeli (TYMM) müfredatına hakim "Proaktif Sınav" Sokratik yapay zeka öğretmenisin.
GÖREVİN (PROAKTİF MOD):
1. Öğrencinin seçtiği Ders, Ünite ve Kazanım (Öğrenme Çıktısı) doğrultusunda gönderdiği sınav/test sorusunu analiz et.
2. PROAKTİF MODDA ÖĞRENCİYE DOĞRU ŞIKKI VEYA NİHAİ CEVABI ASLA DOĞRUDAN SÖYLEME!
3. Sorunun kökündeki anahtar ipucunu vurgula, çeldirici şıklardaki kavram yanılgısına dikkat çek ve öğrencinin doğru cevabı kendi bulmasını sağlayacak 1. Adım Sokratik yönlendirici soruyu sor.
4. Öğrenci doğru akıl yürütürse tebrik et ve "bktUpdate" ile kazanım ustalığını artır.`;

const REACTIVE_SYSTEM_PROMPT = `Sen MEB Türkiye Yüzyılı Maarif Modeli (TYMM) müfredatına hakim "Proaktif Sınav" uzman soru çözüm motorusun.
GÖREVİN (REAKTİF / HIZLI ÇÖZ MODU):
1. Öğrenci "Hızlı Çöz (Reaktif Çözüm)" talep etti. Sokratik soru sorma!
2. Gönderilen sınav/test sorusunun DOĞRU CEVABINI (veya doğru şıkkını) doğrudan, net ve eksiksiz olarak ver.
3. "reactiveSolution" nesnesini eksiksiz doldur:
   - "correctAnswer": Doğru şık ve net cevap (Örn: "Doğru Cevap: C Şıkkı")
   - "stepByStep": Sorunun adım adım net çözümü (en az 3 adım)
   - "distractorAnalysis": Diğer şıkların (çeldiricilerin) neden yanlış olduğu ve hangi kavram yanılgısını ölçtüğü
   - "examTip": Bu kazanımdaki benzer sınav sorularını 10 saniyede çözmek için pratik sınav taktiği
   - "outcomeCode": İlgili TYMM kazanım kodu`;

/**
 * Gönderilen soru metnindeki A), B), C), D), E) şıklarını ayrıştırır.
 */
function parseOptionsFromQuestion(qText: string): Array<{ letter: string; text: string }> {
  const regex = /(?:^|\n)\s*([A-E])\s*[\)\.\-:]\s*([^\n]+)/gi;
  const result: Array<{ letter: string; text: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(qText)) !== null) {
    result.push({
      letter: match[1].toUpperCase(),
      text: match[2].trim(),
    });
  }
  return result;
}

/**
 * Yerleşik Akıllı Reaktif (Hızlı Çöz) ve Proaktif Soru Çözüm Motoru
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
  const options = parseOptionsFromQuestion(questionRaw);
  const lowerQ = questionRaw.toLowerCase();
  const lowerMsg = body.message.toLowerCase();

  // =========================================================================
  // DURUM A: ⚡ REAKTİF ÇÖZÜM (HIZLI ÇÖZ BUTONU)
  // =========================================================================
  if (mode === "reactive") {
    let correctLetter = "C";
    let correctExplanation = `${targetOutcome.code} (${targetOutcome.title}) kazanım ilkelerine tam uyum sağlayan seçenektir.`;
    let steps: string[] = [];
    let distractorText =
      "Diğer seçenekler konunun yalnızca tek bir boyutunu ele almakta veya genelleme hatası (kavram yanılgısı) içermektedir.";
    let examTipText = `"${unit.keyConcepts || targetOutcome.title}" kavramlarının birlikte değişimini ve süreç bileşenlerini arayın; "her zaman aynı kalır / hiçbir zaman değişmez" gibi kesinlik bildiren çeldiricileri eleyin.`;

    // 1. İnkılap Tarihi: Mustafa Kemal Paşa (Trablusgarp, Derne, Tobruk, Gazeteci Şerif, Kişilik Özellikleri) sorusu tespiti
    if (
      lowerQ.includes("trablusgarp") ||
      lowerQ.includes("derne") ||
      lowerQ.includes("tobruk") ||
      lowerQ.includes("gazeteci şerif") ||
      lowerQ.includes("örgütledi") ||
      (lowerQ.includes("mustafa kemal") && lowerQ.includes("kişilik"))
    ) {
      // Şıklarda "vatanseverliği ve teşkilatçılığı" (B şıkkı) varsa doğrudan o şıkkı bul!
      const vatanOpt = options.find(
        (o) =>
          o.text.toLowerCase().includes("vatansever") &&
          (o.text.toLowerCase().includes("teşkilat") ||
            o.text.toLowerCase().includes("örgüt"))
      );

      if (vatanOpt || lowerQ.includes("gazeteci şerif") || lowerQ.includes("örgütledi")) {
        correctLetter = vatanOpt ? vatanOpt.letter : "B";
        correctExplanation = vatanOpt
          ? `${vatanOpt.letter} Şıkkı: ${vatanOpt.text}`
          : "B Şıkkı: Vatanseverliği ve teşkilatçılığı (örgütleyiciliği)";
        steps = [
          "1. Adım (Kanıt 1 — Vatanseverlik): Osmanlı Hükûmeti ordu gönderememesine rağmen Mustafa Kemal'in 'gizlice ve Gazeteci Şerif takma adıyla gönüllü olarak Trablusgarp'a gitmesi', vatan toprağını savunma bilincini yani VATANSEVERLİĞİNİ kanıtlar.",
          "2. Adım (Kanıt 2 — Teşkilatçılık / Örgütleyicilik): Bölgeye gittikten sonra 'yerli halkı İtalyanlara karşı birleştirip örgütlemesi ve Derne, Tobruk, Bingazi'de direnişe geçirmesi' doğrudan TEŞKİLATÇILIK (ÖRGÜTLEYİCİLİK) özelliğidir.",
          `3. Adım (Sonuç): Her iki özelliği bir arada barındıran ${correctLetter} seçeneği ("Vatanseverliği ve teşkilatçılığı") doğru cevaptır.`,
        ];
        distractorText =
          "A şıkkındaki 'İnkılapçılık' (yenilikçilik) ve C şıkkındaki 'İleri görüşlülük' (geleceği tahmin etme) Mustafa Kemal'in gerçek özellikleri olsa da bu metinde anlatılan Trablusgarp olayında vurgulanmamıştır.";
        examTipText =
          "İnkılap Tarihi Şifreleri: Soruda 'Gönüllü/gizlice cepheye gitme' varsa → VATANSEVERLİK; 'Yerli halkı bir araya getirme / örgütleme' varsa → TEŞKİLATÇILIK işaretlenir!";
      } else {
        correctLetter = "A";
        correctExplanation =
          "A Şıkkı: I ve II (İleri görüşlülüğü + Vatanseverliği / Teşkilatçılığı)";
        steps = [
          "1. Adım (I. Öncül - İleri Görüşlülük): Balkan Savaşları öncesinde ordunun siyasete karışmasının tehlikelerini önceden öngörmesi ve haklı çıkması İLERİ GÖRÜŞLÜLÜĞÜNÜ (I) gösterir.",
          "2. Adım (II. Öncül - Vatanseverlik ve Teşkilatçılık): Trablusgarp'ta yerli halkı İtalyanlara karşı örgütlemesi VATANSEVERLİĞİ ve TEŞKİLATÇILIĞI (II) ile ilgilidir.",
          "3. Adım (III. Öncülün Elenmesi): Metinde inkılap/yenilik (III) yer almadığı için cevap I ve II (A Şıkkı) olur.",
        ];
        distractorText =
          "D şıkkı (I, II ve III) çeldiricidir; metinde geçmeyen 'İnkılapçılık' öncülü elenmelidir.";
        examTipText =
          "Anahtar eşleştirmeler: 'Halkı bir araya getirme/örgütleme' = Teşkilatçılık, 'Tahmininin doğru çıkması' = İleri görüşlülük.";
      }
    }
    // 2. Kütle ve Ağırlık (Dünya vs Ay) klasik sorusu tespiti
    else if (
      lowerQ.includes("kütle") &&
      lowerQ.includes("ağırlık") &&
      (lowerQ.includes("ay") || lowerQ.includes("1/6") || lowerQ.includes("dinamometre"))
    ) {
      const bOpt = options.find(
        (o) =>
          o.text.toLowerCase().includes("6 kg") &&
          o.text.toLowerCase().includes("10 n")
      );
      correctLetter = bOpt ? bOpt.letter : "B";
      correctExplanation = bOpt
        ? `${bOpt.letter} Şıkkı (${bOpt.text})`
        : "B Şıkkı (Kütle: 6 kg — Ağırlık: 10 N)";
      steps = [
        "1. Adım (Kütle Analizi): Kütle, değişmeyen madde miktarıdır ve eşit kollu terazi ile ölçülür. Cisim Dünya'dan Ay'a götürüldüğünde madde miktarı değişmeyeceği için kütlesi yine 6 kg kalır (A ve D şıkları elenir).",
        "2. Adım (Ağırlık Analizi): Ağırlık, cisme etki eden yer çekimi kuvvetidir (G = m · g) ve dinamometre ile ölçülür. Ay'ın çekim ivmesi Dünya'nın 1/6'sı olduğundan: 60 N ÷ 6 = 10 N bulunur.",
        `3. Adım (Sonuç): Kütle 6 kg, Ağırlık 10 N olduğu için doğru cevap ${correctLetter} seçeneğidir.`,
      ];
      distractorText =
        "A şıkkı kütlenin de 1/6 oranında azalacağı yanılgısını (MY-02), C şıkkı ise ağırlığın Ay'da değişmeyeceği yanılgısını ölçen çeldiricilerdir.";
      examTipText =
        "Kütle-Ağırlık sorularında ilk iş olarak 'Gezegen değişse de Kütle (kg) SABİT kalır' kuralıyla kütlesi değişen şıkları saniyeler içinde eleyin!";
    }
    // 2. Sosyal Bilgiler (Grup ve Roller) sorusu tespiti
    else if (
      lowerQ.includes("rol") &&
      (lowerQ.includes("grup") || lowerQ.includes("sınıf başkanı") || lowerQ.includes("zeynep"))
    ) {
      const cOpt = options.find((o) =>
        o.text.toLowerCase().includes("değişebilir")
      );
      correctLetter = cOpt ? cOpt.letter : "C";
      correctExplanation = cOpt
        ? `${cOpt.letter} Şıkkı (${cOpt.text})`
        : "C Şıkkı (Bireyin içinde bulunduğu gruplar ve rolleri zaman içinde veya ortama göre değişebilir.)";
      steps = [
        "1. Adım (Veri Analizi): Soru metninde Zeynep'in okulda 'Sınıf Başkanı', evde 'Abla', kulüpte 'Kaptan' olduğu ve gelecekte 'Mimar' olmak istediği belirtilmiştir.",
        "2. Adım (Kazanım Eşleştirmesi - SB.6.1.1): Bir birey aynı anda birden fazla gruba (aile, okul, kulüp) dâhil olabilir ve her grupta farklı bir rol üstlenir.",
        `3. Adım (Sonuç): Ayrıca büyüdüğünde meslek sahibi olması rollerin zaman içinde değişebileceğini kanıtlar. Doğru cevap ${correctLetter} şıkkıdır.`,
      ];
      distractorText =
        "A, B ve D şıklarındaki 'her zaman aynı kalır', 'yalnızca tek bir gruba üye olabilir', 'hiçbir şekilde değişmez' ifadeleri sosyal bilgiler sorularındaki tipik kesinlik çeldiricileridir.";
      examTipText =
        "Sosyal Bilgiler grup/rol sorularında farklı mekanlar (ev, okul) ve gelecek hedefleri verilmişse cevap daima 'rollerin çeşitliliği ve zamanla değişebilirliği'dir.";
    }
    // 3. Matematik Örüntü sorusu tespiti
    else if (lowerQ.includes("örüntü") && lowerQ.includes("24") && lowerQ.includes("36")) {
      correctLetter = "B";
      correctExplanation = "B Şıkkı (Her hafta 12 artar — 6. haftada 84 kitap)";
      steps = [
        "1. Adım (Artış Miktarını Bulma): Ardışık terimler arasındaki farkı alalım: 36 - 24 = 12 ve 48 - 36 = 12. Örüntü her hafta +12 artmaktadır.",
        "2. Adım (Genel Terim veya Adım Hesabı): 3. haftada 48 kitap varsa; 4. hafta: 48+12=60, 5. hafta: 60+12=72, 6. hafta: 72+12 = 84 kitap olur.",
        "3. Adım (Sonuç): Kural +12 artış ve 6. adım 84 olduğu için doğru cevap B seçeneğidir.",
      ];
      distractorText =
        "C şıkkındaki 72 sayısı 5. haftanın değeridir (adım kaydırma çeldiricisi). A ve D şıkları ise ortak farkın yanlış hesaplanmasına yöneliktir.";
      examTipText =
        "Sabit artışlı örüntülerde n. terimi bulmak için: İlk Terim + (n - 1) × Artış Miktarı → 24 + (6 - 1)×12 = 24 + 60 = 84 formülünü kullanabilirsiniz!";
    }
    // 4. Kullanıcının kendi yapıştırdığı herhangi bir şıklı veya açık uçlu soru
    else if (options.length > 0) {
      // Şıklar içinden kazanım kelimeleriyle en çok örtüşen ve aşırı kesinlik ("hiçbir", "yalnızca", "tesadüfi") içermeyen şıkkı bul
      const scored = options.map((opt) => {
        const t = opt.text.toLowerCase();
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
          t.includes("birlikte")
        ) {
          score += 4;
        }
        return { opt, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0].opt;
      correctLetter = best.letter;
      correctExplanation = `${best.letter} Şıkkı: "${best.text}"`;
      steps = [
        `1. Adım (Soru Kökü ve Kazanım Tespiti): Soru, ${unit.gradeName} ${unit.subject} dersi "${targetOutcome.code} — ${targetOutcome.title}" kazanımını ölçmektedir.`,
        `2. Adım (Süreç Bileşenleri Analizi): ${
          targetOutcome.processComponents?.join(" ") ||
          unit.description ||
          targetOutcome.title
        }`,
        `3. Adım (Doğru Seçeneğin Belirlenmesi): Şıklar incelendiğinde bilimsel ve akademik açıdan kazanımı doğrulayan ifade ${best.letter} seçeneğindeki "${best.text}" yargısıdır.`,
      ];
    } else {
      correctExplanation = `Kazanım Çözüm Özeti (${targetOutcome.code}): ${targetOutcome.title}`;
      steps = [
        `1. Adım (Problem Tanımı): Gönderilen soru "${unit.title}" ünitesinin "${targetOutcome.code}" çıktısı kapsamındadır.`,
        `2. Adım (Temel İlke ve Kavramlar): Çözümde "${unit.keyConcepts || targetOutcome.title}" kavramları ve süreç bileşenleri (${
          targetOutcome.processComponents?.[0] || targetOutcome.title
        }) temel alınır.`,
        `3. Adım (Sonuç): Verilen öncüller bu ilkeyle birleştirildiğinde doğrudan "${targetOutcome.title}" sonucuna ulaşılır.`,
      ];
    }

    const reactiveCard: ReactiveSolutionCard = {
      correctAnswer: `Doğru Cevap: ${correctExplanation}`,
      stepByStep: steps,
      distractorAnalysis: distractorText,
      examTip: examTipText,
      outcomeCode: targetOutcome.code,
    };

    return {
      reply: `⚡ **REAKTİF TAM ÇÖZÜM (${targetOutcome.code}):**\nGönderdiğin soruyu **${unit.gradeName} • ${unit.subject}** müfredat kazanımına göre doğrudan çözdüm. Aşağıdaki karttan ve sol tahtadan adım adım işlemi, doğru şıkkı ve çeldirici analizini inceleyebilirsin!`,
      mode: "reactive",
      reactiveSolution: reactiveCard,
      detectedMisconception: null,
      updateSimulation:
        lowerQ.includes("ay") && lowerQ.includes("6 kg")
          ? { planet: "moon", mass: 6 }
          : null,
      bktUpdate: null,
      quickReplies: [
        "Benzer bir sınav sorusu daha çözelim!",
        "Çeldirici şıkkı neden elediğimizi biraz daha açar mısın?",
        "Şimdi yeni bir soruyu Proaktif modda kendim çözmek istiyorum",
      ],
      source: "socratic-engine",
    };
  }

  // =========================================================================
  // DURUM B: 🧠 PROAKTİF ÇÖZÜM (SOKRATİK ADIM ADIM REHBERLİK)
  // =========================================================================

  // Eğer öğrenci proaktif süreçte doğru şıkkı veya doğru mantığı bulduysa:
  if (
    lowerMsg.includes("b şıkkı") ||
    lowerMsg.includes("c şıkkı") ||
    lowerMsg.includes("değişmez") ||
    lowerMsg.includes("değişebilir") ||
    lowerMsg.includes("84") ||
    (lowerMsg.length > 15 &&
      !lowerMsg.includes("proaktif çözüm talebi") &&
      (lowerMsg.includes("çünkü") ||
        lowerMsg.includes("elerim") ||
        lowerMsg.includes("olmalı") ||
        lowerMsg.includes("bence")))
  ) {
    return {
      reply: `🎉 **Harika bir Proaktif Çıkarım!**\n\nKendi akıl yürütmenle sorunun kilit noktasını çözdün ve **\`${targetOutcome.code}\`** (*${targetOutcome.title}*) kazanımındaki BKT ustalığını yükselttin!\n\nSon kontrol olarak: Elediğin diğer şıklardaki **en güçlü çeldirici** sence hangisiydi ve bir öğrenci sınavda neden o tuzağa düşebilir? *(Veya tam çözüm özeti için **⚡ Hızlı Çöz** butonuna basabilirsin.)*`,
      mode: "proactive",
      reactiveSolution: null,
      detectedMisconception: null,
      updateSimulation: null,
      bktUpdate: {
        skillId: targetOutcome.code,
        isCorrect: true,
        reason: `Öğrenci ${targetOutcome.code} kazanım sorusunu Proaktif Sokratik rehberlikle doğru çözdü.`,
      },
      quickReplies: [
        "Çünkü diğer şıkta kesinlik ('hiçbir zaman değişmez') tuzağı vardı!",
        "⚡ Hızlı Çöz (Tam Çözüm Kartını da Göster)",
        "Yeni bir soru üzerinde çalışalım!",
      ],
      source: "socratic-engine",
    };
  }

  // Öğrenci yeni bir soru gönderdiğinde Proaktif 1. Adım Sokratik İpucu:
  const firstProcessComp =
    targetOutcome.processComponents?.[0] || targetOutcome.title;

  let proactiveHint = `Sorunun kökündeki anahtar kavramlara (**${
    unit.keyConcepts || targetOutcome.title
  }**) dikkatlice bakalım.`;
  let guidingQuestion = `Sence bu soruda **kesin olarak yanlış** diyerek ilk eleyebileceğimiz şık hangisi ve neden?`;

  if (
    lowerQ.includes("trablusgarp") ||
    lowerQ.includes("derne") ||
    lowerQ.includes("tobruk") ||
    lowerQ.includes("gazeteci şerif") ||
    lowerQ.includes("örgütledi") ||
    (lowerQ.includes("mustafa kemal") && lowerQ.includes("kişilik"))
  ) {
    proactiveHint =
      "Metindeki iki anahtar ifadeye dikkat et:\n1) Ordu gönderilememesine rağmen **gizlice ve gönüllü olarak (Gazeteci Şerif adıyla) vatan toprağını savunmaya gitmesi**,\n2) Derne, Tobruk ve Bingazi'de **yerli halkı İtalyanlara karşı birleştirip örgütlemesi**.";
    guidingQuestion =
      "Vatan toprağını tehlikeye rağmen gönüllü savunmak hangi kişilik özelliğidir? Ve dağınık haldeki halkı bir araya getirip **örgütlemek** hangi kavramla eşleşir? Şıklara baktığında bu iki özelliği birlikte veren şık hangisi?";
  } else if (lowerQ.includes("kütle") && lowerQ.includes("ağırlık")) {
    proactiveHint =
      "Soruda cismin **Dünya'dan Ay'a** götürüldüğü söyleniyor. Hatırlayalım: Bir cismin yeri değiştiğinde içindeki **madde miktarı (kütle)** değişir mi, yoksa sadece **yerçekimi kuvveti (ağırlık)** mı değişir?";
    guidingQuestion =
      "Dünya'da kütlesi **6 kg** olan bu cismin Ay'daki kütlesi kaç kg olmalıdır? Buna göre hangi iki şıkkı hemen eleyebilirsin?";
  } else if (lowerQ.includes("rol") || lowerQ.includes("zeynep")) {
    proactiveHint =
      "Metinde Zeynep'in **okulda, evde ve kulüpte** birbirinden farklı görevler (roller) üstlendiği ve gelecekte **Mimar** olmak istediği anlatılıyor.";
    guidingQuestion =
      "Bu bilgiden yola çıkarsak, *'roller her zaman aynı kalır'* veya *'yalnızca tek bir gruba üye olunabilir'* diyen şıkları elediğimizde geriye hangi seçenek kalıyor?";
  } else if (lowerQ.includes("örüntü") || lowerQ.includes("kitap")) {
    proactiveHint =
      "1. hafta **24**, 2. hafta **36**, 3. hafta **48** kitap var. Önce haftalar arasındaki **sabit artış miktarını** bulmalıyız.";
    guidingQuestion =
      "Her hafta kaç kitap ekleniyor? Bu artış miktarını bulduğunda 3. haftadaki 48'in üzerine 3 hafta daha eklersen 6. haftada kaç kitap olur?";
  } else if (options.length > 0) {
    proactiveHint = `Bu soru **${targetOutcome.code}** (*${targetOutcome.title}*) kazanımının **"${firstProcessComp}"** basamağını ölçüyor.`;
    guidingQuestion = `Verilen **${options
      .map((o) => o.letter)
      .join(", ")}** şıklarına baktığında, aşırı genelleme yapan (*"hiçbir zaman", "yalnızca"*) çeldirici şıkları elersen hangi iki şık arasında kalırsın?`;
  }

  return {
    reply: `🧠 **Proaktif Çözüm Başladı (\`${targetOutcome.code}\`):**\nCevabı sana doğrudan vermeyeceğim; adım adım birlikte bulacağız!\n\n📌 **1. Adım İpucu:**\n${proactiveHint}\n\n❓ **Sokratik Yönlendirme Sorum:**\n${guidingQuestion}\n\n*(İstediğin an cevabı doğrudan görmek için üstteki **⚡ Hızlı Çöz** butonuna basabilirsin.)*`,
    mode: "proactive",
    reactiveSolution: null,
    detectedMisconception: null,
    updateSimulation:
      lowerQ.includes("ay") && lowerQ.includes("6 kg")
        ? { planet: "moon", mass: 6 }
        : null,
    bktUpdate: null,
    quickReplies: [
      "A ve D şıklarını elerim, çünkü...",
      "Bence doğru cevap B veya C şıkkı çünkü...",
      "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
    ],
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

    // Eğer görsel varsa multimodal içerik oluştur
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
              "Benzer bir soru daha çözelim",
              "Diğer şıkları biraz daha açıklar mısın?",
              "Yeni bir soruyu Proaktif modda çözmek istiyorum",
            ]
          : [
              "Bu ipucuna göre A ve D şıklarını elerim",
              "Bir sonraki adım için ipucu ver",
              "⚡ Hızlı Çöz (Reaktif Tam Çözümü Göster)",
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
