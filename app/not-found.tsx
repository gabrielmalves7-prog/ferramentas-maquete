import Link from "next/link";

export default function NotFound() {
  return (
    <div className="tool-header" style={{ textAlign: "center", paddingTop: 24 }}>
      <div className="tool-title" style={{ justifyContent: "center" }}>
        Página não encontrada
      </div>
      <p className="tool-desc" style={{ paddingLeft: 0 }}>
        O endereço não existe ou foi movido.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link href="/escala" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
          Ir para Escala
        </Link>
      </p>
    </div>
  );
}
