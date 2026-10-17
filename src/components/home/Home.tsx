"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { History } from "./History";
import { SetupCard } from "./SetupCard";

export function Home() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Brand />
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/kunci" className="transition hover:text-ink">
              Kunci jawaban
            </Link>
            <Link href="/essay" className="transition hover:text-ink">
              Essay
            </Link>
          </nav>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto max-w-xl px-4 pb-16 pt-10"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Latihan ujian kompetensi teknis</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          450 pilihan ganda dan 50 essay. Soal dan opsi diacak tiap sesi. Nilai tersimpan di perangkat
          ini.
        </p>

        <div className="mt-10">
          <SetupCard />
        </div>

        <History />
      </motion.main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Alat latihan mandiri, bukan aplikasi resmi panitia seleksi.
      </footer>
    </div>
  );
}
