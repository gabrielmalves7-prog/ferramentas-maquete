import type { Metadata } from "next";
import { ToolBibliotecaPecas } from "@/components/ToolBibliotecaPecas";

export const metadata: Metadata = {
  title: "Biblioteca de peças",
  description: "Guarde peças com nome, descrição, largura e altura (mm ou cm) no Supabase.",
};

export default function PecasPage() {
  return <ToolBibliotecaPecas />;
}
