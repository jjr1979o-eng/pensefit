/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent, FormEvent } from 'react';
import { ArrowLeft, Save, ShoppingCart, Calculator, Loader2 } from 'lucide-react';
import { Categoria, Unidade } from '../types';
import { saveCompra, calcularCustosPorUnidade } from '../lib/storage';

interface NovaCompraProps {
  onBack: () => void;
}

const CATEGORIES: Categoria[] = [
  'Proteínas', 'Carboidratos', 'Legumes', 'Verduras', 'Temperos', 
  'Embalagens', 'Molhos', 'Laticínios', 'Outros'
];

const UNIDADES: Unidade[] = [
  'kg', 'g', 'unidade', 'pacote', 'litro', 'ml', 'maço', 'caixa'
];

export default function NovaCompra({ onBack }: NovaCompraProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    nomeProduto: '',
    categoria: 'Proteínas' as Categoria,
    quantidade: 0,
    unidade: 'kg' as Unidade,
    valorPago: 0,
    localCompra: '',
    observacoes: ''
  });

  const [previa, setPrevia] = useState<{ custoPorKg?: number, custoPorGrama?: number, custoPorUnidade?: number } | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name === 'quantidade' || name === 'valorPago' ? parseFloat(value) || 0 : value
    };
    setFormData(newFormData);

    if (newFormData.quantidade > 0 && newFormData.valorPago > 0) {
      setPrevia(calcularCustosPorUnidade(newFormData.quantidade, newFormData.unidade, newFormData.valorPago));
    } else {
      setPrevia(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nomeProduto || formData.quantidade <= 0 || formData.valorPago <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsSaving(true);
      await saveCompra(formData);
      alert('Compra salva com sucesso! O ingrediente foi atualizado na nuvem.');
      onBack();
    } catch (error) {
      console.error("Error saving purchase:", error);
      alert('Erro ao salvar compra.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Registrar Compra</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Entrada manual de insumos</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
          <ShoppingCart size={24} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data da Compra</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 appearance-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome do Produto</label>
            <input
              type="text"
              name="nomeProduto"
              placeholder="Ex: Peito de Frango"
              value={formData.nomeProduto}
              onChange={handleChange}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Quantidade</label>
              <input
                type="number"
                step="0.001"
                min="0"
                name="quantidade"
                placeholder="0.000"
                value={formData.quantidade || ''}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Unidade</label>
              <select
                name="unidade"
                value={formData.unidade}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 appearance-none"
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Valor Total Pago</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                name="valorPago"
                placeholder="0,00"
                value={formData.valorPago || ''}
                onChange={handleChange}
                className="w-full pl-12 p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Local / Mercado (Opcional)</label>
            <input
              type="text"
              name="localCompra"
              placeholder="Ex: Assaí, Atacadão"
              value={formData.localCompra}
              onChange={handleChange}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-700"
            />
          </div>
        </div>

        {/* Dynamic Calculation Preview */}
        {previa && (
          <div className="bg-emerald-500 p-6 rounded-[32px] shadow-lg shadow-emerald-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 mb-4 text-emerald-50 font-bold">
              <Calculator size={18} />
              <h4 className="text-sm uppercase tracking-widest">Custo Projetado</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {previa.custoPorKg !== undefined && (
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-tighter">Custo por KG</p>
                  <p className="text-xl font-black text-white">{formatCurrency(previa.custoPorKg)}</p>
                </div>
              )}
              {previa.custoPorGrama !== undefined && (
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-tighter">Custo por Grama</p>
                  <p className="text-xl font-black text-white">R$ {previa.custoPorGrama.toFixed(3)}</p>
                </div>
              )}
              {previa.custoPorUnidade !== undefined && (
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-tighter">Custo por {formData.unidade}</p>
                  <p className="text-xl font-black text-white">{formatCurrency(previa.custoPorUnidade)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit"
            disabled={isSaving}
            className={`w-full p-5 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all ${
              isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
            }`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            {isSaving ? 'Sincronizando...' : 'Finalizar Registro'}
          </button>
        </div>
      </form>
    </div>
  );
}
