import { redirect } from "next/navigation";

/** Garante redirecionamento mesmo sem middleware (ex.: previews antigos). */
export const dynamic = "force-dynamic";

export default function Home() {
  redirect("/escala");
}
