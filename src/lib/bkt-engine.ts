export interface BKTParams {
  pL: number; // Mevcut öğrenme olasılığı P(L_n)
  pT: number; // Öğrenme geçiş olasılığı P(T) - Örn: 0.15
  pS: number; // Dikkatsizlik hatası (Slip) P(S) - Örn: 0.10
  pG: number; // Tahmin etme (Guess) P(G) - Örn: 0.20
}

export function updateBKT(params: BKTParams, isCorrect: boolean): number {
  const { pL, pT, pS, pG } = params;

  // 1. Gözlemlenen cevaba göre arka (posterior) olasılık hesabı
  let pL_given_obs: number;
  if (isCorrect) {
    const num = pL * (1 - pS);
    const den = num + (1 - pL) * pG;
    pL_given_obs = num / den;
  } else {
    const num = pL * pS;
    const den = num + (1 - pL) * (1 - pG);
    pL_given_obs = num / den;
  }

  // 2. Öğrenme geçişi sonrası yeni ustalık olasılığı P(L_{n+1})
  const pL_next = pL_given_obs + (1 - pL_given_obs) * pT;

  // 0.01 ile 0.99 arasında sınırla
  return Math.min(0.99, Math.max(0.01, Number(pL_next.toFixed(4))));
}

/**
 * Gözlemlenen yanıt sonrası hem ara arka olasılığı P(L_n | Obs)
 * hem de geçiş sonrası P(L_{n+1}) değerini detaylı döndürür.
 */
export function computeBKTBreakdown(params: BKTParams, isCorrect: boolean) {
  const { pL, pT, pS, pG } = params;
  let posterior: number;
  if (isCorrect) {
    const num = pL * (1 - pS);
    const den = num + (1 - pL) * pG;
    posterior = num / den;
  } else {
    const num = pL * pS;
    const den = num + (1 - pL) * (1 - pG);
    posterior = num / den;
  }

  const nextPL = updateBKT(params, isCorrect);

  return {
    prior: pL,
    posterior: Number(posterior.toFixed(4)),
    nextPL,
    delta: Number((nextPL - pL).toFixed(4)),
  };
}

export function getMasteryStatus(pL: number): {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  isMastered: boolean;
} {
  if (pL >= 0.85) {
    return {
      label: "Ustalaştı (Mastered)",
      color: "#10b981",
      bgClass: "bg-emerald-500/15 border-emerald-500/40",
      textClass: "text-emerald-400",
      isMastered: true,
    };
  }
  if (pL >= 0.6) {
    return {
      label: "Gelişiyor (Developing)",
      color: "#f59e0b",
      bgClass: "bg-amber-500/15 border-amber-500/40",
      textClass: "text-amber-400",
      isMastered: false,
    };
  }
  return {
    label: "Başlangıç (Novice)",
    color: "#6366f1",
    bgClass: "bg-indigo-500/15 border-indigo-500/40",
    textClass: "text-indigo-400",
    isMastered: false,
  };
}
