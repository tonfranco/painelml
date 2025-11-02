'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ShoppingCart, MessageCircle, BarChart3, Shield, Webhook, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();
  const [accountId, setAccountId] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const id = localStorage.getItem('accountId');
    setAccountId(id);
    
    // Se já tem conta conectada, redireciona para produtos
    if (id) {
      router.push('/products');
    }
  }, [router]);

  const connect = () => {
    window.location.href = `${apiBase}/meli/oauth/start`;
  };

  const features = [
    {
      icon: Package,
      title: 'Gestão de Produtos',
      description: 'Visualize e gerencie todo seu catálogo em um só lugar',
      color: 'blue',
      gradient: 'from-blue-50 to-white dark:from-blue-950 dark:to-gray-900',
      iconBg: 'bg-blue-500',
      border: 'border-l-blue-500',
    },
    {
      icon: ShoppingCart,
      title: 'Controle de Pedidos',
      description: 'Acompanhe vendas e status de envio em tempo real',
      color: 'green',
      gradient: 'from-green-50 to-white dark:from-green-950 dark:to-gray-900',
      iconBg: 'bg-green-500',
      border: 'border-l-green-500',
    },
    {
      icon: MessageCircle,
      title: 'Perguntas',
      description: 'Responda perguntas dos clientes com alertas de SLA',
      color: 'amber',
      gradient: 'from-amber-50 to-white dark:from-amber-950 dark:to-gray-900',
      iconBg: 'bg-amber-500',
      border: 'border-l-amber-500',
    },
    {
      icon: BarChart3,
      title: 'Dashboards',
      description: 'Métricas e insights para tomar melhores decisões',
      color: 'purple',
      gradient: 'from-purple-50 to-white dark:from-purple-950 dark:to-gray-900',
      iconBg: 'bg-purple-500',
      border: 'border-l-purple-500',
    },
    {
      icon: Shield,
      title: 'Segurança Avançada',
      description: 'Tokens criptografados com AES-256-GCM para máxima proteção',
      color: 'red',
      gradient: 'from-red-50 to-white dark:from-red-950 dark:to-gray-900',
      iconBg: 'bg-red-500',
      border: 'border-l-red-500',
    },
    {
      icon: Webhook,
      title: 'Webhooks em Tempo Real',
      description: 'Sincronização automática com dedupe de eventos',
      color: 'indigo',
      gradient: 'from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900',
      iconBg: 'bg-indigo-500',
      border: 'border-l-indigo-500',
    },
    {
      icon: Database,
      title: 'PostgreSQL Robusto',
      description: 'Banco de dados escalável com Docker para alta performance',
      color: 'cyan',
      gradient: 'from-cyan-50 to-white dark:from-cyan-950 dark:to-gray-900',
      iconBg: 'bg-cyan-500',
      border: 'border-l-cyan-500',
    },
    {
      icon: RefreshCw,
      title: 'Sync Automático',
      description: 'Backfill inteligente com refresh automático de tokens',
      color: 'emerald',
      gradient: 'from-emerald-50 to-white dark:from-emerald-950 dark:to-gray-900',
      iconBg: 'bg-emerald-500',
      border: 'border-l-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
            <div className="rounded-full bg-white dark:bg-gray-900 px-8 py-3">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Painel ML
              </h1>
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Sistema de Gestão para Vendedores do Mercado Livre
          </p>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Gerencie produtos, pedidos e perguntas em um só lugar
          </p>
        </div>

        {/* Layout com CTA no centro e Features ao redor */}
        <div className="relative mx-auto max-w-7xl">
          {/* Grid de Features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Primeira linha - 4 cards */}
            {features.slice(0, 4).map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title} 
                  className={`border-l-4 ${feature.border} bg-gradient-to-br ${feature.gradient} transition-all hover:shadow-xl hover:scale-105`}
                >
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex rounded-lg ${feature.iconBg} p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}

            {/* Card CTA no centro - ocupa 2 colunas no meio */}
            <div className="md:col-span-2 lg:col-span-4 flex justify-center my-8">
              <Card className="w-full max-w-2xl border-4 border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-2xl dark:from-blue-950 dark:to-gray-900">
                <CardContent className="p-10 text-center">
                  <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-5">
                    <Package className="h-16 w-16 text-white" />
                  </div>
                  <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                    Comece Agora
                  </h2>
                  <p className="mb-8 text-xl font-medium text-gray-700 dark:text-gray-300">
                    Conecte sua conta do Mercado Livre para começar a usar o painel
                  </p>
                  <Button
                    onClick={connect}
                    size="lg"
                    className="w-full max-w-md bg-gradient-to-r from-blue-500 to-purple-500 text-xl font-bold hover:from-blue-600 hover:to-purple-600 shadow-lg py-6"
                  >
                    Conectar Conta do Mercado Livre
                  </Button>
                  <p className="mt-6 text-base text-gray-600 dark:text-gray-400">
                    🔒 Conexão segura via OAuth 2.0
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Segunda linha - 4 cards */}
            {features.slice(4, 8).map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title} 
                  className={`border-l-4 ${feature.border} bg-gradient-to-br ${feature.gradient} transition-all hover:shadow-xl hover:scale-105`}
                >
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex rounded-lg ${feature.iconBg} p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
