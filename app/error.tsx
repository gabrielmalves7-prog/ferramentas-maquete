"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card" style={{ padding: 28 }}>
      <div className="card-title" style={{ marginBottom: 12 }}>
        Erro
      </div>
      <p style={{ color: "var(--text-2)", marginBottom: 20, fontSize: 14 }}>
        Algo correu mal ao mostrar esta página.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Tentar outra vez
      </button>
    </div>
  );
}
