export default function ImportPage() {
  return (
    <section className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Importar movimientos</h1>

      <div className="border rounded-xl p-4">
        <h2 className="text-lg font-medium mb-2">Ingreso manual</h2>
        <p className="text-sm text-gray-500 mb-4">
          Registra compras y ventas manualmente. Cada movimiento alimenta el sistema contable y tributario.
        </p>

        <a
          href="/import/manual"
          className="inline-block px-4 py-2 rounded-lg bg-black text-white"
        >
          Ir a ingreso manual
        </a>
      </div>
    </section>
  );
}