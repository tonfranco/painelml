"use client";

import { useEffect, useState } from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Webhook, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Account {
  id: string;
  sellerId: string;
  nickname: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WebhookSubscription {
  topic: string;
  eventsReceived: number;
  status: string;
}

interface WebhookStats {
  total: number;
  processed: number;
  pending: number;
  byTopic: { topic: string; count: number }[];
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [webhookSubs, setWebhookSubs] = useState<WebhookSubscription[]>([]);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, subsRes, statsRes] = await Promise.all([
        fetch(`${apiBase}/accounts`),
        fetch(`${apiBase}/meli/webhooks/subscriptions`),
        fetch(`${apiBase}/meli/webhooks/stats`),
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.items || []);
      }

      if (subsRes.ok) {
        const data = await subsRes.json();
        setWebhookSubs(data.subscriptions || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setWebhookStats(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReconnect = () => {
    window.location.href = `${apiBase}/auth/meli`;
  };

  const getTopicLabel = (topic: string) => {
    const labels: Record<string, string> = {
      orders_v2: "Pedidos",
      items: "Produtos",
      questions: "Perguntas",
      shipments: "Envios",
    };
    return labels[topic] || topic;
  };

  const getTopicColor = (topic: string) => {
    const colors: Record<string, string> = {
      orders_v2: "text-green-500",
      items: "text-blue-500",
      questions: "text-amber-500",
      shipments: "text-purple-500",
    };
    return colors[topic] || "text-gray-500";
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configurações
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Gerencie as configurações do sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loading size="lg" className="text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Contas Conectadas */}
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-500 p-3">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                      Contas do Mercado Livre
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gerencie suas contas conectadas
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleReconnect}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 font-bold"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Conectar Nova Conta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 text-amber-500" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    Nenhuma conta conectada
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Conecte uma conta do Mercado Livre para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-lg bg-white p-4 dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {account.nickname || `Seller ${account.sellerId}`}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            ID: {account.sellerId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="success" className="mb-1">
                          Ativa
                        </Badge>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Conectada{" "}
                          {formatDistanceToNow(new Date(account.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-500 p-3">
                  <Webhook className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Webhooks do Mercado Livre
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status das notificações em tempo real
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              {webhookStats && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Total de Eventos
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {webhookStats.total}
                        </p>
                      </div>
                      <Webhook className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Processados
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {webhookStats.processed}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Pendentes
                        </p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {webhookStats.pending}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-amber-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Subscriptions */}
              <div>
                <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
                  Tópicos Inscritos
                </h3>
                {webhookSubs.length === 0 ? (
                  <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
                    <XCircle className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      Nenhum webhook configurado
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {webhookSubs.map((sub) => (
                      <div
                        key={sub.topic}
                        className="flex items-center justify-between rounded-lg bg-white p-4 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <Webhook className={`h-5 w-5 ${getTopicColor(sub.topic)}`} />
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">
                              {getTopicLabel(sub.topic)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {sub.eventsReceived} eventos recebidos
                            </p>
                          </div>
                        </div>
                        <Badge variant="success">Ativo</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
