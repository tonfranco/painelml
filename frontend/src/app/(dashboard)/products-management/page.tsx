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
  X,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  MoreVertical
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
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; product: Product | null; details: any }>({ open: false, product: null, details: null });
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string; technicalDetails: any }>({ 
    open: false, 
    title: "", 
    message: "", 
    technicalDetails: null 
  });
  const [successModal, setSuccessModal] = useState<{ open: boolean; title: string; message: string; details: any }>({ 
    open: false, 
    title: "", 
    message: "", 
    details: null 
  });
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [titleSuffix, setTitleSuffix] = useState("");
  const [duplicateQuantity, setDuplicateQuantity] = useState("1");
  const [ignoreVariations, setIgnoreVariations] = useState(false);
  
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

  const duplicateProduct = async (itemId: string, titleModification: string, quantity: number, ignoreVars: boolean = false) => {
    try {
      const res = await fetch(
        `${apiBase}/items-management/duplicate/${itemId}?accountId=${accountId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            titleSuffix: titleModification,
            quantity: quantity,
            ignoreVariations: ignoreVars
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        let successMsg = "";
        let successTitle = "";
        
        if (quantity > 1) {
          successTitle = "✅ Duplicação em Massa Concluída";
          successMsg = `${data.created} de ${data.total} anúncios criados com sucesso!`;
          if (data.failed > 0) {
            successMsg += `\n\n⚠️ ${data.failed} cópia(s) falharam.`;
          }
        } else {
          successTitle = "✅ Anúncio Duplicado com Sucesso!";
          successMsg = `O anúncio foi duplicado com sucesso.\n\nNovo ID: ${data.items[0].itemId}\nTítulo: ${data.items[0].title}`;
        }
        
        setSuccessModal({
          open: true,
          title: successTitle,
          message: successMsg,
          details: {
            created: data.created,
            failed: data.failed,
            total: data.total,
            items: data.items,
            timestamp: new Date().toISOString()
          }
        });
        fetchProducts();
      } else {
        // Mostrar detalhes do erro se disponível
        let errorDesc = data.error || "Erro desconhecido ao duplicar anúncio";
        
        // Se houver erros específicos na resposta, mostrar
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          if (data.total === 1) {
            // Se foi apenas 1 cópia, mostrar apenas a mensagem do erro
            errorDesc = data.errors[0].error;
          } else {
            // Se foram múltiplas cópias, mostrar resumo
            errorDesc = `Falha ao criar ${data.failed} de ${data.total} cópia(s):\n\n`;
            data.errors.forEach((err: any) => {
              errorDesc += `Cópia ${err.index}: ${err.error}\n`;
            });
          }
        } else if (data.details) {
          console.error('Duplicate error details:', data.details);
          if (data.details.cause && Array.isArray(data.details.cause)) {
            errorDesc += '\n\nDetalhes:\n' + data.details.cause.map((c: any) => 
              `• ${c.code || ''}: ${c.message || JSON.stringify(c)}`
            ).join('\n');
          }
        }
        
        // Título específico baseado no tipo de erro
        let errorTitle = "Erro ao Duplicar Anúncio";
        if (data.reason === 'HAS_VARIATIONS') {
          errorTitle = "⚠️ Anúncio com Variações";
        } else if (data.reason === 'NOT_ACTIVE') {
          errorTitle = "⚠️ Anúncio Não Está Ativo";
        } else if (errorDesc.includes('GTIN') || errorDesc.includes('Código de Barras')) {
          errorTitle = "⚠️ Código de Barras Obrigatório";
        }
        
        setErrorModal({
          open: true,
          title: errorTitle,
          message: errorDesc,
          technicalDetails: {
            itemId,
            quantity,
            reason: data.reason,
            apiResponse: data,
            timestamp: new Date().toISOString(),
          }
        });
      }
    } catch (error: any) {
      setErrorModal({
        open: true,
        title: "Erro ao Duplicar Anúncio",
        message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        technicalDetails: {
          error: error.message,
          timestamp: new Date().toISOString(),
        }
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
        
        setErrorModal({
          open: true,
          title,
          message: description,
          technicalDetails: {
            itemId,
            quantity,
            apiResponse: data,
            timestamp: new Date().toISOString(),
          }
        });
      }
    } catch (error: any) {
      setErrorModal({
        open: true,
        title: "Erro ao Atualizar Estoque",
        message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        technicalDetails: {
          error: error.message,
          timestamp: new Date().toISOString(),
        }
      });
    }
  };

  const fetchItemDetails = async (itemId: string) => {
    try {
      const res = await fetch(
        `${apiBase}/items-management/item/${itemId}?accountId=${accountId}`
      );
      const data = await res.json();
      if (data.success) {
        return data.data;
      } else {
        setErrorModal({
          open: true,
          title: "Erro ao Buscar Detalhes",
          message: data.error || "Erro desconhecido",
          technicalDetails: {
            itemId,
            apiResponse: data,
            timestamp: new Date().toISOString(),
          }
        });
        return null;
      }
    } catch (error: any) {
      setErrorModal({
        open: true,
        title: "Erro ao Buscar Detalhes",
        message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        technicalDetails: {
          error: error.message,
          timestamp: new Date().toISOString(),
        }
      });
      return null;
    }
  };

  const showItemDetails = async (product: Product) => {
    const details = await fetchItemDetails(product.meliItemId);
    if (details) {
      setDetailsModal({ open: true, product, details });
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
        // Mostrar modal de erro com detalhes técnicos
        let title = "Erro ao atualizar preço";
        let message = data.error || "Erro desconhecido";
        
        // Mensagens amigáveis para erros comuns
        if (message.includes("paused")) {
          title = "Anúncio Pausado";
          message = "Você precisa reativar o anúncio no Mercado Livre antes de atualizar o preço.";
        } else if (message.includes("under_review")) {
          title = "Anúncio em Revisão";
          message = "Aguarde a aprovação do Mercado Livre antes de fazer alterações.";
        } else if (message.includes("has_bids") || message.includes("leilão") || message.includes("not_modifiable")) {
          title = "Preço Não Modificável";
          // Manter a mensagem original que já vem detalhada do backend
        } else if (message.includes("401")) {
          title = "Token Expirado";
          message = "Tente novamente. O token será renovado automaticamente.";
        }
        
        setErrorModal({
          open: true,
          title,
          message,
          technicalDetails: {
            itemId,
            errorCode: data.errorCode,
            apiResponse: data.details,
            timestamp: new Date().toISOString(),
          }
        });
      }
    } catch (error: any) {
      setErrorModal({
        open: true,
        title: "Erro de Conexão",
        message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        technicalDetails: {
          error: error.message,
          timestamp: new Date().toISOString(),
        }
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
      setErrorModal({
        open: true,
        title: "Erro na Atualização em Massa de Estoque",
        message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        technicalDetails: {
          error: error.message,
          selectedItems: Array.from(selectedProducts),
          timestamp: new Date().toISOString(),
        }
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
      setErrorModal({
        open: true,
        title: "⚠️ Alguns Produtos Não Podem Ser Atualizados",
        message: `${productsWithBids.length} produto(s) com lances ativos foram ignorados.\n\nItens com lances não podem ter o preço alterado por restrição do Mercado Livre.`,
        technicalDetails: {
          productsWithBids: productsWithBids.map(p => ({ id: p.meliItemId, title: p.title })),
          timestamp: new Date().toISOString(),
        }
      });
    }

    const validItems = Array.from(selectedProducts)
      .filter(itemId => !filteredProducts.find(p => p.meliItemId === itemId && p.has_bids))
      .map((itemId) => ({
        itemId,
        price: parseFloat(bulkPrice),
      }));

    if (validItems.length === 0) {
      setErrorModal({
        open: true,
        title: "⚠️ Nenhum Produto Válido",
        message: "Todos os produtos selecionados têm lances ativos e não podem ser atualizados.",
        technicalDetails: {
          selectedProducts: Array.from(selectedProducts),
          timestamp: new Date().toISOString(),
        }
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
      setErrorModal({
        open: true,
        title: "Erro na Atualização em Massa de Preço",
        message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        technicalDetails: {
          error: error.message,
          selectedItems: Array.from(selectedProducts),
          timestamp: new Date().toISOString(),
        }
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

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => showItemDetails(product)}
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setDuplicateModal({ open: true, product });
                        setTitleSuffix("");
                        setDuplicateQuantity("1");
                        setIgnoreVariations(false);
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        if (product.status !== 'active') {
                          setErrorModal({
                            open: true,
                            title: "⚠️ Anúncio Não Está Ativo",
                            message: `Status atual: ${product.status}\n\nApenas anúncios ATIVOS podem ter estoque alterado.`,
                            technicalDetails: {
                              itemId: product.meliItemId,
                              status: product.status,
                              timestamp: new Date().toISOString(),
                            }
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
                      className="text-xs"
                      onClick={() => {
                        if (product.status !== 'active') {
                          setErrorModal({
                            open: true,
                            title: "⚠️ Anúncio Não Está Ativo",
                            message: `Status atual: ${product.status}\n\nApenas anúncios ATIVOS podem ter preço alterado.`,
                            technicalDetails: {
                              itemId: product.meliItemId,
                              status: product.status,
                              timestamp: new Date().toISOString(),
                            }
                          });
                          return;
                        }
                        if (product.has_bids) {
                          setErrorModal({
                            open: true,
                            title: "⚠️ Anúncio com Lances Ativos",
                            message: "Não é possível alterar preço de anúncios com lances ativos.\n\nEsta é uma restrição do Mercado Livre para proteger os compradores em leilões.",
                            technicalDetails: {
                              itemId: product.meliItemId,
                              has_bids: product.has_bids,
                              buying_mode: product.buying_mode,
                              listing_type_id: product.listing_type_id,
                              timestamp: new Date().toISOString(),
                            }
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
                  Quantidade de Cópias *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={duplicateQuantity}
                  onChange={(e) => setDuplicateQuantity(e.target.value)}
                  placeholder="1"
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Informe quantas cópias deseja criar (máximo: 50)
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
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {parseInt(duplicateQuantity) > 1 
                    ? "Será adicionado um número sequencial automaticamente (Ex: Cópia 1, Cópia 2...)"
                    : "Se não informar, será adicionado ' - Cópia' automaticamente"}
                </p>
              </div>
              
              {/* Checkbox para ignorar variações */}
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <input
                  type="checkbox"
                  id="ignoreVariations"
                  checked={ignoreVariations}
                  onChange={(e) => setIgnoreVariations(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="ignoreVariations" className="flex-1 text-sm text-yellow-800 dark:text-yellow-200 cursor-pointer">
                  <strong>Criar sem variações</strong>
                  <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                    Se o anúncio tiver variações (cores, tamanhos, etc.), marque esta opção para criar uma cópia simples. 
                    Você poderá adicionar as variações manualmente depois no Mercado Livre.
                  </p>
                </label>
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
                  const qty = parseInt(duplicateQuantity) || 1;
                  duplicateProduct(duplicateModal.product.meliItemId, titleSuffix, qty, ignoreVariations);
                  setDuplicateModal({ open: false, product: null });
                }
              }}
              disabled={!duplicateQuantity || parseInt(duplicateQuantity) < 1 || parseInt(duplicateQuantity) > 50}
            >
              <Copy className="mr-2 h-4 w-4" />
              {parseInt(duplicateQuantity) > 1 ? `Criar ${duplicateQuantity} Cópias` : 'Duplicar Anúncio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Item */}
      <Dialog open={detailsModal.open} onOpenChange={(open) => setDetailsModal({ open, product: null, details: null })}>
        <DialogContent>
          <DialogHeader onClose={() => setDetailsModal({ open: false, product: null, details: null })}>
            <DialogTitle>Detalhes do Anúncio</DialogTitle>
            <DialogDescription>
              {detailsModal.product?.title}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {detailsModal.details && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID do Item
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {detailsModal.details.id}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <Badge variant={detailsModal.details.status === 'active' ? 'success' : 'default'}>
                      {detailsModal.details.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Listagem
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {detailsModal.details.listing_type_id}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Modo de Compra
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {detailsModal.details.buying_mode || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preço
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white font-bold">
                      R$ {detailsModal.details.price?.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estoque Disponível
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {detailsModal.details.available_quantity}
                    </div>
                  </div>
                </div>

                {/* Informações sobre leilão */}
                {(detailsModal.details.listing_type_id?.toLowerCase().includes('auction') || 
                  (detailsModal.details.non_mercado_pago_payment_methods && 
                   detailsModal.details.non_mercado_pago_payment_methods.length > 0)) && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                          Anúncio em Formato de Leilão
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          Este anúncio está configurado como leilão. Não é possível alterar o preço de anúncios 
                          em formato de leilão através da API do Mercado Livre. Você precisa editar diretamente 
                          no site do Mercado Livre.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informação sobre produto do catálogo */}
                {detailsModal.details.catalog_product_id && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                          Produto do Catálogo ML
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Este é um produto catalogado (ID: {detailsModal.details.catalog_product_id}). 
                          Produtos do catálogo podem ter restrições de edição impostas pelo Mercado Livre.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Link para o anúncio */}
                {detailsModal.details.permalink && (
                  <div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(detailsModal.details.permalink, '_blank')}
                    >
                      Ver Anúncio no Mercado Livre
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsModal({ open: false, product: null, details: null })}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Erro */}
      <Dialog open={errorModal.open} onOpenChange={(open) => setErrorModal({ open, title: "", message: "", technicalDetails: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader onClose={() => setErrorModal({ open: false, title: "", message: "", technicalDetails: null })}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle>{errorModal.title}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              {/* Mensagem amigável */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-line">
                  {errorModal.message}
                </p>
              </div>

              {/* Detalhes técnicos (expansível) */}
              {errorModal.technicalDetails && (
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Detalhes Técnicos
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500 group-open:hidden" />
                    <ChevronUp className="h-4 w-4 text-gray-500 hidden group-open:block" />
                  </summary>
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(errorModal.technicalDetails, null, 2)}
                    </pre>
                  </div>
                </details>
              )}

              {/* Sugestões de ação */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 O que fazer?
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Verifique se o anúncio está ativo no Mercado Livre</li>
                  <li>Tente editar o preço diretamente no site do ML</li>
                  <li>Se o problema persistir, entre em contato com o suporte do ML</li>
                </ul>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setErrorModal({ open: false, title: "", message: "", technicalDetails: null })}
            >
              Fechar
            </Button>
            
            {/* Botão para criar sem variações */}
            {errorModal.technicalDetails?.reason === 'HAS_VARIATIONS' && 
             errorModal.technicalDetails?.apiResponse?.canCreateWithoutVariations && (
              <Button
                variant="primary"
                onClick={() => {
                  const itemId = errorModal.technicalDetails.itemId;
                  const qty = errorModal.technicalDetails.quantity || 1;
                  setErrorModal({ open: false, title: "", message: "", technicalDetails: null });
                  // Reabrir modal de duplicação com checkbox marcado
                  const product = products.find(p => p.meliItemId === itemId);
                  if (product) {
                    setDuplicateModal({ open: true, product });
                    setTitleSuffix("");
                    setDuplicateQuantity(qty.toString());
                    setIgnoreVariations(true);
                  }
                }}
              >
                Criar Sem Variações
              </Button>
            )}
            
            {errorModal.technicalDetails?.itemId && errorModal.technicalDetails?.reason !== 'HAS_VARIATIONS' && (
              <Button
                variant="primary"
                onClick={() => {
                  const itemId = errorModal.technicalDetails.itemId;
                  window.open(`https://www.mercadolibre.com.br/vendas/${itemId}/editar`, '_blank');
                }}
              >
                Editar no Mercado Livre
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Sucesso */}
      <Dialog open={successModal.open} onOpenChange={(open) => setSuccessModal({ open, title: "", message: "", details: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader onClose={() => setSuccessModal({ open: false, title: "", message: "", details: null })}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle>{successModal.title}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Mensagem de sucesso */}
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-line">
                  {successModal.message}
                </p>
              </div>

              {/* Detalhes expansíveis */}
              {successModal.details && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      const detailsEl = document.getElementById('success-details');
                      if (detailsEl) {
                        detailsEl.classList.toggle('hidden');
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <span>Ver Detalhes</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div id="success-details" className="hidden p-4 bg-gray-50 dark:bg-gray-900 max-h-60 overflow-y-auto">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                      {JSON.stringify(successModal.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Links para anúncios criados */}
              {successModal.details?.items && successModal.details.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Anúncios Criados ({successModal.details.items.length}):
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {successModal.details.items.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <strong>#{index + 1}:</strong> {item.title}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          ID: {item.itemId}
                        </p>
                        {item.permalink && (
                          <button
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                            onClick={() => window.open(item.permalink, '_blank')}
                          >
                            Ver no Mercado Livre →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="primary"
              onClick={() => setSuccessModal({ open: false, title: "", message: "", details: null })}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
