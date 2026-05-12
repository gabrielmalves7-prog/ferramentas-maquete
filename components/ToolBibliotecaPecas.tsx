"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PieceUnit, SavedPieceRow } from "@/lib/types";

function useSupabaseReady() {
  return useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(url && key);
  }, []);
}

export function ToolBibliotecaPecas() {
  const supabaseReady = useSupabaseReady();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [unidade, setUnidade] = useState<PieceUnit>("mm");
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [rows, setRows] = useState<SavedPieceRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    if (!supabase) {
      setListError("Supabase não configurado.");
      setRows([]);
      return;
    }
    setListError(null);
    const { data, error } = await supabase
      .from("saved_pieces")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setListError(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as SavedPieceRow[]);
  }, [supabase]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  function setFlash(text: string, ok: boolean) {
    setSaveMsg({ text, ok });
    setTimeout(() => setSaveMsg(null), 3000);
  }

  async function salvar() {
    const n = nome.trim();
    if (!n) {
      setFlash("Dê um nome à peça.", false);
      return;
    }
    const w = parseFloat(largura);
    const h = parseFloat(altura);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) {
      setFlash("Largura e altura devem ser números positivos.", false);
      return;
    }
    if (!supabase) {
      setFlash("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.", false);
      return;
    }
    const { error } = await supabase.from("saved_pieces").insert({
      nome: n,
      descricao: descricao.trim(),
      largura: w,
      altura: h,
      unidade,
    });
    if (error) {
      setFlash("Erro: " + error.message, false);
      return;
    }
    setNome("");
    setDescricao("");
    setLargura("");
    setAltura("");
    setFlash("Peça salva!", true);
    void loadList();
  }

  async function deletar(id: string) {
    if (!supabase) return;
    await supabase.from("saved_pieces").delete().eq("id", id);
    void loadList();
  }

  return (
    <>
      <div className="tool-header">
        <div className="tool-title">Biblioteca de peças</div>
        <div className="tool-desc">
          Guarde o nome, uma descrição e as medidas da peça: largura (x) e altura (y) em mm ou cm.
        </div>
      </div>

      {!supabaseReady && (
        <div className="env-banner">
          Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no arquivo <code>.env.local</code> para
          salvar e listar peças na nuvem.
        </div>
      )}

      <div className="card">
        <div className="card-title">Nova peça</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label htmlFor="peca-nome">Nome</label>
            <input
              id="peca-nome"
              type="text"
              placeholder="ex: Chapa lateral A"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="peca-desc">Descrição</label>
            <textarea
              id="peca-desc"
              rows={3}
              placeholder="Material, notas de corte, referência…"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={{
                width: "100%",
                resize: "vertical",
                minHeight: 72,
                fontFamily: "var(--font-body)",
                fontSize: 14,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-3)",
                color: "var(--text)",
              }}
            />
          </div>
          <div className="unit-row" style={{ gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="peca-largura">Largura (x)</label>
              <input
                id="peca-largura"
                type="number"
                min={0.001}
                step={0.01}
                value={largura}
                onChange={(e) => setLargura(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="peca-altura">Altura (y)</label>
              <input
                id="peca-altura"
                type="number"
                min={0.001}
                step={0.01}
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="peca-unidade">Unidade</label>
              <select
                id="peca-unidade"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value as PieceUnit)}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>
          <div>
            <button type="button" className="btn btn-primary" onClick={() => void salvar()}>
              Salvar peça
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
            Peças salvas
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
            Nenhuma peça salva ainda. Execute o SQL no Supabase se a tabela não existir.
          </span>
        )}
        {rows.map((item) => (
          <div key={item.id} className="hist-row" style={{ alignItems: "flex-start" }}>
            <div className="hist-info" style={{ flex: 1, minWidth: 0 }}>
              <span className="hist-nome">{item.nome}</span>
              <span className="hist-detalhe">
                {item.largura} × {item.altura} {item.unidade}
              </span>
              {item.descricao ? (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-2)",
                    marginTop: 6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {item.descricao}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: "4px 10px", fontSize: 11, flexShrink: 0 }}
              onClick={() => void deletar(item.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
