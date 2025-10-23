"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  meliOrderId: string;
  status: string;
  totalAmount: number;
  dateCreated: string;
  buyerId: string | null;
  updatedAt: string;
};

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const run = async () => {
      try {
        // Endpoint temporário - você pode criar um /orders no backend
        const res = await fetch(`${apiBase}/orders`, { credentials: "include" });
        if (!res.ok) {
          if (res.status === 404) {
            setError("Endpoint /orders não implementado ainda");
            setLoading(false);
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setOrders(json.items || []);
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
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
      case "confirmed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
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
              <Link href="/catalog" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                Catálogo
              </Link>
              <Link href="/orders" className="font-semibold text-zinc-900 dark:text-zinc-100">
                Pedidos
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Pedidos Recentes
          </h2>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>

        {loading && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400">Carregando pedidos...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Erro:</strong> {error}
            </p>
            <p className="mt-2 text-xs text-red-500 dark:text-red-500">
              Dica: Execute o backfill primeiro ou crie o endpoint GET /orders no backend
            </p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-zinc-600 dark:text-zinc-400">
              Nenhum pedido sincronizado ainda.
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
              Execute o backfill para importar seus pedidos.
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      Order ID
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      Valor
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      Data
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      Comprador
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                        {order.meliOrderId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        R$ {order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(order.dateCreated).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {order.buyerId || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
