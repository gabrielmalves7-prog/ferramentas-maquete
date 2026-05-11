import type { Unidade } from "./types";

export function fmt(n: number): string {
  if (n === 0) return "0";
  return parseFloat(n.toFixed(4)).toLocaleString("pt-BR");
}

/** Converte valor na unidade dada para metros. */
export function toMetros(val: number, unit: Unidade): number {
  if (unit === "cm") return val / 100;
  if (unit === "mm") return val / 1000;
  return val;
}

/** Converte o lado direito da proporção "1 m = propVal propUnit" para centímetros. */
export function propToCm(propVal: number, propUnit: Unidade): number {
  if (propUnit === "mm") return propVal / 10;
  if (propUnit === "m") return propVal * 100;
  return propVal;
}

/** Medida real → valor na proporção (resultado em cm e mm). */
export function computeScale(
  rawVal: number,
  unitIn: Unidade,
  propVal: number,
  propUnit: Unidade,
): { resCm: number; resMm: number } {
  const metros = toMetros(rawVal, unitIn);
  const propCm = propToCm(propVal, propUnit);
  const resCm = metros * propCm;
  const resMm = resCm * 10;
  return { resCm, resMm };
}
