"use client";

import { useEffect, useState } from "react";
import type { Bank } from "./types";

let cache: Promise<Bank> | null = null;

export function loadBank() {
  cache ??= fetch("/data/questions.json").then((r) => {
    if (!r.ok) throw new Error(`Gagal memuat bank soal (${r.status})`);
    return r.json() as Promise<Bank>;
  });
  cache.catch(() => (cache = null));
  return cache;
}

/** Durasi minimum skeleton agar transisi tidak berkedip saat data dari cache. */
const MIN_SKELETON_MS = 450;

export function useBank() {
  const [bank, setBank] = useState<Bank | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const minDelay = new Promise((r) => setTimeout(r, MIN_SKELETON_MS));
    Promise.all([loadBank(), minDelay])
      .then(([b]) => alive && setBank(b))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  return { bank, error };
}
