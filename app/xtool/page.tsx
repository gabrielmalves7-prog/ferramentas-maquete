import type { Metadata } from "next";
import { ToolXtoolPlanner } from "@/components/ToolXtoolPlanner";

export const metadata: Metadata = {
  title: "Planejador xTool",
  description: "Posição e tamanho das peças na área de trabalho (mm), com gravação no Supabase.",
};

export default function XtoolPage() {
  return <ToolXtoolPlanner />;
}
