# Proaktif Sınav — Sokratik Akıllı Öğretim ve Değerlendirme Sistemi (ITS)

**Proaktif Sınav**, MEB Türkiye Yüzyılı Maarif Modeli (**TYMM**) kazanımları için geliştirilmiş; **Etkileşimli HTML5 Fizik Simülasyonu**, **Proaktif Sokratik Yapay Zeka (Google Gemini API)** ve **Bayesian Knowledge Tracing (BKT)** öğrenci modellemesini tek bir modüler **Next.js (App Router, TypeScript, Tailwind CSS)** mimarisinde birleştiren Akıllı Öğretim ve Değerlendirme Sistemidir (Intelligent Tutoring System).

---

## Proje Mimari Yapısı

```text
oz-ogreten-its/
├── public/
│   ├── manifest.json                 # iOS & Android PWA kurulum dosyası
│   └── icons/                        # Mobil uygulama ikonları (192x192, 512x512)
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Viewport, Safe-Area ve KaTeX CSS yüklemeleri
│   │   ├── page.tsx                  # Ana Split-Pane (Tahta + Sohbet) ekranı
│   │   └── api/
│   │       ├── tutor/route.ts        # Proaktif Sokratik AI (Gemini API) uç noktası
│   │       └── bkt/route.ts          # Öğrenci BKT bilişsel durum güncelleme API'si
│   ├── components/
│   │   ├── Whiteboard/
│   │   │   ├── PhysicsCanvas.tsx     # Eşit Kollu Terazi ve Dinamometre HTML5 Canvas motoru
│   │   │   └── FormulaBoard.tsx      # KaTeX dinamik formül bileşeni
│   │   ├── TutorChat/
│   │   │   ├── ChatStream.tsx        # Sokratik diyalog ve hızlı cevap çipleri
│   │   │   └── MisconceptionAlert.tsx # Kavram yanılgısı uyarı bandı
│   │   └── StudentModel/
│   │       └── BktModal.tsx          # Bilişsel ustalık (Mastery) gösterge paneli
│   ├── lib/
│   │   ├── bkt-engine.ts             # Bayesian Knowledge Tracing matematiksel fonksiyonu
│   │   └── curriculum-graph.ts       # MEB kazanım ve kavram yanılgısı JSON şemaları
│   ├── store/
│   │   └── useITSStore.ts            # Zustand senkron durum yönetimi (Simülasyon + Sohbet + BKT)
│   └── types/
│       └── its.ts                    # Öğrenci, Kazanım ve Simülasyon veri tipleri
├── .env.example                      # Örnek ortam değişkenleri şablonu
└── package.json
```

---

## Temel Özellikler

1. **Çift Cihazlı Etkileşimli Fizik Laboratuvarı (`PhysicsCanvas.tsx`):**
   - **Eşit Kollu Terazi:** Kütle ($m$) ölçümü yapar. Dünya, Ay, Mars ve Jüpiter'de her iki kefeye aynı yerçekimi ivmesi ($g$) etki ettiği için dengenin bozulmadığını sönümlü harmonik salınım ($60\text{ FPS}$) ile gösterir.
   - **Yaylı Dinamometre:** Hooke Yasası ($F = -k \cdot \Delta x$) ve sönümlü yay fiziği ile ağırlık kuvvetini ($G = m \cdot g$, Newton) gerçek zamanlı simüle eder.
2. **Çift Yönlü Durum Senkronizasyonu (`useITSStore.ts`):**
   - Öğrencinin Sokratik sohbette yazdığı bir hipotez veya kavram yanılgısı, AI tarafından analiz edilerek doğrudan Canvas üzerindeki gezegeni ve kütleyi günceller (`updateSimulation: { planet, mass }`).
3. **Bayesian Knowledge Tracing (`bkt-engine.ts`):**
   - Her etkileşim sonrasında öğrencinin ilgili MEB kazanımına ait bilişsel ustalık olasılığı $P(L_{n+1})$ Bayes teoremi ile güncellenir.
4. **Mobil (iOS & Android) PWA ve Safe-Area Uyumu:**
   - `viewport-fit=cover`, `safe-area-inset` CSS kuralları ve mobil alt sekme geçişi (**Tahta & Simülasyon** / **Sokratik Sohbet**) ile tam mobil deneyim sunar.

---

## Kurulum ve Çalıştırma

```bash
# 1. Bağımlılıkları yükleyin
npm install

# 2. .env.local dosyasına Gemini API anahtarınızı ekleyin (Opsiyonel: Anahtar girilmezse yerleşik Sokratik Motor devreye girer)
# GEMINI_API_KEY=AIzaSy...

# 3. Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açarak deneyimleyebilirsiniz.
