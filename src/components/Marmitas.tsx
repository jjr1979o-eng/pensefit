/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, FormEvent } from 'react';
import { 
  ArrowLeft, 
  Pizza, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Calculator, 
  Percent, 
  DollarSign, 
  Scale,
  Package,
  TrendingUp,
  AlertCircle,
  Leaf,
  Loader2
} from 'lucide-react';
import { Marmita, IngredienteDaMarmita, Ingrediente } from '../types';
import { getMarmitas, getIngredientes, saveMarmita, deleteMarmita, updateMarmita } from '../lib/storage';

interface MarmitasProps {
  onBack: () => void;
}

export default function Marmitas({ onBack }: MarmitasProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingMarmita, setEditingMarmita] = useState<Marmita | null>(null);
  const [marmitas, setMarmitas] = useState<Marmita[]>([]);
  const [allIngredientes, setAllIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, i] = await Promise.all([
          getMarmitas(),
          getIngredientes()
        ]);
        setMarmitas(m);
        setAllIngredientes(i);
      } catch (error) {
        console.error("Error loading marmitas data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const [formData, setFormData] = useState<Partial<Marmita>>({
    nome: '',
    codigo: '',
    pesoTotalGramas: 300,
    precoVenda: 0,
    custoEmbalagem: 0,
    taxaIfood: 0,
    taxaMaquininha: 0,
    outrosCustos: 0,
    ingredientes: [],
    observacoes: ''
  });

  const handleCreateNew = () => {
    setFormData({
      nome: '',
      codigo: '',
      pesoTotalGramas: 300,
      precoVenda: 0,
      custoEmbalagem: 0,
      taxaIfood: 0,
      taxaMaquininha: 0,
      outrosCustos: 0,
      ingredientes: [],
      observacoes: ''
    });
    setIsCreating(true);
  };

  const handleEdit = (m: Marmita) => {
    setFormData(m);
    setEditingMarmita(m);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta marmita?')) {
      try {
        await deleteMarmita(id);
        const updated = await getMarmitas();
        setMarmitas(updated);
      } catch (error) {
        console.error("Error deleting marmita:", error);
        alert('Erro ao excluir prato.');
      }
    }
  };

  const addIngredienteToMarmita = () => {
    const defaultIng = allIngredientes[0];
    if (!defaultIng) return;

    const novoItem: IngredienteDaMarmita = {
      ingredienteId: defaultIng.id,
      nomeIngrediente: defaultIng.nome,
      quantidadeGramas: 100,
      custoPorGrama: defaultIng.ultimoCustoPorGrama || 0,
      custoTotal: (defaultIng.ultimoCustoPorGrama || 0) * 100
    };

    setFormData({
      ...formData,
      ingredientes: [...(formData.ingredientes || []), novoItem]
    });
  };

  const removeIngredienteFromMarmita = (index: number) => {
    const updated = [...(formData.ingredientes || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, ingredientes: updated });
  };

  const updateIngredienteItem = (index: number, field: keyof IngredienteDaMarmita, value: any) => {
    const updated = [...(formData.ingredientes || [])];
    const item = { ...updated[index] };

    if (field === 'ingredienteId') {
      const ing = allIngredientes.find(i => i.id === value);
      if (ing) {
        item.ingredienteId = ing.id;
        item.nomeIngrediente = ing.nome;
        item.custoPorGrama = ing.ultimoCustoPorGrama || 0;
      }
    } else if (field === 'quantidadeGramas') {
      item.quantidadeGramas = parseFloat(value) || 0;
    }

    item.custoTotal = item.quantidadeGramas * item.custoPorGrama;
    updated[index] = item;
    setFormData({ ...formData, ingredientes: updated });
  };

  // Automated Real-time Calculation
  const computedData = useMemo(() => {
    const costIng = (formData.ingredientes || []).reduce((acc, i) => acc + i.custoTotal, 0);
    const costTotal = costIng + (formData.custoEmbalagem || 0) + (formData.taxaIfood || 0) + (formData.taxaMaquininha || 0) + (formData.outrosCustos || 0);
    const profit = (formData.precoVenda || 0) - costTotal;
    const margin = (formData.precoVenda || 0) > 0 ? (profit / formData.precoVenda!) * 100 : 0;
    const costPer100g = (formData.pesoTotalGramas || 0) > 0 ? (costTotal / formData.pesoTotalGramas!) * 100 : 0;

    return {
      custoIngredientes: costIng,
      custoTotal: costTotal,
      lucroBruto: profit,
      margemPercentual: margin,
      custoPor100g: costPer100g
    };
  }, [formData]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.pesoTotalGramas) {
      alert('Nome e Peso Total são obrigatórios.');
      return;
    }

    const finalMarmita: Omit<Marmita, 'id' | 'criadoEm' | 'atualizadoEm'> = {
      ...(formData as Marmita),
      ...computedData
    };

    try {
      setIsSaving(true);
      if (editingMarmita) {
        await updateMarmita({ ...finalMarmita, id: editingMarmita.id, criadoEm: editingMarmita.criadoEm, atualizadoEm: '' } as Marmita);
      } else {
        await saveMarmita(finalMarmita);
      }

      alert('Marmita salva com sucesso na nuvem!');
      setIsCreating(false);
      setEditingMarmita(null);
      const updated = await getMarmitas();
      setMarmitas(updated);
    } catch (error) {
      console.error("Error saving marmita:", error);
      alert('Erro ao salvar prato.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Acessando Banco de Dados Cloud...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={isCreating ? () => setIsCreating(false) : onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">{isCreating ? (editingMarmita ? 'Editar Receita' : 'Nova Receita') : 'Catálogo de Marmitas'}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Gestão de pratos e engenharia de custos</p>
          </div>
        </div>
        {!isCreating && (
          <button 
            onClick={handleCreateNew}
            className="p-4 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <Plus size={20} strokeWidth={3} /> Criar Prato
          </button>
        )}
      </div>

      {!isCreating ? (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {marmitas.map((m) => (
            <div key={m.id} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm space-y-6 group relative overflow-hidden transition-all hover:shadow-xl hover:border-emerald-100">
               <div className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onClick={() => handleEdit(m)} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-emerald-600 transition-colors">
                  <Edit3 size={18} />
                </button>
                <button onClick={() => handleDelete(m.id)} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shrink-0 border border-emerald-100 shadow-inner">
                  <Pizza size={32} />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-slate-800 leading-tight">{m.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg uppercase">{m.codigo}</span>
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg uppercase">{m.pesoTotalGramas}g</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-50">
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Custo</p>
                  <p className="font-black text-slate-800">{formatCurrency(m.custoTotal)}</p>
                </div>
                <div className="p-4 bg-emerald-500 rounded-2xl border border-emerald-400">
                  <p className="text-[9px] text-emerald-100 uppercase font-black tracking-widest mb-1">Venda</p>
                  <p className="font-black text-white">{formatCurrency(m.precoVenda)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] text-emerald-600 uppercase font-black tracking-widest mb-1">Margem</p>
                  <p className="font-black text-emerald-700">{m.margemPercentual.toFixed(0)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lucro Bruto: <span className="text-slate-800 ml-1">{formatCurrency(m.lucroBruto)}</span></p>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  <TrendingUp size={12} /> Alta Performance
                </div>
              </div>
            </div>
          ))}
          {marmitas.length === 0 && (
            <div className="col-span-full p-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                <Pizza size={48} strokeWidth={1} />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Prateleira Vazia</p>
            </div>
          )}
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSave} className="grid lg:grid-cols-3 gap-8 pb-12">
          {/* Left: Basics & Ingredients */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-10">
              <section className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tighter">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><AlertCircle size={18} /></div> Especificações
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Identificador do Prato</label>
                    <input 
                      type="text" 
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-black text-slate-800 transition-all"
                      placeholder="Ex: Frango Fit"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Cód / Op</label>
                      <input 
                        type="text" 
                        value={formData.codigo}
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                        className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold text-center"
                        placeholder="Ex: 01"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Peso Liq. (g)</label>
                      <input 
                        type="number" 
                        value={formData.pesoTotalGramas}
                        onChange={(e) => setFormData({ ...formData, pesoTotalGramas: parseFloat(e.target.value) || 0 })}
                        className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-black text-center"
                        required
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tighter">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><Leaf size={18} /></div> Composição
                  </h3>
                  <button 
                    type="button"
                    onClick={addIngredienteToMarmita}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} /> Adicionar Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.ingredientes?.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row items-center gap-4 p-5 bg-slate-50 rounded-[24px] border border-slate-50 group hover:bg-white hover:border-emerald-100 hover:shadow-lg transition-all">
                      <select 
                        value={item.ingredienteId}
                        onChange={(e) => updateIngredienteItem(idx, 'ingredienteId', e.target.value)}
                        className="flex-1 min-w-0 p-2 bg-transparent outline-none font-black text-slate-700 cursor-pointer"
                      >
                        <option value="" disabled>Selecione um ingrediente...</option>
                        {allIngredientes
                          .sort((a, b) => a.nome.localeCompare(b.nome))
                          .map(i => (
                            <option key={i.id} value={i.id}>
                              {i.nome} ({formatCurrency(i.ultimoCustoPorKg || i.ultimoCustoPorUnidade || 0)}/{i.unidadeOriginal || (i.ultimoCustoPorKg ? 'kg' : 'un')})
                            </option>
                          ))}
                      </select>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm">
                          <input 
                            type="number" 
                            value={item.quantidadeGramas}
                            onChange={(e) => updateIngredienteItem(idx, 'quantidadeGramas', e.target.value)}
                            className="w-14 bg-transparent outline-none text-center font-black text-slate-800"
                          />
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">g</span>
                        </div>
                        <div className="w-24 text-right">
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Subtotal</p>
                          <p className="font-black text-slate-800">{formatCurrency(item.custoTotal)}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeIngredienteFromMarmita(idx)}
                          className="p-3 text-slate-300 hover:text-red-500 bg-white rounded-xl border border-slate-50 hover:bg-red-50 transition-all shadow-sm"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!formData.ingredientes || formData.ingredientes.length === 0) && (
                    <div className="p-10 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[32px] font-bold uppercase text-[10px] tracking-widest">
                      Selecione itens da sua jornada para compor este prato
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tighter">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600"><Package size={18} /></div> Dinâmica Financeira
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pack</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.custoEmbalagem}
                      onChange={(e) => setFormData({ ...formData, custoEmbalagem: parseFloat(e.target.value) || 0 })}
                      className="w-full p-4 rounded-xl bg-slate-50 border border-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fee iFood</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.taxaIfood}
                      onChange={(e) => setFormData({ ...formData, taxaIfood: parseFloat(e.target.value) || 0 })}
                      className="w-full p-4 rounded-xl bg-slate-50 border border-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fee POS</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.taxaMaquininha}
                      onChange={(e) => setFormData({ ...formData, taxaMaquininha: parseFloat(e.target.value) || 0 })}
                      className="w-full p-4 rounded-xl bg-slate-50 border border-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-1">Target Price</label>
                     <input 
                       type="number" 
                       step="0.01"
                       value={formData.precoVenda}
                       onChange={(e) => setFormData({ ...formData, precoVenda: parseFloat(e.target.value) || 0 })}
                       className="w-full p-4 rounded-xl bg-emerald-50 border border-emerald-100 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-black text-emerald-700"
                     />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right: Real-time Calculation Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-100 sticky top-24 space-y-10">
               <h3 className="text-2xl font-black flex items-center gap-3 text-slate-800 tracking-tighter border-b border-slate-50 pb-6 uppercase">
                <Calculator className="text-emerald-500" strokeWidth={3} /> Balanço
              </h3>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Leaf size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Matéria Prima</span>
                    </div>
                    <p className="font-black text-slate-700 text-lg">{formatCurrency(computedData.custoIngredientes)}</p>
                  </div>
                  <div className="flex justify-between items-end px-2">
                     <div className="flex items-center gap-2 text-slate-400">
                      <Package size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sobrecargas</span>
                    </div>
                    <p className="font-black text-slate-700 text-lg">{formatCurrency(formData.custoEmbalagem! + formData.taxaIfood! + formData.taxaMaquininha! + formData.outrosCustos!)}</p>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 text-white rounded-[32px] space-y-2 shadow-2xl shadow-slate-200 group transition-all hover:scale-[1.02]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">CUSTO FINAL UNITÁRIO</p>
                  <p className="text-5xl font-black text-emerald-400 tracking-tighter">{formatCurrency(computedData.custoTotal)}</p>
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Eficiência Operacional</span>
                    <span className="text-[10px] font-black text-emerald-500">OPTIMIZED</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-emerald-50 rounded-[24px] border border-emerald-100 space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Net Profit</p>
                     <p className="text-2xl font-black text-emerald-700 leading-none">{formatCurrency(computedData.lucroBruto)}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-1">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">EBITDA %</p>
                     <p className="text-2xl font-black text-slate-800 leading-none">{computedData.margemPercentual.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center text-slate-400 border border-slate-50">
                    <Scale size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Preço por 100g</p>
                    <p className="font-black text-slate-700 text-lg tracking-tight">{formatCurrency(computedData.custoPor100g)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className={`w-full p-6 text-white rounded-[24px] font-black text-xl flex items-center justify-center gap-3 shadow-2xl transition-all ${
                    isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-emerald-200'
                  }`}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={28} /> : <Save size={28} />}
                  {isSaving ? 'Sincronizando...' : 'Salvar Receita'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
