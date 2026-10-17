"use client";

import clsx from "clsx";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Brand } from "@/components/Brand";
import { EssaySkeleton } from "@/components/Skeletons";
import { LETTERS } from "@/lib/quiz";
import { useBank } from "@/lib/useBank";

type Tab = "pg" | "essay";
const PAGE = 50;

export function AnswerKey() {
  const { bank, error } = useBank();
  const [tab, setTab] = useState<Tab>("pg");
  const [section, setSection] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const q = useDeferredValue(query.trim().toLowerCase());

  const mc = useMemo(() => {
    if (!bank) return [];
    return bank.mc.filter(
      (m) =>
        (section === "all" || m.section === section) &&
        (!q || String(m.id) === q || m.question.toLowerCase().includes(q) ||
          m.options.some((o) => o.toLowerCase().includes(q))),
    );
  }, [bank, section, q]);

  const essays = useMemo(() => {
    if (!bank) return [];
    return bank.essay.filter(
      (e) =>
        !q || String(e.id) === q || e.question.toLowerCase().includes(q) || e.keyPoints.toLowerCase().includes(q),
    );
  }, [bank, q]);

  const reset = () => setLimit(PAGE);

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Brand />
          <Link href="/" className="text-sm text-muted hover:text-ink">
            Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8">
        <h1 className="text-2xl font-semibold tracking-tight">Kunci jawaban</h1>
        <p className="mt-2 text-[15px] text-muted">
          Urutan opsi sesuai naskah asli (Kode A). Cari dengan nomor soal atau kata kunci.
        </p>

        <div className="mt-6 flex gap-4 border-b border-line text-sm">
          {(
            [
              ["pg", "Pilihan ganda", 450],
              ["essay", "Essay", 50],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                reset();
              }}
              className={clsx(
                "-mb-px border-b-2 pb-2.5",
                tab === id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {label} <span className="tabular text-muted">{n}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              reset();
            }}
            placeholder="Cari no. soal atau kata…"
            className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm outline-none focus:border-muted"
          />
          {tab === "pg" && bank && (
            <select
              value={section}
              onChange={(e) => {
                setSection(e.target.value);
                reset();
              }}
              className="h-10 rounded-lg border border-line bg-bg px-2 text-sm outline-none"
            >
              <option value="all">Semua bagian</option>
              {bank.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Bagian {s.id}
                </option>
              ))}
            </select>
          )}
        </div>

        {error ? (
          <p className="mt-8 text-sm text-bad">{error}</p>
        ) : !bank ? (
          <div className="-mx-4">
            <EssaySkeleton />
          </div>
        ) : tab === "pg" ? (
          <>
            <p className="tabular mt-4 text-xs text-muted">{mc.length} soal</p>
            <ol className="mt-2 divide-y divide-line border-y border-line">
              {mc.slice(0, limit).map((m) => (
                <li key={m.id} className="py-5">
                  <div className="flex gap-3">
                    <span className="tabular w-9 shrink-0 pt-px text-sm text-muted">{m.id}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-relaxed">{m.question}</p>
                      <ul className="mt-3 space-y-1.5">
                        {m.options.map((o, i) => (
                          <li
                            key={i}
                            className={clsx(
                              "flex gap-3 text-sm leading-relaxed",
                              i === m.answer ? "font-medium text-ok" : "text-muted",
                            )}
                          >
                            <span className="w-3 shrink-0 font-mono">{LETTERS[i]}</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm">
                        Kunci: <span className="font-semibold text-ok">{LETTERS[m.answer]}</span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {mc.length > limit && (
              <button
                onClick={() => setLimit((l) => l + PAGE)}
                className="mt-4 w-full py-2 text-sm text-muted hover:text-ink"
              >
                Tampilkan {Math.min(PAGE, mc.length - limit)} lagi
              </button>
            )}
          </>
        ) : (
          <>
            <p className="tabular mt-4 text-xs text-muted">{essays.length} soal</p>
            <ol className="mt-2 divide-y divide-line border-y border-line">
              {essays.map((e) => (
                <li key={e.id} className="flex gap-3 py-5">
                  <span className="tabular w-9 shrink-0 pt-px text-sm text-muted">{e.id}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-relaxed">{e.question}</p>
                    <div className="mt-3 border-l-2 border-ok pl-3 text-sm leading-relaxed">
                      <span className="font-medium">Pokok jawaban: </span>
                      <span className="text-muted">{e.keyPoints}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}
