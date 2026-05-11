"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Piece, XtoolProjectRow } from "@/lib/types";

const COLORS = [
  "#e8c547",
  "#4caf7d",
  "#5b9bd5",
  "#e85447",
  "#b06cde",
  "#e87c47",
  "#47c4e8",
  "#de6c9e",
];

function toMm(val: number, unit: "mm" | "cm"): number {
  return unit === "cm" ? val * 10 : val;
}

function fmt(n: number): string {
  return parseFloat(n.toFixed(3)).toString();
}

function parsePecas(pecas: XtoolProjectRow["pecas"]): Piece[] {
  if (Array.isArray(pecas)) return pecas as Piece[];
  if (typeof pecas === "string") {
    try {
      return JSON.parse(pecas) as Piece[];
    } catch {
      return [];
    }
  }
  return [];
}

function useSupabaseReady() {
  return useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(url && key);
  }, []);
}

export function ToolXtoolPlanner() {
  const supabaseReady = useSupabaseReady();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [wsW, setWsW] = useState("400");
  const [wsH, setWsH] = useState("400");
  const [pName, setPName] = useState("");
  const [pW, setPW] = useState("100");
  const [pH, setPH] = useState("80");
  const [pWUnit, setPWUnit] = useState<"mm" | "cm">("mm");
  const [pHUnit, setPHUnit] = useState<"mm" | "cm">("mm");
  const [pX, setPX] = useState("0");
  const [pY, setPY] = useState("0");
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [counter, setCounter] = useState(0);
  const [saveNome, setSaveNome] = useState("");
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [projects, setProjects] = useState<XtoolProjectRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadProjects = useCallback(async () => {
    if (!supabase) {
      setListError("Supabase não configurado.");
      setProjects([]);
      return;
    }
    setListError(null);
    const { data, error } = await supabase
      .from("xtool_projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setListError(error.message);
      setProjects([]);
      return;
    }
    setProjects((data ?? []) as XtoolProjectRow[]);
  }, [supabase]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function setFlash(text: string, ok: boolean) {
    setSaveMsg({ text, ok });
    setTimeout(() => setSaveMsg(null), 3000);
  }

  function addPiece() {
    const name = pName.trim() || `Peça ${counter + 1}`;
    const wRaw = parseFloat(pW) || 0;
    const hRaw = parseFloat(pH) || 0;
    const w = toMm(wRaw, pWUnit);
    const h = toMm(hRaw, pHUnit);
    const x = parseFloat(pX) || 0;
    const y = parseFloat(pY) || 0;
    if (w <= 0 || h <= 0) return;
    const color = COLORS[counter % COLORS.length];
    setPieces((prev) => [...prev, { id: counter, name, w, h, x, y, color }]);
    setCounter((c) => c + 1);
    setPName("");
    setPX(fmt(x + w));
  }

  function removePiece(id: number) {
    setPieces((prev) => prev.filter((q) => q.id !== id));
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap || pieces.length === 0) return;

    const wNum = parseFloat(wsW) || 400;
    const hNum = parseFloat(wsH) || 400;
    const PAD = 36;
    const cw = wrap.clientWidth || 640;
    const scale = (cw - PAD * 2) / wNum;
    const ch = Math.round(hNum * scale + PAD * 2);
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);

    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "#181818";
    ctx.fillRect(PAD, PAD, wNum * scale, hNum * scale);

    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 0.5;
    for (let gx = 50; gx < wNum; gx += 50) {
      ctx.beginPath();
      ctx.moveTo(PAD + gx * scale, PAD);
      ctx.lineTo(PAD + gx * scale, PAD + hNum * scale);
      ctx.stroke();
    }
    for (let gy = 50; gy < hNum; gy += 50) {
      ctx.beginPath();
      ctx.moveTo(PAD, PAD + gy * scale);
      ctx.lineTo(PAD + wNum * scale, PAD + gy * scale);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD, PAD, wNum * scale, hNum * scale);

    ctx.fillStyle = "#555";
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("0", PAD - 14, PAD - 14);
    ctx.fillText(`${wNum}mm`, PAD + wNum * scale - 28, PAD - 14);
    ctx.fillText(`${hNum}mm`, PAD + wNum * scale + 4, PAD + hNum * scale - 10);

    pieces.forEach((p) => {
      const px = PAD + p.x * scale;
      const py = PAD + p.y * scale;
      const pw = p.w * scale;
      const ph = p.h * scale;
      const oob = p.x + p.w > wNum || p.y + p.h > hNum;

      ctx.globalAlpha = 0.15;
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py, pw, ph);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = oob ? "#e85447" : p.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px, py, pw, ph);

      if (pw > 28 && ph > 14) {
        const fs = Math.max(9, Math.min(12, pw / 8));
        ctx.font = `700 ${fs}px "Space Mono", monospace`;
        ctx.fillStyle = p.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lbl = p.name.length > 16 ? `${p.name.slice(0, 15)}…` : p.name;
        ctx.fillText(lbl, px + pw / 2, py + ph / 2);
      }

      ctx.font = '9px "Space Mono", monospace';
      ctx.fillStyle = "#666";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`(${fmt(p.x)},${fmt(p.y)})`, px + 3, py + 3);
    });
  }, [pieces, wsW, wsH]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    const el = canvasWrapRef.current;
    if (el) ro.observe(el);
    window.addEventListener("resize", draw);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [draw]);

  async function salvarProjeto() {
    const nome = saveNome.trim();
    if (!nome) {
      setFlash("Dê um nome ao projeto.", false);
      return;
    }
    if (!pieces.length) {
      setFlash("Adicione ao menos uma peça.", false);
      return;
    }
    if (!supabase) {
      setFlash("Configure as variáveis Supabase no .env.local.", false);
      return;
    }
    const ww = parseFloat(wsW) || 400;
    const wh = parseFloat(wsH) || 400;
    const { error } = await supabase.from("xtool_projects").insert({
      nome,
      ws_w: ww,
      ws_h: wh,
      pecas: pieces,
    });
    if (error) {
      setFlash("Erro: " + error.message, false);
      return;
    }
    setSaveNome("");
    setFlash("Projeto salvo!", true);
    void loadProjects();
  }

  async function deletarProjeto(id: string) {
    if (!supabase) return;
    await supabase.from("xtool_projects").delete().eq("id", id);
    void loadProjects();
  }

  function carregarProjeto(item: XtoolProjectRow) {
    const pecas = parsePecas(item.pecas);
    setPieces(pecas);
    setCounter(pecas.length ? Math.max(...pecas.map((p) => p.id)) + 1 : 0);
    setWsW(String(item.ws_w));
    setWsH(String(item.ws_h));
  }

  const wNum = parseFloat(wsW) || 400;
  const hNum = parseFloat(wsH) || 400;

  return (
    <>
      <div className="tool-header">
        <div className="tool-title">Planejador de Peças</div>
        <div className="tool-desc">
          Defina posição e tamanho de cada peça na área de trabalho do xTool Studio (mm).
        </div>
      </div>

      {!supabaseReady && (
        <div className="env-banner">
          Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no <code>.env.local</code> para salvar projetos
          no Supabase.
        </div>
      )}

      <div className="card">
        <div className="card-title">Área de trabalho</div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="ws-w">Largura total (mm)</label>
            <input id="ws-w" type="number" min={1} value={wsW} onChange={(e) => setWsW(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ws-h">Altura total (mm)</label>
            <input id="ws-h" type="number" min={1} value={wsH} onChange={(e) => setWsH(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Nova peça</div>
        <div className="field">
          <label htmlFor="p-name">Nome</label>
          <input
            id="p-name"
            type="text"
            placeholder="ex: Lateral esquerda"
            value={pName}
            onChange={(e) => setPName(e.target.value)}
          />
        </div>
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label>Largura da peça</label>
            <div className="unit-row">
              <input type="number" min={0.01} step={0.01} value={pW} onChange={(e) => setPW(e.target.value)} />
              <select value={pWUnit} onChange={(e) => setPWUnit(e.target.value as "mm" | "cm")}>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>
          <div>
            <label>Altura da peça</label>
            <div className="unit-row">
              <input type="number" min={0.01} step={0.01} value={pH} onChange={(e) => setPH(e.target.value)} />
              <select value={pHUnit} onChange={(e) => setPHUnit(e.target.value as "mm" | "cm")}>
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>
        </div>
        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div>
            <label htmlFor="p-x">Início X (mm)</label>
            <input id="p-x" type="number" min={0} step={0.1} value={pX} onChange={(e) => setPX(e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-y">Início Y (mm)</label>
            <input id="p-y" type="number" min={0} step={0.1} value={pY} onChange={(e) => setPY(e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-full" onClick={addPiece}>
          + Adicionar peça
        </button>
      </div>

      {pieces.length > 0 && (
        <div className="card">
          <div className="card-title">Peças do projeto atual</div>
          <table className="piece-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>W × H (mm)</th>
                <th>Início X · Y</th>
                <th>Fim X</th>
                <th>Fim Y</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pieces.map((p) => {
                const endX = p.x + p.w;
                const endY = p.y + p.h;
                const xOk = endX <= wNum;
                const yOk = endY <= hNum;
                return (
                  <tr key={p.id}>
                    <td>
                      <span className="piece-name-cell">
                        <span className="piece-dot" style={{ background: p.color }} />
                        {p.name}
                      </span>
                    </td>
                    <td>
                      {fmt(p.w)} × {fmt(p.h)}
                    </td>
                    <td>
                      {fmt(p.x)} · {fmt(p.y)}
                    </td>
                    <td className={xOk ? "val-ok" : "val-err"}>{fmt(endX)}</td>
                    <td className={yOk ? "val-ok" : "val-err"}>{fmt(endY)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: "4px 8px", fontSize: 11 }}
                        onClick={() => removePiece(p.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pieces.length > 0 && (
        <div className="card">
          <div className="card-title">Visualização</div>
          <div className="canvas-wrap" ref={canvasWrapRef}>
            <canvas ref={canvasRef} />
          </div>
          <div className="canvas-legend">
            {pieces.map((p) => (
              <span key={p.id} className="legend-item">
                <span className="legend-dot" style={{ background: p.color }} />
                {p.name} &nbsp;{fmt(p.w)}×{fmt(p.h)} mm
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Salvar projeto</div>
        <div className="unit-row" style={{ gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="pc-save-nome">Nome do projeto</label>
            <input
              id="pc-save-nome"
              type="text"
              placeholder="ex: Caixinha porta-joias"
              value={saveNome}
              onChange={(e) => setSaveNome(e.target.value)}
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="button" className="btn btn-primary" onClick={() => void salvarProjeto()}>
              Salvar
            </button>
          </div>
        </div>
        {saveMsg && (
          <div
            style={{
              fontSize: 12,
              marginTop: 8,
              minHeight: 16,
              fontFamily: "var(--font-mono)",
              color: saveMsg.ok ? "var(--green)" : "var(--red)",
            }}
          >
            {saveMsg.text}
          </div>
        )}
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div className="card-title" style={{ margin: 0 }}>
            Projetos salvos
          </div>
          <button
            type="button"
            className="btn"
            style={{ padding: "4px 10px", fontSize: 10 }}
            onClick={() => void loadProjects()}
          >
            ↻ Atualizar
          </button>
        </div>
        {listError && (
          <span style={{ fontSize: 12, color: "var(--red)", fontFamily: "var(--font-mono)" }}>
            Erro ao carregar: {listError}
          </span>
        )}
        {!listError && projects.length === 0 && (
          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            Nenhum projeto salvo ainda.
          </span>
        )}
        {projects.map((item) => {
          const pecas = parsePecas(item.pecas);
          return (
            <div key={item.id} className="hist-row">
              <div className="hist-info">
                <span className="hist-nome">{item.nome}</span>
                <span className="hist-detalhe">
                  {item.ws_w}×{item.ws_h} mm · {pecas.length} peça{pecas.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => carregarProjeto(item)}>
                  Carregar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  onClick={() => void deletarProjeto(item.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
