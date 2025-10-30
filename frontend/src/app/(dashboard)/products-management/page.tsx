"use client";
import { useEffect, useState } from "react";
import { 
  RefreshCw, 
  Package, 
  Plus, 
  Copy, 
  Edit, 
  DollarSign, 
  Archive,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

type Product = {
  id: string;
  meliItemId: string;
  title: string;
  status: string;
  price: number;
  available: number;
  sold: number;
  thumbnail: string | null;
  permalink: string | null;
  has_bids: boolean;
  buying_mode: string | null;
  listing_type_id: string | null;
};

export default function ProductsManagementPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkStock, setBulkStock] = useState("");
  const [bulkPrice, setBulkPrice] = useState("");
  
  // Modals state
  const [priceModal, setPriceModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [stockModal, setStockModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [duplicateModal, setDuplicateModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [titleSuffix, setTitleSuffix] = useState("");
  
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const accountId = typeof window !== 'undefined' ? localStorage.getItem("accountId") : null;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/items?accountId=${accountId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.items || []);
      setFilteredProducts(data.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchProducts();
    }
  }, [accountId]);

  useEffect(() => {
    const filtered = products.filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.meliItemId.includes(searchTerm)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const toggleSelectProduct = (meliItemId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(meliItemId)) {
      newSelected.delete(meliItemId);
    } else {
      newSelected.add(meliItemId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.meliItemId)));
    }
  };

  const duplicateProduct = async (itemId: string, titleModification: string) => {
    try {
      const res = await fetch(
        `${apiBase}/items-management/duplicate/${itemId}?accountId=${accountId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titleSuffix: titleModification }),
        }
      );
      const data = await res.json();
      if (data.success) {
        addToast({
          type: "success",
          title: "Anúncio duplicado!",
          description: `Novo ID: ${data.newItemId}`
        });
        fetchProducts();
      } else {
        // Mostrar detalhes do erro se disponível
        let errorDesc = data.error;
        if (data.details) {
          console.error('Duplicate error details:', data.details);
          if (data.details.cause && Array.isArray(data.details.cause)) {
            errorDesc += '\n\nDetalhes:\n' + data.details.cause.map((c: any) => 
              `• ${c.code || ''}: ${c.message || JSON.stringify(c)}`
            ).join('\n');
          }
        }
        
        addToast({
          type: "error",
          title: "Erro ao duplicar",
          description: errorDesc
        });
      }
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Erro ao duplicar",
        description: error.message
      });
    }
  };

  const updateStock = async (itemId: string, quantity: number) => {
    try {
      const res = await fetch(
        `${apiBase}/items-management/stock/${itemId}?accountId=${accountId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        }
      );
      const data = await res.json();
      if (data.success) {
        addToast({
          type: "success",
          title: "Estoque atualizado!",
          description: `Nova quantidade: ${quantity}`
        });
        fetchProducts();
      } else {
        let title = "Erro ao atualizar estoque";
        let description = data.error || "Erro desconhecido";
        
        // Mensagens amigáveis para erros comuns
        if (description.includes("paused")) {
          title = "Anúncio pausado";
          description = "Você precisa reativar o anúncio antes de atualizar o estoque.";
        } else if (description.includes("401")) {
          title = "Token expirado";
          description = "Tente novamente (será renovado automaticamente)";
        }
        
        addToast({ type: "error", title, description });
      }
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Erro ao atualizar estoque",
        description: error.message
      });
    }
  };

  const updatePrice = async (itemId: string, price: number) => {
    try {
      const res = await fetch(
        `${apiBase}/items-management/price/${itemId}?accountId=${accountId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ price }),
        }
      );
      const data = await res.json();
      if (data.success) {
        addToast({
          type: "success",
          title: "Preço atualizado!",
          description: `Novo preço: R$ ${price.toFixed(2)}`
        });
        fetchProducts();
      } else {
        let title = "Erro ao atualizar preço";
        let description = data.error || "Erro desconhecido";
        
        // Mensagens amigáveis para erros comuns
        if (description.includes("paused")) {
          title = "Anúncio pausado";
          description = "Você precisa reativar o anúncio no Mercado Livre antes de atualizar o preço.";
        } else if (description.includes("under_review")) {
          title = "Anúncio em revisão";
          description = "Aguarde a aprovação do Mercado Livre antes de fazer alterações.";
        } else if (description.includes("has_bids")) {
          title = "Anúncio com lances ativos";
          description = "Não é possível alterar preço durante leilão.";
        } else if (description.includes("401")) {
          title = "Token expirado";
          description = "Tente novamente (será renovado automaticamente)";
        }
        
        addToast({ type: "error", title, description });
      }
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Erro ao atualizar preço",
        description: error.message
      });
    }
  };

  const bulkUpdateStock = async () => {
    if (!bulkStock || selectedProducts.size === 0) return;

    const items = Array.from(selectedProducts).map((itemId) => ({
      itemId,
      quantity: parseInt(bulkStock),
    }));

    try {
      const res = await fetch(
        `${apiBase}/items-management/stock/bulk?accountId=${accountId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        }
      );
      const data = await res.json();
      addToast({
        type: data.failed > 0 ? "warning" : "success",
        title: "Atualização em massa concluída",
        description: `Sucesso: ${data.successful}\nFalhas: ${data.failed}`
      });
      fetchProducts();
      setSelectedProducts(new Set());
      setBulkStock("");
      setShowBulkEdit(false);
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Erro na atualização em massa",
        description: error.message
      });
    }
  };

  const bulkUpdatePrice = async () => {
    if (!bulkPrice || selectedProducts.size === 0) return;

    // Filtrar produtos com lances ativos
    const productsWithBids = filteredProducts.filter(p => 
      selectedProducts.has(p.meliItemId) && p.has_bids
    );
    
    if (productsWithBids.length > 0) {
      addToast({
        type: "warning",
        title: "Alguns produtos não podem ser atualizados",
        description: `${productsWithBids.length} produto(s) com lances ativos foram ignorados.\n\nItens com lances não podem ter o preço alterado por restrição do Mercado Livre.`
      });
    }

    const validItems = Array.from(selectedProducts)
      .filter(itemId => !filteredProducts.find(p => p.meliItemId === itemId && p.has_bids))
      .map((itemId) => ({
        itemId,
        price: parseFloat(bulkPrice),
      }));

    if (validItems.length === 0) {
      addToast({
        type: "warning",
        title: "Nenhum produto válido",
        description: "Todos os produtos selecionados têm lances ativos e não podem ser atualizados."
      });
      return;
    }

    try {
      const res = await fetch(
        `${apiBase}/items-management/price/bulk?accountId=${accountId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: validItems }),
        }
      );
      const data = await res.json();
      addToast({
        type: data.failed > 0 ? "warning" : "success",
        title: "Atualização em massa concluída",
        description: `Sucesso: ${data.successful}\nFalhas: ${data.failed}\nIgnorados (com lances): ${productsWithBids.length}`
      });
      fetchProducts();
      setSelectedProducts(new Set());
      setBulkPrice("");
      setShowBulkEdit(false);
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Erro na atualização em massa",
        description: error.message
      });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Anúncios
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Crie, duplique e gerencie seus produtos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts} disabled={loading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="info">{selectedProducts.size} selecionados</Badge>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowBulkEdit(!showBulkEdit)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar em Massa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Bulk Edit Panel */}
          {showBulkEdit && selectedProducts.size > 0 && (
            <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <h3 className="font-bold mb-3">Atualização em Massa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Estoque</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Quantidade"
                      value={bulkStock}
                      onChange={(e) => setBulkStock(e.target.value)}
                    />
                    <Button onClick={bulkUpdateStock} disabled={!bulkStock}>
                      <Archive className="mr-2 h-4 w-4" />
                      Aplicar
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Preço</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Preço"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                    />
                    <Button onClick={bulkUpdatePrice} disabled={!bulkPrice}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-lg font-semibold">Carregando produtos...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredProducts.length} produtos encontrados
            </p>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedProducts.size === filteredProducts.length ? "Desmarcar Todos" : "Selecionar Todos"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`border-l-4 ${
                  selectedProducts.has(product.meliItemId)
                    ? "border-l-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-l-green-500"
                } hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => toggleSelectProduct(product.meliItemId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm line-clamp-2 text-gray-900 dark:text-white">
                        {product.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {product.meliItemId}
                      </p>
                      {/* Status Badge */}
                      <div className="mt-2">
                        {product.status === 'active' && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                            ✓ Ativo
                          </Badge>
                        )}
                        {product.status === 'paused' && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                            ⏸ Pausado
                          </Badge>
                        )}
                        {product.status === 'under_review' && (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
                            🔍 Em Revisão
                          </Badge>
                        )}
                        {product.status === 'closed' && (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-xs">
                            ✕ Fechado
                          </Badge>
                        )}
                        {product.has_bids && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                            🏆 Com Lances
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2" onClick={(e: any) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Preço:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      R$ {product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Estoque:</span>
                    <span className="font-bold">{product.available}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Vendidos:</span>
                    <span className="font-bold text-blue-600">{product.sold}</span>
                  </div>

                  <div className="pt-2 border-t flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setDuplicateModal({ open: true, product });
                        setTitleSuffix("");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        if (product.status !== 'active') {
                          addToast({
                            type: "warning",
                            title: "Anúncio não está ativo",
                            description: `Status: ${product.status}\n\nApenas anúncios ATIVOS podem ter estoque alterado.`
                          });
                          return;
                        }
                        setStockModal({ open: true, product });
                        setNewStock(product.available.toString());
                      }}
                      disabled={product.status !== 'active'}
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Estoque
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        if (product.status !== 'active') {
                          addToast({
                            type: "warning",
                            title: "Anúncio não está ativo",
                            description: `Status: ${product.status}\n\nApenas anúncios ATIVOS podem ter preço alterado.`
                          });
                          return;
                        }
                        if (product.has_bids) {
                          addToast({
                            type: "warning",
                            title: "Anúncio com lances ativos",
                            description: "Não é possível alterar preço de anúncios com lances ativos.\n\nEsta é uma restrição do Mercado Livre para proteger os compradores em leilões."
                          });
                          return;
                        }
                        setPriceModal({ open: true, product });
                        setNewPrice(product.price.toString());
                      }}
                      disabled={product.status !== 'active' || product.has_bids}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Preço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal de Atualizar Preço */}
      <Dialog open={priceModal.open} onOpenChange={(open) => setPriceModal({ open, product: null })}>
        <DialogContent>
          <DialogHeader onClose={() => setPriceModal({ open: false, product: null })}>
            <DialogTitle>Atualizar Preço</DialogTitle>
            <DialogDescription>
              {priceModal.product?.title}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preço Atual
                </label>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {priceModal.product?.price.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Novo Preço *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="text-lg"
                  autoFocus
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPriceModal({ open: false, product: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (priceModal.product && newPrice) {
                  updatePrice(priceModal.product.meliItemId, parseFloat(newPrice));
                  setPriceModal({ open: false, product: null });
                }
              }}
              disabled={!newPrice || parseFloat(newPrice) <= 0}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Atualizar Preço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Atualizar Estoque */}
      <Dialog open={stockModal.open} onOpenChange={(open) => setStockModal({ open, product: null })}>
        <DialogContent>
          <DialogHeader onClose={() => setStockModal({ open: false, product: null })}>
            <DialogTitle>Atualizar Estoque</DialogTitle>
            <DialogDescription>
              {stockModal.product?.title}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estoque Atual
                </label>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stockModal.product?.available} unidades
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova Quantidade *
                </label>
                <Input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="0"
                  className="text-lg"
                  autoFocus
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStockModal({ open: false, product: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (stockModal.product && newStock) {
                  updateStock(stockModal.product.meliItemId, parseInt(newStock));
                  setStockModal({ open: false, product: null });
                }
              }}
              disabled={!newStock || parseInt(newStock) < 0}
            >
              <Archive className="mr-2 h-4 w-4" />
              Atualizar Estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Duplicar Anúncio */}
      <Dialog open={duplicateModal.open} onOpenChange={(open) => setDuplicateModal({ open, product: null })}>
        <DialogContent>
          <DialogHeader onClose={() => setDuplicateModal({ open: false, product: null })}>
            <DialogTitle>Duplicar Anúncio</DialogTitle>
            <DialogDescription>
              {duplicateModal.product?.title}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Título original:</strong><br />
                  {duplicateModal.product?.title}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sufixo do Título (opcional)
                </label>
                <Input
                  type="text"
                  value={titleSuffix}
                  onChange={(e) => setTitleSuffix(e.target.value)}
                  placeholder="Ex: - Cópia, - Variante 2"
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Se não informar, será adicionado " - Cópia" automaticamente
                </p>
              </div>
              {titleSuffix && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>Novo título:</strong><br />
                    {duplicateModal.product?.title} {titleSuffix}
                  </p>
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateModal({ open: false, product: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (duplicateModal.product) {
                  duplicateProduct(duplicateModal.product.meliItemId, titleSuffix);
                  setDuplicateModal({ open: false, product: null });
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicar Anúncio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
