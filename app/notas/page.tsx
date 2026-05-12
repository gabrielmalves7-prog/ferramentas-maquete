import type { Metadata } from "next";
import { ToolBlocoNotas } from "@/components/ToolBlocoNotas";

export const metadata: Metadata = {
  title: "Bloco de notas",
  description: "Notas com título e conteúdo expansível, guardadas no Supabase.",
};

export default function NotasPage() {
  return <ToolBlocoNotas />;
}
