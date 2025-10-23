"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  meliItemId: string;
  title: string;
  status: string;
  price: number;
  available: number;
  thumbnail: string | null;
  updatedAt: string;
};

export default function CatalogPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const run = async () => {
      try {
        // Endpoint temporário - você pode criar um /items no backend
        const res = await fetch(`${apiBase}/items`, { credentials: "include" });
        if (!res.ok) {
          if (res.status === 404) {
            setError("Endpoint /items não implementado ainda");
            setLoading(false);
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setItems(json.items || []);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [apiBase]);

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "paused":
        return "text-yellow-600 dark:text-yellow-400";
      case "closed":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-zinc-600 dark:text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Painel ML
            </h1>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Home
              </Link>
              <Link href="/accounts" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Contas
              </Link>
              <Link href="/catalog" className="font-semibold text-zinc-900 dark:text-zinc-100">
                Catálogo
              </Link>
              <Link href="/orders" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Pedidos
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Catálogo de Produtos
          </h2>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
        </div>

        {loading && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400">Carregando catálogo...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Erro:</strong> {error}
            </p>
            <p className="mt-2 text-xs text-red-500 dark:text-red-500">
              Dica: Execute o backfill primeiro ou crie o endpoint GET /items no backend
            </p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400">
              Nenhum item sincronizado ainda.
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
              Execute o backfill para importar seus produtos.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="mb-2 line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h3>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      R$ {item.price.toFixed(2)}
                    </span>
                    <span className={`text-xs font-medium ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Disponível: {item.available}</span>
                    <span>{item.meliItemId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
