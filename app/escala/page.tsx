import type { Metadata } from "next";
import { ToolEscala } from "@/components/ToolEscala";

export const metadata: Metadata = {
  title: "Escala",
  description: "Conversor de medida real para proporção do projeto (cm e mm).",
};

export default function EscalaPage() {
  return <ToolEscala />;
}
