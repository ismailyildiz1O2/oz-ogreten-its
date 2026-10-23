"use client";

import React, { useEffect, useRef } from "react";
import { useITSStore } from "@/store/useITSStore";
import { PLANETS } from "@/lib/curriculum-graph";
import { PlanetId } from "@/types/its";
import { Globe, RefreshCw, Sliders, Sparkles } from "lucide-react";

interface PhysicsInternalState {
  springStretch: number;
  springVelocity: number;
  beamAngle: number;
  beamAngularVel: number;
  floatOffset: number;
  stars: Array<{ x: number; y: number; r: number; alpha: number }>;
}

export const PhysicsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    planet,
    gravity,
    mass,
    simulationPulse,
    setPlanet,
    setMass,
    triggerPulse,
  } = useITSStore();

  // Fizik motoru referansı (React re-render'larından bağımsız 60fps simülasyon durumu)
  const physicsRef = useRef<PhysicsInternalState>({
    springStretch: 30,
    springVelocity: 0,
    beamAngle: 0.14,
    beamAngularVel: 0,
    floatOffset: 0,
    stars: Array.from({ length: 42 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 75) / 100,
      r: (i % 3) * 0.7 + 0.8,
      alpha: ((i * 29) % 70) / 100 + 0.25,
    })),
  });

  // Parametre veya pulse değiştiğinde salınım impulsunu tetikle
  useEffect(() => {
    const p = physicsRef.current;
    p.springVelocity -= 8.5;
    p.beamAngle = gravity > 0 ? 0.16 : 0.04;
    p.beamAngularVel = 0;
  }, [planet, gravity, mass, simulationPulse]);

  // HTML5 Canvas requestAnimationFrame döngüsü
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const renderFrame = () => {
      time += 0.025;
      const p = physicsRef.current;
      const planetInfo = PLANETS[planet];
      const weight = mass * gravity; // Newton

      // Canvas DPI ve Boyut Senkronizasyonu
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      if (
        canvas.width !== Math.floor(rect.width * dpr) ||
        canvas.height !== Math.floor(rect.height * dpr)
      ) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const W = rect.width;
      const H = rect.height;

      // 1. Gezegen Gökyüzü Gradyanı
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, planetInfo.skyGradient[0]);
      skyGrad.addColorStop(1, planetInfo.skyGradient[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Yıldızlar ve Atmosfer Parçacıkları
      p.stars.forEach((star, idx) => {
        const twinkle =
          0.35 + 0.65 * Math.abs(Math.sin(time * 0.9 + idx * 1.3));
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x * W, star.y * H, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Zemin Yüzeyi
      const groundH = 44;
      const groundY = H - groundH;
      ctx.fillStyle = planetInfo.surfaceColor;
      ctx.fillRect(0, groundY, W, groundH);

      ctx.strokeStyle = `${planetInfo.color}66`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      // 2. Fizik Diferansiyel Güncellemeleri (Hooke Yasası + Sönümlü Harmonik Salınım)
      // Maksimum ağırlık: 20 kg * 24.79 m/s² ≈ 495.8 N -> Maks uzama ~ 115 px
      const targetStretch = Math.min(118, (weight / 500) * 118);
      const kSpring = 0.14; // Yay sabiti
      const damping = 0.84; // Sönümleme katsayısı
      const springForce = (targetStretch - p.springStretch) * kSpring;
      p.springVelocity = (p.springVelocity + springForce) * damping;
      p.springStretch += p.springVelocity;

      // Terazi kolu sönümlü denge salınımı
      const targetBeamAngle =
        gravity === 0 ? Math.sin(time * 0.8) * 0.05 : 0;
      const kBeam = gravity === 0 ? 0.02 : 0.09 + Math.min(0.12, gravity * 0.005);
      const beamDamp = gravity === 0 ? 0.96 : 0.86;
      const beamTorque = (targetBeamAngle - p.beamAngle) * kBeam;
      p.beamAngularVel = (p.beamAngularVel + beamTorque) * beamDamp;
      p.beamAngle += p.beamAngularVel;

      // Uzayda ağırlıksız süzülme ofseti
      p.floatOffset = gravity === 0 ? Math.sin(time * 1.4) * 6 : 0;

      // ====================================================================
      // SOL BÖLÜM: EŞİT KOLLU TERAZİ (KÜTLE ÖLÇÜMÜ - m)
      // ====================================================================
      const leftCenterX = W * 0.28;
      const baseTopY = groundY;
      const pillarHeight = Math.min(185, H * 0.48);
      const pivotY = baseTopY - pillarHeight;
      const armHalfLen = Math.min(82, W * 0.15);

      // Terazi Başlık Etiketi
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(leftCenterX - 95, 14, 190, 44, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#34d399";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("EŞİT KOLLU TERAZİ (KÜTLE)", leftCenterX, 32);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.fillText(
        gravity === 0
          ? `m = ${mass} kg (g=0: Serbest)`
          : `Ölçülen: m = ${mass.toFixed(1)} kg`,
        leftCenterX,
        49
      );

      // Terazi Tabanı ve Dikmesi
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.roundRect(leftCenterX - 46, baseTopY - 14, 92, 14, 5);
      ctx.fill();

      const pillarGrad = ctx.createLinearGradient(
        leftCenterX - 8,
        pivotY,
        leftCenterX + 8,
        baseTopY
      );
      pillarGrad.addColorStop(0, "#94a3b8");
      pillarGrad.addColorStop(1, "#475569");
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(leftCenterX - 6, pivotY, 12, pillarHeight - 14);

      // Terazi Kolu (Beam)
      ctx.save();
      ctx.translate(leftCenterX, pivotY);
      ctx.rotate(p.beamAngle);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-armHalfLen, 0);
      ctx.lineTo(armHalfLen, 0);
      ctx.stroke();

      // Merkez İbre
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -24);
      ctx.stroke();

      ctx.restore();

      // Merkez Mafsal (Pivot)
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(leftCenterX, pivotY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Sol ve Sağ Kefe Koordinatları
      const leftPanX = leftCenterX - armHalfLen * Math.cos(p.beamAngle);
      const leftPanTopY =
        pivotY - armHalfLen * Math.sin(p.beamAngle) + p.floatOffset;

      const rightPanX = leftCenterX + armHalfLen * Math.cos(p.beamAngle);
      const rightPanTopY =
        pivotY + armHalfLen * Math.sin(p.beamAngle) + p.floatOffset;

      const stringLen = 48;
      const panHalfW = 34;

      // Sol Kefe Askı İpleri ve Tablası
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftPanX, leftPanTopY);
      ctx.lineTo(leftPanX - panHalfW + 6, leftPanTopY + stringLen);
      ctx.moveTo(leftPanX, leftPanTopY);
      ctx.lineTo(leftPanX + panHalfW - 6, leftPanTopY + stringLen);
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(
        leftPanX - panHalfW,
        leftPanTopY + stringLen,
        panHalfW * 2,
        6
      );

      // Sol Kefedeki Test Cismi (m kg)
      const blockSize = Math.min(48, 26 + mass * 1.1);
      const leftBlockY = leftPanTopY + stringLen - blockSize;
      ctx.fillStyle = "#4f46e5";
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        leftPanX - blockSize / 2,
        leftBlockY,
        blockSize,
        blockSize,
        6
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(`${mass} kg`, leftPanX, leftBlockY + blockSize / 2 + 4);

      // Sağ Kefe Askı İpleri ve Tablası (Referans Kütle)
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rightPanX, rightPanTopY);
      ctx.lineTo(rightPanX - panHalfW + 6, rightPanTopY + stringLen);
      ctx.moveTo(rightPanX, rightPanTopY);
      ctx.lineTo(rightPanX + panHalfW - 6, rightPanTopY + stringLen);
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(
        rightPanX - panHalfW,
        rightPanTopY + stringLen,
        panHalfW * 2,
        6
      );

      // Sağ Kefedeki Pirinç Referans Ağırlık
      const refBlockH = Math.min(44, 24 + mass * 1.0);
      const rightBlockY = rightPanTopY + stringLen - refBlockH;
      ctx.fillStyle = "#d97706";
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        rightPanX - blockSize / 2,
        rightBlockY,
        blockSize,
        refBlockH,
        5
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fffbeb";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText(`Ref ${mass}kg`, rightPanX, rightBlockY + refBlockH / 2 + 4);

      // ====================================================================
      // SAĞ BÖLÜM: YAYLI DİNAMOMETRE (AĞIRLIK ÖLÇÜMÜ - G = m·g)
      // ====================================================================
      const rightCenterX = W * 0.73;
      const topSupportY = 68;

      // Dinamometre Başlık Etiketi
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(rightCenterX - 100, 14, 200, 44, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("DİNAMOMETRE (AĞIRLIK)", rightCenterX, 32);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.fillText(`Ölçülen: G = ${weight.toFixed(2)} N`, rightCenterX, 49);

      // Üst Tavan Askı Pabucu
      ctx.fillStyle = "#475569";
      ctx.fillRect(rightCenterX - 42, topSupportY, 84, 8);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rightCenterX, topSupportY + 12, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Dinamometre Dış Silindir Gövdesi ve Ölçek Çizgileri
      const tubeTopY = topSupportY + 18;
      const tubeHeight = 148;
      const tubeWidth = 44;

      ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(
        rightCenterX - tubeWidth / 2,
        tubeTopY,
        tubeWidth,
        tubeHeight,
        8
      );
      ctx.fill();
      ctx.stroke();

      // Newton Ölçek Çizgileri (0 N - 500 N)
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px Inter, sans-serif";
      ctx.textAlign = "left";
      for (let i = 0; i <= 5; i++) {
        const tickY = tubeTopY + 16 + (i / 5) * 116;
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rightCenterX + tubeWidth / 2 - 8, tickY);
        ctx.lineTo(rightCenterX + tubeWidth / 2, tickY);
        ctx.stroke();
        ctx.fillText(
          `${i * 100}N`,
          rightCenterX + tubeWidth / 2 + 5,
          tickY + 3
        );
      }

      // İç Sarmal Yay Çizimi (Hooke Yasasına Göre Dinamik Uzama)
      const springStartY = tubeTopY + 14;
      const currentStretch = Math.max(0, p.springStretch);
      const springEndY = springStartY + 18 + currentStretch;
      const coils = 11;
      const coilAmplitude = 11;

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(rightCenterX, springStartY);
      for (let i = 1; i <= coils; i++) {
        const py =
          springStartY + ((springEndY - springStartY) * (i - 0.5)) / coils;
        const px =
          rightCenterX + (i % 2 === 0 ? coilAmplitude : -coilAmplitude);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(rightCenterX, springEndY);
      ctx.stroke();

      // Kırmızı Gösterge İbresi
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(rightCenterX - tubeWidth / 2 - 4, springEndY);
      ctx.lineTo(rightCenterX + tubeWidth / 2 + 4, springEndY);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ef4444";
      ctx.stroke();

      // Alt Kanca ve Asılı Kütle Bloğu
      const hookEndY = springEndY + 24 + p.floatOffset * 0.5;
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rightCenterX, springEndY);
      ctx.lineTo(rightCenterX, hookEndY);
      ctx.stroke();

      const dynBlockY = hookEndY;
      ctx.fillStyle = "#4f46e5";
      ctx.strokeStyle = "#a5b4fc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        rightCenterX - blockSize / 2,
        dynBlockY,
        blockSize,
        blockSize,
        6
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.fillText(
        `${mass} kg`,
        rightCenterX,
        dynBlockY + blockSize / 2 + 4
      );

      // Yerçekimi Kuvvet Vektörü Oku (G = m.g)
      if (gravity > 0) {
        const arrowLen = Math.min(58, 14 + (weight / 500) * 52);
        const arrowStartY = dynBlockY + blockSize + 4;
        const arrowEndY = arrowStartY + arrowLen;

        ctx.strokeStyle = "#f59e0b";
        ctx.fillStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rightCenterX, arrowStartY);
        ctx.lineTo(rightCenterX, arrowEndY);
        ctx.stroke();

        // Ok ucu
        ctx.beginPath();
        ctx.moveTo(rightCenterX, arrowEndY + 6);
        ctx.lineTo(rightCenterX - 6, arrowEndY - 3);
        ctx.lineTo(rightCenterX + 6, arrowEndY - 3);
        ctx.closePath();
        ctx.fill();

        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText(
          `G = ${weight.toFixed(1)} N`,
          rightCenterX,
          arrowEndY + 19
        );
      } else {
        ctx.fillStyle = "#a78bfa";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.fillText(
          "G = 0 N (Ağırlıksız)",
          rightCenterX,
          dynBlockY + blockSize + 18
        );
      }

      // Alt Zemin Bilgi Bandı
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "500 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${planetInfo.name} Yüzeyi • Kütleçekim İvmesi (g) = ${gravity.toFixed(
          2
        )} m/s² • Kütle (m) = ${mass} kg • Ağırlık (G) = ${weight.toFixed(2)} N`,
        W / 2,
        groundY + 26
      );

      ctx.restore();
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    animationFrameId = window.requestAnimationFrame(renderFrame);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [planet, gravity, mass]);

  const planetList = Object.values(PLANETS);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Üst Kontrol Çubuğu: Gezegen Seçici ve Kütle Sürgüsü */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg backdrop-blur-md flex flex-col gap-3">
        {/* Gezegen Seçim Butonları */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Gök Cismi / Ortam Seçimi:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {planetList.map((p) => {
              const isSelected = p.id === planet;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanet(p.id as PlanetId)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20 scale-[1.02]"
                      : "bg-slate-800/80 text-slate-300 border-slate-700/70 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name}</span>
                  <span className="text-[10px] opacity-80">
                    ({p.gravity} m/s²)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kütle Sürgüsü ve Salınım Test Butonu */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-3 flex-1 min-w-[220px]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 whitespace-nowrap">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Kütle (m):</span>
              <span className="text-emerald-400 font-bold text-sm ml-0.5">
                {mass} kg
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={mass}
              onChange={(e) => setMass(Number(e.target.value))}
              aria-label="Kütle seçimi (kg)"
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerPulse}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
              title="Yayı ve teraziyi titreştirerek dengeye gelişini gözlemle"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Salınımı Test Et</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sohbet ile senkronize</span>
            </div>
          </div>
        </div>
      </div>

      {/* HTML5 Fizik Simülasyonu Canvas Alanı */}
      <div className="relative flex-1 min-h-[300px] sm:min-h-[340px] w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          aria-label="Eşit Kollu Terazi ve Dinamometre Fizik Simülasyonu"
        />
      </div>
    </div>
  );
};
