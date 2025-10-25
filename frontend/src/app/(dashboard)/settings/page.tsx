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
  Clock,
  Bell,
  Palette,
  Database,
  Save,
  RotateCcw,
  Download,
  Trash2
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

interface Settings {
  id: string;
  accountId: string;
  syncInterval: number;
  syncItems: boolean;
  syncOrders: boolean;
  syncQuestions: boolean;
  syncHistoryDays: number;
  notificationsEnabled: boolean;
  notifyNewQuestions: boolean;
  notifyNewOrders: boolean;
  notifyLowStock: boolean;
  notifyQuestionsSLA: boolean;
  theme: string;
  language: string;
  timezone: string;
}

export default function SettingsPage() {
  const [accountId, setAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [webhookSubs, setWebhookSubs] = useState<WebhookSubscription[]>([]);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const id = localStorage.getItem("accountId");
    if (id) {
      setAccountId(id);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        fetch(`${apiBase}/accounts`),
        fetch(`${apiBase}/meli/webhooks/subscriptions`),
        fetch(`${apiBase}/meli/webhooks/stats`),
      ];

      if (accountId) {
        promises.push(fetch(`${apiBase}/settings?accountId=${accountId}`));
      }

      const responses = await Promise.all(promises);
      
      if (responses[0].ok) {
        const data = await responses[0].json();
        setAccounts(data.items || []);
      }

      if (responses[1].ok) {
        const data = await responses[1].json();
        setWebhookSubs(data.subscriptions || []);
      }

      if (responses[2].ok) {
        const data = await responses[2].json();
        setWebhookStats(data);
      }

      if (responses[3] && responses[3].ok) {
        const data = await responses[3].json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accountId]);

  const handleReconnect = () => {
    window.location.href = `${apiBase}/auth/meli`;
  };

  const handleSaveSettings = async () => {
    if (!accountId || !settings) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${apiBase}/settings?accountId=${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Configurações salvas com sucesso!');
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (!accountId || !confirm('Deseja realmente resetar todas as configurações?')) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${apiBase}/settings/reset?accountId=${accountId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        alert('Configurações resetadas com sucesso!');
      }
    } catch (error) {
      console.error("Erro ao resetar:", error);
      alert('Erro ao resetar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    const data = {
      accounts,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `painelml-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" className="text-blue-600" />
      </div>
    );
  }

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

        {/* Configurações de Sincronização */}
        {settings && (
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500 p-3">
                  <RefreshCw className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Sincronização
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure como os dados são sincronizados
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Intervalo de Sincronização (minutos)
                    </label>
                    <input
                      type="number"
                      value={settings.syncInterval}
                      onChange={(e) => setSettings({...settings, syncInterval: parseInt(e.target.value)})}
                      className="mt-2 w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      min="5"
                      max="1440"
                    />
                  </div>

                  <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Histórico (dias)
                    </label>
                    <input
                      type="number"
                      value={settings.syncHistoryDays}
                      onChange={(e) => setSettings({...settings, syncHistoryDays: parseInt(e.target.value)})}
                      className="mt-2 w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      min="7"
                      max="365"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Sincronizar:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { key: 'syncItems', label: 'Produtos' },
                      { key: 'syncOrders', label: 'Pedidos' },
                      { key: 'syncQuestions', label: 'Perguntas' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 rounded-lg bg-white p-3 cursor-pointer dark:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={settings[key as keyof Settings] as boolean}
                          onChange={(e) => setSettings({...settings, [key]: e.target.checked})}
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notificações */}
        {settings && (
          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500 p-3">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Notificações
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure alertas e notificações
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-lg bg-white p-4 cursor-pointer dark:bg-gray-800">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Ativar Notificações</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Habilitar todas as notificações</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => setSettings({...settings, notificationsEnabled: e.target.checked})}
                    className="h-5 w-5"
                  />
                </label>

                {settings.notificationsEnabled && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { key: 'notifyNewQuestions', label: 'Novas Perguntas', desc: 'Alerta quando receber perguntas' },
                      { key: 'notifyNewOrders', label: 'Novos Pedidos', desc: 'Alerta quando receber pedidos' },
                      { key: 'notifyLowStock', label: 'Estoque Baixo', desc: 'Alerta de produtos com pouco estoque' },
                      { key: 'notifyQuestionsSLA', label: 'SLA de Perguntas', desc: 'Alerta de perguntas fora do prazo' },
                    ].map(({ key, label, desc }) => (
                      <label key={key} className="flex items-start gap-3 rounded-lg bg-white p-3 cursor-pointer dark:bg-gray-800">
                        <input
                          type="checkbox"
                          checked={settings[key as keyof Settings] as boolean}
                          onChange={(e) => setSettings({...settings, [key]: e.target.checked})}
                          className="mt-1 h-4 w-4"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferências do Sistema */}
        {settings && (
          <Card className="border-l-4 border-l-pink-500 bg-gradient-to-br from-pink-50 to-white dark:from-pink-950 dark:to-gray-900">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-pink-500 p-3">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Preferências do Sistema
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Personalize a aparência e idioma
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tema
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings({...settings, theme: e.target.value})}
                    className="mt-2 w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>

                <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Idioma
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({...settings, language: e.target.value})}
                    className="mt-2 w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>

                <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Fuso Horário
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    className="mt-2 w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                    <option value="America/New_York">New York (GMT-5)</option>
                    <option value="Europe/London">London (GMT+0)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados e Privacidade */}
        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500 p-3">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Dados e Privacidade
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gerencie seus dados e privacidade
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="justify-start"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Dados
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Deseja limpar o cache local?')) {
                    localStorage.clear();
                    alert('Cache limpo com sucesso!');
                  }
                }}
                className="justify-start"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Cache
              </Button>
            </div>
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
            {webhookStats && (
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
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

        {/* Botões de Ação */}
        {settings && (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleResetSettings}
              disabled={saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Resetar
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-purple-500 font-bold"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
