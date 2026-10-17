"use client";

import { motion } from "framer-motion";
import { BookOpenText, Layers, ListChecks, NotebookPen, Shuffle } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { History } from "./History";
import { SetupCard } from "./SetupCard";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stats = [
  { icon: ListChecks, value: "450", label: "Pilihan ganda" },
  { icon: NotebookPen, value: "50", label: "Essay & studi kasus" },
  { icon: Layers, value: "5", label: "Bagian materi" },
];

export function Home() {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[560px]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--brand-soft), transparent)" }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Brand />
        <Link
          href="/essay"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold transition hover:border-brand hover:text-brand"
        >
          <BookOpenText className="size-4" />
          <span className="hidden sm:inline">Latihan</span> Essay
        </Link>
      </header>

      <main className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pt-12">
        <section className="lg:sticky lg:top-10 lg:self-start">
          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted"
          >
            <span className="size-1.5 rounded-full bg-accent" />
            Seleksi Terbuka JPT Pratama · Kode Naskah A
          </motion.p>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-5 text-balance text-[2.35rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]"
          >
            Latihan ujian kompetensi <span className="text-brand">Adminduk</span>, langsung dari
            genggaman.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg"
          >
            Tanpa login, tanpa ribet. Soal dan pilihan jawaban diacak setiap sesi, kunci jawaban
            ikut menyesuaikan. Nilai tersimpan otomatis di perangkat Anda.
          </motion.p>

          <motion.dl
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 grid max-w-lg grid-cols-3 gap-3"
          >
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl border border-line bg-surface p-4">
                <Icon className="size-5 text-brand" />
                <dd className="tabular mt-3 text-2xl font-extrabold tracking-tight">{value}</dd>
                <dt className="text-xs font-medium leading-snug text-muted">{label}</dt>
              </div>
            ))}
          </motion.dl>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 flex items-center gap-2 text-sm text-muted"
          >
            <Shuffle className="size-4 text-accent" />
            Urutan soal & opsi A–E diacak · kunci mengikuti otomatis
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <SetupCard />
          <History />
        </motion.section>
      </main>

      <footer className="relative border-t border-line py-6 text-center text-xs text-muted">
        Simulasi latihan mandiri · Bukan aplikasi resmi panitia seleksi
      </footer>
    </div>
  );
}
