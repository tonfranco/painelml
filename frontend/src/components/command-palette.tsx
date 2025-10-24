'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  MessageCircle,
  Settings,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const commands = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', keywords: 'home inicio' },
  { name: 'Produtos', icon: Package, href: '/products', keywords: 'items catalogo' },
  { name: 'Pedidos', icon: ShoppingCart, href: '/orders', keywords: 'vendas orders' },
  { name: 'Perguntas', icon: MessageCircle, href: '/questions', keywords: 'duvidas mensagens' },
  { name: 'Configurações', icon: Settings, href: '/settings', keywords: 'config ajustes' },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);

  const filtered = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.keywords.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selected]) {
          router.push(filtered[selected].href);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selected, router, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelected(0);
              }}
              className="flex h-12 w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            ) : (
              filtered.map((cmd, index) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.href}
                    onClick={() => {
                      router.push(cmd.href);
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      index === selected
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-accent/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cmd.name}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Use ↑ ↓ para navegar</span>
              <span>Enter para selecionar</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
