"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Token = {
  id: string;
  tokenType: string | null;
  scope: string | null;
  expiresIn: number;
  obtainedAt: string;
};

export default function AccountTokensPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Token[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${apiBase}/accounts/${params.id}/tokens`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setItems(json.items || []);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [apiBase, params.id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col gap-6 py-12 px-8 bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Tokens recentes</h1>
          <div className="flex gap-3 text-sm">
            <Link href="/accounts" className="text-zinc-600 hover:underline dark:text-zinc-300">Voltar</Link>
            <Link href="/" className="text-zinc-600 hover:underline dark:text-zinc-300">Home</Link>
          </div>
        </div>
        {loading && <p className="text-zinc-600 dark:text-zinc-400">Carregando...</p>}
        {error && (
          <p className="text-red-600 dark:text-red-400">Erro ao carregar: {error}</p>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Scope</th>
                  <th className="py-2">Expira em (s)</th>
                  <th className="py-2">Obtido em</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-zinc-600 dark:text-zinc-400">Nenhum token encontrado.</td>
                  </tr>
                )}
                {items.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2">{t.tokenType ?? "-"}</td>
                    <td className="py-2">{t.scope ?? "-"}</td>
                    <td className="py-2">{t.expiresIn}</td>
                    <td className="py-2">{new Date(t.obtainedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
