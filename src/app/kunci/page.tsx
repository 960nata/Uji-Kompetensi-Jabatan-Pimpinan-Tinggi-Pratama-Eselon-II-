import type { Metadata } from "next";
import { AnswerKey } from "@/components/answer-key/AnswerKey";

export const metadata: Metadata = { title: "Kunci Jawaban — Simulasi JPT Dukcapil" };

export default function Page() {
  return <AnswerKey />;
}
