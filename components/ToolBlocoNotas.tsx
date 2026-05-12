"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SavedNoteRow } from "@/lib/types";

function useSupabaseReady() {
  return useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(url && key);
  }, []);
}

export function ToolBlocoNotas() {
  const supabaseReady = useSupabaseReady();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [rows, setRows] = useState<SavedNoteRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const loadList = useCallback(async () => {
    if (!supabase) {
      setListError("Supabase não configurado.");
      setRows([]);
      return;
    }
    setListError(null);
    const { data, error } = await supabase
      .from("saved_notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setListError(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as SavedNoteRow[]);
  }, [supabase]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  function setFlash(text: string, ok: boolean) {
    setSaveMsg({ text, ok });
    setTimeout(() => setSaveMsg(null), 3000);
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function salvar() {
    const t = titulo.trim();
    if (!t) {
      setFlash("Dê um título à nota.", false);
      return;
    }
    if (!supabase) {
      setFlash("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.", false);
      return;
    }
    const { error } = await supabase.from("saved_notes").insert({
      titulo: t,
      conteudo: conteudo.trim(),
    });
    if (error) {
      setFlash("Erro: " + error.message, false);
      return;
    }
    setTitulo("");
    setConteudo("");
    setFlash("Nota guardada!", true);
    void loadList();
  }

  async function deletar(id: string) {
    if (!supabase) return;
    await supabase.from("saved_notes").delete().eq("id", id);
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    void loadList();
  }

  return (
    <>
      <div className="tool-header">
        <div className="tool-title">Bloco de notas</div>
        <div className="tool-desc">
          Título visível na lista; toque ou clique no título para mostrar ou esconder o conteúdo.
        </div>
      </div>

      {!supabaseReady && (
        <div className="env-banner">
          Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no <code>.env.local</code>.
        </div>
      )}

      <div className="card">
        <div className="card-title">Nova nota</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label htmlFor="nota-titulo">Título</label>
            <input
              id="nota-titulo"
              type="text"
              placeholder="Assunto ou nome da nota"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="nota-conteudo">Conteúdo</label>
            <textarea
              id="nota-conteudo"
              rows={5}
              placeholder="Texto da nota…"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              style={{
                width: "100%",
                resize: "vertical",
                minHeight: 120,
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
          <button type="button" className="btn btn-primary" onClick={() => void salvar()}>
            Guardar nota
          </button>
        </div>
        {saveMsg && (
          <div
            style={{
              fontSize: 12,
              marginTop: 8,
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
            Notas
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
            Nenhuma nota ainda.
          </span>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((item) => {
            const open = expanded.has(item.id);
            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: "var(--bg-2)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 14px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  onClick={() => toggleExpanded(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpanded(item.id);
                    }
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-3)",
                      transform: open ? "rotate(90deg)" : "none",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    ▸
                  </span>
                  <span className="hist-nome" style={{ flex: 1 }}>
                    {item.titulo}
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      void deletar(item.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
                {open && (
                  <div
                    style={{
                      padding: "0 14px 14px 38px",
                      fontSize: 14,
                      color: "var(--text-2)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      borderTop: "1px solid var(--border)",
                      paddingTop: 12,
                    }}
                  >
                    {item.conteudo || (
                      <span style={{ fontStyle: "italic", opacity: 0.6 }}>(sem conteúdo)</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
