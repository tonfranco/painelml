'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  MessageCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Edit,
  Bus,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Produtos', href: '/products', icon: Package },
  { name: 'Gerenciar Anúncios', href: '/products-management', icon: Edit },
  { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
  { name: 'Envios', href: '/pending-shipments', icon: Bus },
  { name: 'Perguntas', href: '/questions', icon: MessageCircle },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div 
      className={cn(
        'flex h-screen flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <h1 className="text-xl font-bold text-primary">Painel ML</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                'hover:scale-105',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        )}
        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            'text-foreground hover:bg-destructive/10 hover:text-destructive'
          )}
          onClick={() => {
            localStorage.removeItem('accountId');
            window.location.href = '/';
          }}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}
