<div align="center">

# 🪪 Simulasi Ujian JPT Pratama — Dukcapil

**Latihan 450 soal pilihan ganda + 50 essay untuk seleksi terbuka JPT Pratama bidang Kependudukan & Pencatatan Sipil.**
Tanpa login, mobile-first, soal & opsi diacak tiap sesi.

![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-ff0080?logo=framer&logoColor=white)

</div>

---

## ✨ Fitur

| | |
|---|---|
| 🔀 **Acak soal & opsi** | Urutan soal dan opsi A–E diacak setiap sesi (Fisher–Yates + `crypto.getRandomValues`). Kunci jawaban otomatis mengikuti posisi opsi yang baru. |
| 🎯 **Dua mode** | **Ujian**: nilai di akhir. **Belajar**: langsung tahu benar/salah + kunci per soal. |
| ⚙️ **Sesi fleksibel** | Pilih 20 / 50 / 100 / 200 / semua soal, filter per bagian materi (I–V), timer opsional (1 menit/soal, auto-submit saat habis). |
| 📝 **Latihan essay** | 50 soal essay & studi kasus, draf jawaban tersimpan otomatis, tombol *lihat pokok jawaban* + pedoman bobot penilaian. |
| 📊 **Hasil & pembahasan** | Skor animasi, statistik benar/salah/kosong, nilai per bagian, pembahasan dengan filter. |
| 💾 **Tanpa database** | Progres sesi, riwayat nilai, dan draf essay disimpan di `localStorage` perangkat. Refresh tidak menghilangkan progres. |
| 📱 **Mobile-first** | Bottom bar jempol-friendly, *bottom sheet* daftar soal, swipe kiri/kanan untuk pindah soal, dark mode otomatis. |
| ⚡ **Skeleton loading** | Shimmer skeleton di setiap halaman selama bank soal dimuat. |
| ⌨️ **Pintasan keyboard** | `A–E` / `1–5` pilih jawaban, `← →` pindah soal, `F` tandai ragu-ragu. |

## 🚀 Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

Build produksi:

```bash
npm run build && npm start
```

Deploy paling cepat: push ke GitHub lalu import di [Vercel](https://vercel.com/new), tanpa konfigurasi tambahan.

## 🗂️ Struktur

```
src/
├── app/
│   ├── page.tsx              # Beranda: atur sesi + riwayat nilai
│   ├── ujian/page.tsx        # Halaman ujian pilihan ganda
│   ├── hasil/[id]/page.tsx   # Hasil & pembahasan
│   └── essay/page.tsx        # Latihan essay
├── components/
│   ├── home/                 # SetupCard, History
│   ├── quiz/                 # Quiz, OptionList, Navigator
│   ├── result/               # ResultView, ScoreRing
│   ├── essay/                # EssayPractice
│   ├── ui/Overlay.tsx        # Dialog & bottom sheet (framer-motion)
│   └── Skeletons.tsx         # Skeleton loader
└── lib/
    ├── quiz.ts               # Acak, buat sesi, penilaian
    ├── storage.ts            # localStorage (sesi, riwayat, draf essay)
    ├── useBank.ts            # Loader bank soal + cache
    └── types.ts
public/data/questions.json    # Bank soal hasil ekstraksi PDF
scripts/parse_questions.py    # Ekstraktor PDF → JSON
```

## 🔄 Memperbarui bank soal

Bank soal diekstrak dari PDF naskah soal dan kunci jawaban:

```bash
pip install pypdf
python scripts/parse_questions.py naskah_soal.pdf kunci_jawaban.pdf public/data/questions.json
```

Skrip memvalidasi bahwa ke-450 soal memiliki 5 opsi dan kunci, serta ke-50 essay memiliki pokok jawaban.

### Cara kerja pengacakan

Setiap soal di sesi menyimpan `order`, yaitu permutasi indeks opsi asli. `order[posisiTampil] = indeksAsli`, jadi jawaban benar bila `order[pilihan] === soal.answer`. Kunci tidak pernah perlu ditulis ulang.

## ⚠️ Catatan

Aplikasi ini adalah alat latihan mandiri, bukan aplikasi resmi panitia seleksi. Kunci jawaban ikut dimuat di sisi klien (diperlukan untuk mode belajar dan pembahasan).
