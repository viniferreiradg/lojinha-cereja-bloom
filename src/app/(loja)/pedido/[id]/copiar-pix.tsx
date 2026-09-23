"use client";

import { useState } from "react";

export function CopiarPix({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // sem permissão de área de transferência: a pessoa ainda pode selecionar o texto
    }
  }

  return (
    <div className="mt-4">
      <textarea
        readOnly
        value={codigo}
        rows={3}
        onFocus={(e) => e.currentTarget.select()}
        className="campo resize-none break-all font-mono text-xs"
      />
      <button type="button" onClick={copiar} className="btn btn-contorno mt-2 w-full">
        {copiado ? "✓ Código copiado" : "Copiar PIX copia e cola"}
      </button>
    </div>
  );
}
