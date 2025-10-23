"use client";
import { useEffect, useState } from "react";

type Account = {
  id: string;
  sellerId: string;
  nickname: string | null;
  siteId: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AccountsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Account[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${apiBase}/accounts`, { credentials: "include" });
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
  }, [apiBase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col gap-6 py-12 px-8 bg-white dark:bg-black">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Contas conectadas</h1>
          <a href="/" className="text-sm text-zinc-600 hover:underline dark:text-zinc-300">Voltar</a>
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
                  <th className="py-2">Seller ID</th>
                  <th className="py-2">Nickname</th>
                  <th className="py-2">Site</th>
                  <th className="py-2">Criado</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-zinc-600 dark:text-zinc-400">Nenhuma conta conectada ainda.</td>
                  </tr>
                )}
                {items.map((acc) => (
                  <tr key={acc.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2">{acc.sellerId}</td>
                    <td className="py-2">{acc.nickname ?? "-"}</td>
                    <td className="py-2">{acc.siteId ?? "-"}</td>
                    <td className="py-2">{new Date(acc.createdAt).toLocaleString()}</td>
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
