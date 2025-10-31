'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ExtraRevenue {
  id: string;
  name: string;
  category: string;
  amount: number;
  description?: string;
}

interface ExtraRevenuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  revenues: ExtraRevenue[];
  revenuesSummary: any;
  onCreateRevenue: (data: any) => Promise<void>;
  onUpdateRevenue: (id: string, data: any) => Promise<void>;
  onDeleteRevenue: (id: string) => Promise<void>;
  isCreating: boolean;
}

export function ExtraRevenuesModal({
  isOpen,
  onClose,
  revenues,
  revenuesSummary,
  onCreateRevenue,
  onUpdateRevenue,
  onDeleteRevenue,
  isCreating,
}: ExtraRevenuesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'OUTROS',
    amount: 0,
    description: '',
  });

  const handleSubmit = async () => {
    if (!formData.name || formData.amount <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingId) {
        await onUpdateRevenue(editingId, formData);
        toast.success('Receita atualizada!');
        setEditingId(null);
      } else {
        await onCreateRevenue(formData);
        toast.success('Receita criada!');
      }
      setFormData({ name: '', category: 'OUTROS', amount: 0, description: '' });
    } catch (error) {
      toast.error('Erro ao salvar receita');
    }
  };

  const handleEdit = (revenue: ExtraRevenue) => {
    setEditingId(revenue.id);
    setFormData({
      name: revenue.name,
      category: revenue.category,
      amount: revenue.amount,
      description: revenue.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', category: 'OUTROS', amount: 0, description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Receitas Extras</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Editar Receita' : 'Nova Receita'}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Consultoria"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Categoria *</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="VENDA">Venda Produto</option>
                  <option value="CONSULTORIA">Consultoria</option>
                  <option value="SERVICOS">Serviços</option>
                  <option value="COMISSAO">Comissão</option>
                  <option value="BONUS">Bônus</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Valor Mensal (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Descrição (opcional)</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalhes adicionais"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSubmit} disabled={isCreating} className="flex-1">
                {isCreating ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                  Cancelar Edição
                </Button>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div>
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Receitas Cadastradas</h3>
            {revenues && revenues.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Nome</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Categoria</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Valor</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {revenues.map((revenue) => (
                      <tr key={revenue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{revenue.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{revenue.category}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                          +{formatCurrency(revenue.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(revenue)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDeleteRevenue(revenue.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">Total Mensal:</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-green-600 dark:text-green-400">
                        +{formatCurrency(revenuesSummary?.total || 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                Nenhuma receita cadastrada. Preencha o formulário acima para adicionar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
