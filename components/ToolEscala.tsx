"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { computeScale, fmt } from "@/lib/scale-math";
import type { SavedScaleRow, Unidade } from "@/lib/types";

function useSupabaseReady() {
  return useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(url && key);
  }, []);
}

export function ToolEscala() {
  const supabaseReady = useSupabaseReady();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [valor, setValor] = useState("5");
  const [unidadeIn, setUnidadeIn] = useState<Unidade>("m");
  const [propVal, setPropVal] = useState("10");
  const [propUnit, setPropUnit] = useState<Unidade>("cm");
  const [saveNome, setSaveNome] = useState("");
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [rows, setRows] = useState<SavedScaleRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const { resCm, resMm, rawVal, pVal } = useMemo(() => {
    const rawVal = parseFloat(valor) || 0;
    const pVal = parseFloat(propVal) || 0;
    const { resCm, resMm } = computeScale(rawVal, unidadeIn, pVal, propUnit);
    return { resCm, resMm, rawVal, pVal };
  }, [valor, unidadeIn, propVal, propUnit]);

  const loadList = useCallback(async () => {
    if (!supabase) {
      setListError("Supabase não configurado.");
      setRows([]);
      return;
    }
    setListError(null);
    const { data, error } = await supabase
      .from("saved_scales")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setListError(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as SavedScaleRow[]);
  }, [supabase]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  function setFlash(text: string, ok: boolean) {
    setSaveMsg({ text, ok });
    setTimeout(() => setSaveMsg(null), 3000);
  }

  async function salvar() {
    const nome = saveNome.trim();
    if (!nome) {
      setFlash("Dê um nome antes de salvar.", false);
      return;
    }
    if (!supabase) {
      setFlash("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.", false);
      return;
    }
    const { error } = await supabase.from("saved_scales").insert({
      nome,
      valor_base: parseFloat(valor) || 0,
      unidade_base: unidadeIn,
      prop_val: parseFloat(propVal) || 0,
      prop_unit: propUnit,
    });
    if (error) {
      setFlash("Erro: " + error.message, false);
      return;
    }
    setSaveNome("");
    setFlash("Proporção salva!", true);
    void loadList();
  }

  async function deletar(id: string) {
    if (!supabase) return;
    await supabase.from("saved_scales").delete().eq("id", id);
    void loadList();
  }

  function carregarItem(item: SavedScaleRow) {
    setPropVal(String(item.prop_val));
    setPropUnit(item.prop_unit);
    setValor(String(item.valor_base));
    setUnidadeIn(item.unidade_base);
  }

  return (
    <>
      <div className="tool-header">
        <div className="tool-title">Conversor de Escala</div>
        <div className="tool-desc">
          Converta medidas reais para a proporção do projeto (resultado em cm e mm).
        </div>
      </div>

      {!supabaseReady && (
        <div className="env-banner">
          Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no arquivo <code>.env.local</code> para
          salvar e listar proporções na nuvem.
        </div>
      )}

      <div className="card">
        <div className="card-title">Medida real</div>
        <div className="unit-row">
          <div style={{ flex: 1 }}>
            <label htmlFor="esc-valor">Valor</label>
            <input
              id="esc-valor"
              type="number"
              min={0}
              step={0.01}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="esc-unidade-in">Unidade</label>
            <select
              id="esc-unidade-in"
              value={unidadeIn}
              onChange={(e) => setUnidadeIn(e.target.value as Unidade)}
            >
              <option value="m">metros</option>
              <option value="cm">cm</option>
              <option value="mm">mm</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Proporção (escala)</div>
        <div className="grid-3">
          <div>
            <label>1</label>
            <select disabled style={{ opacity: 0.5 }} aria-readonly>
              <option value="m">metro</option>
            </select>
          </div>
          <div>
            <label htmlFor="esc-prop-val">equivale a</label>
            <input
              id="esc-prop-val"
              type="number"
              min={0.001}
              step={0.01}
              value={propVal}
              onChange={(e) => setPropVal(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="esc-prop-unit">unidade</label>
            <select
              id="esc-prop-unit"
              value={propUnit}
              onChange={(e) => setPropUnit(e.target.value as Unidade)}
            >
              <option value="cm">cm</option>
              <option value="mm">mm</option>
              <option value="m">m</option>
            </select>
          </div>
        </div>
        <div className="formula-bar">
          {rawVal} {unidadeIn} → <strong>{fmt(resCm)} cm</strong> = <strong>{fmt(resMm)} mm</strong>
          <span style={{ opacity: 0.7 }}> | proporção: 1 m = </span>
          <strong>
            {pVal} {propUnit}
          </strong>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Resultado na proporção</div>
        <div className="result-grid">
          <div className="metric">
            <div className="metric-label">Centímetros</div>
            <div className="metric-value">{fmt(resCm)}</div>
            <div className="metric-unit">cm</div>
          </div>
          <div className="metric">
            <div className="metric-label">Milímetros</div>
            <div className="metric-value">{fmt(resMm)}</div>
            <div className="metric-unit">mm</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Salvar proporção</div>
        <div className="unit-row" style={{ gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="esc-save-nome">Nome para identificar</label>
            <input
              id="esc-save-nome"
              type="text"
              placeholder="ex: Maquete casa 1:100"
              value={saveNome}
              onChange={(e) => setSaveNome(e.target.value)}
            />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="button" className="btn btn-primary" onClick={() => void salvar()}>
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
            Proporções salvas
          </div>
          <button
            type="button"
            className="btn"
            style={{ padding: "4px 10px", fontSize: 10 }}
            onClick={() => void loadList()}
          >
            ↻ Atualizar
          </button>
        </div>
        {listError && (
          <span style={{ fontSize: 12, color: "var(--red)", fontFamily: "var(--font-mono)" }}>
            Erro ao carregar: {listError}
          </span>
        )}
        {!listError && rows.length === 0 && (
          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            Nenhuma proporção salva ainda.
          </span>
        )}
        {rows.map((item) => (
          <div key={item.id} className="hist-row">
            <div className="hist-info">
              <span className="hist-nome">{item.nome}</span>
              <span className="hist-detalhe">
                1 m = {item.prop_val} {item.prop_unit}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => carregarItem(item)}>
                Carregar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => void deletar(item.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
