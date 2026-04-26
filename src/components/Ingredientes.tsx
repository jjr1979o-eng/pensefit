/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, Filter, TrendingUp, TrendingDown, Minus, History, ChevronRight, Leaf, Trash2, Plus, Save, Loader2 } from 'lucide-react';
import { Ingrediente, Categoria } from '../types';
import { getIngredientes, deleteIngrediente as deleteIngredienteStorage, saveIngredienteManual } from '../lib/storage';

interface IngredientesProps {
  onBack: () => void;
}

export default function Ingredientes({ onBack }: IngredientesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [selectedIngrediente, setSelectedIngrediente] = useState<Ingrediente | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getIngredientes();
        setIngredientes(data);
      } catch (error) {
        console.error("Error loading ingredientes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const [newIngredient, setNewIngredient] = useState({
    nome: '',
    categoria: 'Proteínas' as Categoria
  });

  const categories = useMemo(() => {
    const cats = new Set(ingredientes.map(i => i.categoria));
    return ['Todas', ...Array.from(cats)];
  }, [ingredientes]);

  const filteredIngredientes = useMemo(() => {
    return ingredientes.filter(i => {
      const matchesSearch = i.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas' || i.categoria === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [ingredientes, searchTerm, categoryFilter]);

  const formatCurrency = (val?: number) => {
    if (val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);
  };

  const getPriceVariation = (ing: Ingrediente) => {
    if (ing.historicoPrecos.length < 2) return null;
    
    // Sort history by date descending
    const sorted = [...ing.historicoPrecos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const latest = sorted[0];
    const previous = sorted[1];
    
    const latestVal = latest.custoPorKg || latest.custoPorUnidade || 0;
    const previousVal = previous.custoPorKg || previous.custoPorUnidade || 0;
    
    if (previousVal === 0) return null;
    
    const diff = latestVal - previousVal;
    const percent = (diff / previousVal) * 100;

    return { diff, percent };
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir este ingrediente? Isso pode afetar marmitas cadastradas.')) {
      try {
        await deleteIngredienteStorage(id);
        const data = await getIngredientes();
        setIngredientes(data);
      } catch (error) {
        console.error("Error deleting ingrediente:", error);
        alert('Erro ao excluir ingrediente.');
      }
    }
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.nome) return;
    try {
      setIsSaving(true);
      await saveIngredienteManual(newIngredient.nome, newIngredient.categoria);
      const data = await getIngredientes();
      setIngredientes(data);
      setIsAdding(false);
      setNewIngredient({ nome: '', categoria: 'Proteínas' });
    } catch (error) {
      console.error("Error saving manual ingrediente:", error);
      alert('Erro ao salvar ingrediente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={selectedIngrediente ? () => setSelectedIngrediente(null) : onBack} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              {selectedIngrediente ? selectedIngrediente.nome : (isAdding ? 'Novo Insumo' : 'Gestão de Insumos')}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
              {selectedIngrediente ? 'Histórico de flutuação de preço' : (isAdding ? 'Cadastro manual de material' : 'Catálogo de materiais e custos')}
            </p>
          </div>
        </div>
        {!selectedIngrediente && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="p-3 bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <Plus size={18} /> Adicionar
          </button>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleSaveNew} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Insumo</label>
              <input 
                type="text" 
                value={newIngredient.nome}
                onChange={(e) => setNewIngredient({...newIngredient, nome: e.target.value})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
                placeholder="Ex: Cebola Roxa"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria Principal</label>
              <select 
                value={newIngredient.categoria}
                onChange={(e) => setNewIngredient({...newIngredient, categoria: e.target.value as Categoria})}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
              >
                {['Proteínas', 'Carboidratos', 'Legumes', 'Verduras', 'Temperos', 'Embalagens', 'Molhos', 'Laticínios', 'Outros'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-400 font-medium bg-slate-50 p-3 rounded-xl italic">
              Dica: O custo deste item será atualizado automaticamente ao registrar sua primeira compra.
            </p>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="flex-1 p-4 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className={`flex-1 p-4 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 transition-all ${
                isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? 'Salvando...' : 'Salvar Insumo'}
            </button>
          </div>
        </form>
      ) : !selectedIngrediente ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Filtrar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 p-4 rounded-2xl bg-slate-50 border border-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700"
              />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-4 rounded-2xl border border-slate-50">
              <Filter size={16} className="text-slate-400" />
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-4 bg-transparent outline-none font-bold text-slate-600 text-xs uppercase tracking-widest cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredIngredientes.map((ing) => {
              const variation = getPriceVariation(ing);
              const isExpensive = (ing.ultimoCustoPorKg || 0) > 25;
              
              return (
                <div 
                  key={ing.id} 
                  onClick={() => setSelectedIngrediente(ing)}
                  className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 cursor-pointer transition-all space-y-5 group relative overflow-hidden"
                >
                  {isExpensive && <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>}
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mb-1">{ing.categoria}</p>
                      <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">{ing.nome}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       {variation && (
                        <div className={`flex items-center gap-1 text-[9px] font-black px-2.5 py-1.5 rounded-xl border ${
                          variation.percent > 0 ? 'bg-red-50 border-red-100 text-red-600' : 
                          variation.percent < 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          {variation.percent > 0 ? <TrendingUp size={12} /> : 
                           variation.percent < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                          {variation.percent === 0 ? 'ESTÁVEL' : `${Math.abs(variation.percent).toFixed(1)}%`}
                        </div>
                      )}
                      <button 
                        onClick={(e) => handleDelete(ing.id, e)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end bg-slate-50 p-4 rounded-2xl border border-slate-50 group-hover:bg-emerald-50 transition-colors">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Preço Atual</p>
                      <p className="text-2xl font-black text-slate-800">
                        {formatCurrency(ing.ultimoCustoPorKg || ing.ultimoCustoPorUnidade || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Unidade</p>
                       <p className="font-black text-slate-600 text-sm">{ing.ultimoCustoPorKg ? 'kg' : 'un'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    <p>Última: {new Date(ing.dataUltimaCompra).toLocaleDateString('pt-BR')}</p>
                    <div className="flex items-center gap-1 text-emerald-600 font-black decoration-2 underline-offset-4 group-hover:underline">
                      Histórico <ChevronRight size={14} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredIngredientes.length === 0 && (
              <div className="col-span-full py-12 text-center space-y-4">
                 <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Search size={32} />
                 </div>
                 <p className="text-slate-400 font-bold">Nenhum ingrediente encontrado com esses filtros.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Detail View / History */
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Sidebar Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{selectedIngrediente.categoria}</p>
                  <h3 className="text-3xl font-black text-slate-800 leading-tight">{selectedIngrediente.nome}</h3>
                </div>
                
                <div className="space-y-4 pt-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-50 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 text-slate-200"><History size={40} /></div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 relative z-10">Local de Origem</p>
                    <p className="font-bold text-slate-700 relative z-10">{selectedIngrediente.localUltimaCompra}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-50">
                      <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Custo/g</p>
                      <p className="font-black text-emerald-600 text-lg">R$ {selectedIngrediente.ultimoCustoPorGrama?.toFixed(3) || '-'}</p>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-50">
                      <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Custo/kg</p>
                      <p className="font-black text-slate-800 text-lg">R$ {selectedIngrediente.ultimoCustoPorKg?.toFixed(2) || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main History Table */}
            <div className="md:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <History size={20} />
                  </div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tight">Timeline de Preços</h3>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedIngrediente.historicoPrecos.length} Registros</div>
              </div>
              
              <div className="divide-y divide-slate-50">
                {selectedIngrediente.historicoPrecos.map((log, i) => (
                  <div key={log.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex flex-col items-center justify-center font-black group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all border border-slate-50 group-hover:border-emerald-100">
                        <span className="text-lg leading-none">{log.data.split('-')[2]}</span>
                        <span className="text-[9px] uppercase">{new Date(log.data).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-800">
                          {formatCurrency(log.custoPorKg || log.custoPorUnidade || 0)}
                          <span className="text-xs text-slate-400 font-bold ml-2">/ {log.unidade === 'unidade' ? 'un' : 'kg'}</span>
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                          {log.localCompra} <span className="mx-2">•</span> Vol: {log.quantidade}{log.unidade}
                        </p>
                      </div>
                    </div>
                    {i < selectedIngrediente.historicoPrecos.length - 1 && (
                      <div className="text-right">
                         {(() => {
                           const prev = selectedIngrediente.historicoPrecos[i+1];
                           const currVal = log.custoPorKg || log.custoPorUnidade || 0;
                           const prevVal = prev.custoPorKg || prev.custoPorUnidade || 0;
                           const diff = currVal - prevVal;
                           if (diff === 0) return <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Estável</span>;
                           return (
                             <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${diff > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                               {diff > 0 ? '↑' : '↓'} {Math.abs((diff / prevVal) * 100).toFixed(1)}%
                             </span>
                           );
                         })()}
                      </div>
                    )}
                  </div>
                ))}
                {selectedIngrediente.historicoPrecos.length === 0 && (
                  <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">
                    Sem dados históricos registrados.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
