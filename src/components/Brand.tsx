import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="text-sm font-semibold tracking-tight">
      Simulasi JPT Pratama
      <span className="ml-1.5 font-normal text-muted">Dukcapil</span>
    </Link>
  );
}
