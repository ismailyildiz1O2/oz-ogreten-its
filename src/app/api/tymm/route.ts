import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { TymmCatalog, TymmCodeItem, TymmUnitDetail } from "@/types/its";

let cachedCatalog: TymmCatalog | null = null;
let cachedCodesMap: Map<string, TymmCodeItem> | null = null;

function getCodesMap(): Map<string, TymmCodeItem> {
  if (cachedCodesMap) return cachedCodesMap;
  const codesPath = path.join(process.cwd(), "public", "tymm", "codes.json");
  const raw = fs.readFileSync(codesPath, "utf8");
  const list: TymmCodeItem[] = JSON.parse(raw);
  const map = new Map<string, TymmCodeItem>();
  for (const item of list) {
    map.set(item.code.trim().toUpperCase(), item);
  }
  cachedCodesMap = map;
  return map;
}

function getCatalog(): TymmCatalog {
  if (cachedCatalog) return cachedCatalog;
  const catalogPath = path.join(
    process.cwd(),
    "public",
    "tymm",
    "catalog.json"
  );
  const raw = fs.readFileSync(catalogPath, "utf8");
  cachedCatalog = JSON.parse(raw) as TymmCatalog;
  return cachedCatalog;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unitIdParam = searchParams.get("unitId");

    // Eğer unitId verilmişse ilgili ünitenin detayını ve çözümlenmiş beceri kodlarını döndür
    if (unitIdParam) {
      const unitId = Number(unitIdParam);
      if (isNaN(unitId)) {
        return NextResponse.json(
          { error: "Geçersiz unitId parametresi" },
          { status: 400 }
        );
      }

      const unitPath = path.join(
        process.cwd(),
        "public",
        "tymm",
        "units",
        `${unitId}.json`
      );

      if (!fs.existsSync(unitPath)) {
        return NextResponse.json(
          { error: `Ünite dosyası bulunamadı: ${unitId}` },
          { status: 404 }
        );
      }

      const unitRaw = fs.readFileSync(unitPath, "utf8");
      const unitData: TymmUnitDetail = JSON.parse(unitRaw);
      const codesMap = getCodesMap();

      const allSkillCodes = new Set<string>();
      if (unitData.skills) {
        Object.values(unitData.skills).forEach((arr) => {
          if (Array.isArray(arr)) {
            arr.forEach((c) => allSkillCodes.add(c.trim().toUpperCase()));
          }
        });
      }

      const resolvedSkills: TymmCodeItem[] = [];
      allSkillCodes.forEach((code) => {
        const found = codesMap.get(code);
        if (found) {
          resolvedSkills.push(found);
        } else {
          resolvedSkills.push({
            category: "TYMM Becerisi",
            code,
            label: code,
          });
        }
      });

      unitData.resolvedSkills = resolvedSkills;
      return NextResponse.json({ unit: unitData });
    }

    // Parametre yoksa katalog özetini döndür
    const catalog = getCatalog();
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("TYMM API Error:", error);
    return NextResponse.json(
      { error: "TYMM verileri okunurken hata oluştu." },
      { status: 500 }
    );
  }
}
