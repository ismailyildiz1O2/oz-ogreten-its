import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";

/**
 * Basit ZIP okuyucu ile .docx (word/document.xml) içerisindeki metinleri ayrıştırır.
 */
function extractTextFromDocxBuffer(buf: Buffer): string {
  try {
    let offset = 0;
    while (offset + 30 < buf.length) {
      // Local file header signature = 0x04034b50
      if (buf.readUInt32LE(offset) !== 0x04034b50) {
        offset++;
        continue;
      }
      const compressionMethod = buf.readUInt16LE(offset + 8);
      const compressedSize = buf.readUInt32LE(offset + 18);
      const fileNameLength = buf.readUInt16LE(offset + 26);
      const extraFieldLength = buf.readUInt16LE(offset + 28);

      const fileName = buf
        .subarray(offset + 30, offset + 30 + fileNameLength)
        .toString("utf8");
      const dataStart = offset + 30 + fileNameLength + extraFieldLength;

      if (fileName === "word/document.xml" && compressedSize > 0) {
        const compressedData = buf.subarray(
          dataStart,
          dataStart + compressedSize
        );
        const xmlBuf =
          compressionMethod === 8
            ? zlib.inflateRawSync(compressedData)
            : compressedData;
        const xml = xmlBuf.toString("utf8");

        const text = xml
          .replace(/<\/w:p>/g, "\n")
          .replace(/<w:tab\/>/g, "\t")
          .replace(/<w:br[^/>]*\/>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        if (text) return text;
      }

      offset = dataStart + Math.max(1, compressedSize);
    }
  } catch (err) {
    console.error("DOCX parse error:", err);
  }
  return "";
}

/**
 * PDF içerisindeki sıkıştırılmış veya düz metin akışlarını (BT..ET, Tj, TJ) ayrıştırır.
 */
function decodePdfLiteralString(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function extractTextFromPdfStream(content: string): string[] {
  const parts: string[] = [];
  // (text) Tj veya [(text) -10 (text2)] TJ kalıplarını yakala
  const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = tjRegex.exec(content)) !== null) {
    parts.push(decodePdfLiteralString(m[1]));
  }

  const arrRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((m = arrRegex.exec(content)) !== null) {
    const inner = m[1];
    const litRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
    let lm: RegExpExecArray | null;
    const line: string[] = [];
    while ((lm = litRegex.exec(inner)) !== null) {
      line.push(decodePdfLiteralString(lm[1]));
    }
    if (line.length > 0) {
      parts.push(line.join(""));
    }
  }
  return parts;
}

function extractTextFromPdfBuffer(buf: Buffer): string {
  try {
    const collected: string[] = [];
    const rawLatin = buf.toString("latin1");

    // 1. Düz akışları tara
    collected.push(...extractTextFromPdfStream(rawLatin));

    // 2. FlateDecode sıkıştırılmış stream bloklarını aç ve tara
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let sm: RegExpExecArray | null;
    while ((sm = streamRegex.exec(rawLatin)) !== null) {
      const streamBytes = Buffer.from(sm[1], "latin1");
      try {
        const inflated = zlib.inflateSync(streamBytes).toString("utf8");
        collected.push(...extractTextFromPdfStream(inflated));
      } catch {
        // Sıkıştırılmamış veya farklı filtreli akış
      }
    }

    const joined = collected
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    return joined;
  } catch (err) {
    console.error("PDF parse error:", err);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadı." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (fileName.endsWith(".docx")) {
      extractedText = extractTextFromDocxBuffer(buffer);
    } else if (fileName.endsWith(".pdf")) {
      extractedText = extractTextFromPdfBuffer(buffer);
    } else if (
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".doc")
    ) {
      extractedText = buffer
        .toString("utf8")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]+/g, " ")
        .trim();
    }

    return NextResponse.json({
      fileName: file.name,
      text:
        extractedText ||
        `[${file.name} dosyası yüklendi. Dosya içeriğindeki soruyu buraya ekleyebilir veya doğrudan çözümü başlatabilirsiniz.]`,
      success: Boolean(extractedText),
    });
  } catch (error) {
    console.error("Dosya okuma hatası:", error);
    return NextResponse.json(
      { error: "Dosya okunurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
