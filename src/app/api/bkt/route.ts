import { NextRequest, NextResponse } from "next/server";
import {
  BKTParams,
  computeBKTBreakdown,
  getMasteryStatus,
  updateBKT,
} from "@/lib/bkt-engine";
import { INITIAL_SKILLS } from "@/lib/curriculum-graph";

export async function GET() {
  return NextResponse.json({
    skills: INITIAL_SKILLS,
    description:
      "Bayesian Knowledge Tracing (BKT) MEB F.7.3.1 Kütle ve Ağırlık kazanım parametreleri",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      params,
      isCorrect,
      skillId = "F.7.3.1.1",
    }: {
      params?: Partial<BKTParams>;
      isCorrect?: boolean;
      skillId?: string;
    } = body;

    const defaultParams =
      INITIAL_SKILLS[skillId]?.params || INITIAL_SKILLS["F.7.3.1.1"].params;

    const validatedParams: BKTParams = {
      pL:
        typeof params?.pL === "number"
          ? Math.min(0.99, Math.max(0.01, params.pL))
          : defaultParams.pL,
      pT:
        typeof params?.pT === "number"
          ? Math.min(0.99, Math.max(0.01, params.pT))
          : defaultParams.pT,
      pS:
        typeof params?.pS === "number"
          ? Math.min(0.49, Math.max(0.01, params.pS))
          : defaultParams.pS,
      pG:
        typeof params?.pG === "number"
          ? Math.min(0.49, Math.max(0.01, params.pG))
          : defaultParams.pG,
    };

    const correctFlag = Boolean(isCorrect);
    const nextPL = updateBKT(validatedParams, correctFlag);
    const breakdown = computeBKTBreakdown(validatedParams, correctFlag);
    const status = getMasteryStatus(nextPL);

    return NextResponse.json({
      skillId,
      isCorrect: correctFlag,
      previousPL: validatedParams.pL,
      newPL: nextPL,
      breakdown,
      masteryStatus: status,
    });
  } catch (error) {
    console.error("BKT API Error:", error);
    return NextResponse.json(
      { error: "BKT hesaplaması sırasında geçersiz istek gövdesi." },
      { status: 400 }
    );
  }
}
