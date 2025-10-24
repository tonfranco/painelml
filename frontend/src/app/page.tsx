'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ShoppingCart, MessageCircle, BarChart3 } from 'lucide-react';
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
    },
    {
      icon: ShoppingCart,
      title: 'Controle de Pedidos',
      description: 'Acompanhe vendas e status de envio em tempo real',
    },
    {
      icon: MessageCircle,
      title: 'Perguntas',
      description: 'Responda perguntas dos clientes com alertas de SLA',
    },
    {
      icon: BarChart3,
      title: 'Dashboards',
      description: 'Métricas e insights para tomar melhores decisões',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Painel ML
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de Gestão para Vendedores do Mercado Livre
          </p>
        </div>

        {/* CTA */}
        <div className="mb-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                Comece Agora
              </h2>
              <p className="mb-6 text-gray-600">
                Conecte sua conta do Mercado Livre para começar a usar o painel
              </p>
              <Button
                onClick={connect}
                size="lg"
                className="w-full"
              >
                Conectar Conta do Mercado Livre
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
