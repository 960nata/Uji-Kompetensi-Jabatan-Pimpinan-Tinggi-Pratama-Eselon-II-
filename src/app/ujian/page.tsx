import type { Metadata } from "next";
import { Quiz } from "@/components/quiz/Quiz";

export const metadata: Metadata = { title: "Ujian Berlangsung — Simulasi JPT Dukcapil" };

export default function Page() {
  return <Quiz />;
}
