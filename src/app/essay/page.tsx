import type { Metadata } from "next";
import { EssayPractice } from "@/components/essay/EssayPractice";

export const metadata: Metadata = { title: "Latihan Essay — Simulasi JPT Dukcapil" };

export default function Page() {
  return <EssayPractice />;
}
