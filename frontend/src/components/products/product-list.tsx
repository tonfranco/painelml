'use client';

import { useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { ProductCard } from './product-card';
import { ProductFilters } from './product-filters';
import { ProductDetailsModal } from './product-details-modal';
import { Loading } from '@/components/ui/loading';
import type { Item } from '@/types';

interface ProductListProps {
  items: Item[];
  isLoading?: boolean;
}

export function ProductList({ items, isLoading }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Filtrar e ordenar produtos
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.meliItemId.toLowerCase().includes(query)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Ordenação
    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'stock-asc':
        sorted.sort((a, b) => a.available - b.available);
        break;
      case 'stock-desc':
        sorted.sort((a, b) => b.available - a.available);
        break;
      case 'sold-desc':
        sorted.sort((a, b) => b.sold - a.sold);
        break;
      case 'recent':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
    }

    return sorted;
  }, [items, searchQuery, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loading size="lg" className="text-blue-600" />
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Contador de resultados */}
      <div className="mb-4 text-sm text-gray-600">
        {filteredAndSortedItems.length === items.length ? (
          <span>
            Mostrando <strong>{items.length}</strong> produto
            {items.length !== 1 && 's'}
          </span>
        ) : (
          <span>
            Mostrando <strong>{filteredAndSortedItems.length}</strong> de{' '}
            <strong>{items.length}</strong> produto
            {items.length !== 1 && 's'}
          </span>
        )}
      </div>

      {/* Grid de produtos */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filteredAndSortedItems.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onViewDetails={setSelectedItem}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center text-gray-500">
          <Package className="mb-4 h-16 w-16" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
          <p className="text-sm">Tente ajustar os filtros de busca</p>
        </div>
      )}

      {/* Modal de detalhes */}
      {selectedItem && (
        <ProductDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
