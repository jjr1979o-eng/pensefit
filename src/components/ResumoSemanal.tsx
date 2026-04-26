/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Calendar, ShoppingBag, Pizza, DollarSign, TrendingUp, ChevronLeft, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { getCompras, getMarmitas, deleteCompra as deleteCompraStorage } from '../lib/storage';
import { Compra, Marmita } from '../types';

interface ResumoSemanalProps {
  onBack: () => void;
}

export default function ResumoSemanal({ onBack }: ResumoSemanalProps) {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [compras, setCompras] = useState<Compra[]>([]);
  const [marmitas, setMarmitas] = useState<Marmita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, m] = await Promise.all([
          getCompras(),
          getMarmitas()
        ]);
        setCompras(c);
        setMarmitas(m);
      } catch (error) {
        console.error("Error loading resumo data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const weekRange = useMemo(() => {
    const start = new Date(selectedWeek);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    start.setHours(0,0,0,0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // Saturday
    end.setHours(23,59,59,999);
    
    return { start, end };
  }, [selectedWeek]);

  const stats = useMemo(() => {
    const weekCompras = compras.filter(c => {
      const d = new Date(c.data);
      return d >= weekRange.start && d <= weekRange.end;
    });

    const totalGasto = weekCompras.reduce((acc, c) => acc + c.valorPago, 0);
    
    const custoMedioMarmita = marmitas.length > 0 
      ? marmitas.reduce((acc, m) => acc + m.custoTotal, 0) / marmitas.length
      : 0;

    const marmitaMaisCara = marmitas.length > 0
      ? [...marmitas].sort((a, b) => b.custoTotal - a.custoTotal)[0]
      : null;

    const marmitaMaisBarata = marmitas.length > 0
      ? [...marmitas].sort((a, b) => a.custoTotal - b.custoTotal)[0]
      : null;

    return {
      weekCompras,
      totalGasto,
      custoMedioMarmita,
      marmitaMaisCara,
      marmitaMaisBarata,
      receitaPrevista: marmitas.reduce((acc, m) => acc + m.precoVenda, 0),
      lucroPrevisto: marmitas.reduce((acc, m) => acc + m.lucroBruto, 0)
    };
  }, [compras, marmitas, weekRange]);

  const changeWeek = (offset: number) => {
    const next = new Date(selectedWeek);
    next.setDate(next.getDate() + (offset * 7));
    setSelectedWeek(next);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir este registro de compra?')) {
      try {
        await deleteCompraStorage(id);
        const data = await getCompras();
        setCompras(data);
      } catch (error) {
        console.error("Error deleting purchase:", error);
        alert('Erro ao excluir registro.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Calculando Balanço na Nuvem...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Balanço Periódico</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Performance financeira e fluxo de caixa</p>
          </div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="flex items-center justify-between bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <button 
          onClick={() => changeWeek(-1)} 
          className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-emerald-500 transition-all border border-transparent hover:border-slate-100"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center group">
           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1 group-hover:scale-110 transition-transform">Janela de Observação</p>
           <p className="font-black text-slate-800 text-lg tracking-tight">
             {weekRange.start.toLocaleDateString('pt-BR')} <span className="text-slate-300 font-medium mx-2">—</span> {weekRange.end.toLocaleDateString('pt-BR')}
           </p>
        </div>
        <button 
          onClick={() => changeWeek(1)} 
          className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-emerald-500 transition-all border border-transparent hover:border-slate-100"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Stats Card */}
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900"><TrendingUp size={120} /></div>
          
          <div className="space-y-8 relative z-10">
             <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shrink-0 border border-emerald-100 shadow-inner">
                  <ShoppingBag size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Drenagem de Capital</p>
                  <p className="text-4xl font-black text-slate-800 tracking-tighter">{formatCurrency(stats.totalGasto)}</p>
                </div>
             </div>
             <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-3xl flex items-center justify-center shrink-0 shadow-xl">
                  <DollarSign size={32} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margem de Contribuição</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{formatCurrency(stats.lucroPrevisto)}</p>
                </div>
             </div>
          </div>

          <div className="pt-8 border-t border-slate-50 space-y-6 relative z-10">
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 border-l-4 border-emerald-500 pl-3">Pontos Críticos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-50 group-hover:border-slate-100 transition-all">
                <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Ticket Médio/Custo</p>
                <p className="font-black text-slate-800 text-lg">{formatCurrency(stats.custoMedioMarmita)}</p>
              </div>
              <div className="p-5 bg-red-50 rounded-[24px] border border-red-50 group-hover:border-red-100 transition-all">
                <p className="text-[9px] text-red-400 uppercase font-black mb-1">Teto de Produção</p>
                <p className="font-black text-red-700 text-lg">{stats.marmitaMaisCara ? formatCurrency(stats.marmitaMaisCara.custoTotal) : '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase List this week */}
        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xl flex items-center gap-3 text-slate-800 uppercase tracking-tighter">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} strokeWidth={3} /></div> Fluxo de Compras
            </h3>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">{stats.weekCompras.length} Tickets</span>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {stats.weekCompras.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[24px] border border-slate-50 hover:bg-white hover:border-emerald-100 hover:shadow-lg transition-all group">
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex w-10 h-10 bg-white rounded-xl items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">{c.nomeProduto}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{c.categoria} <span className="mx-1">•</span> {c.localCompra}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black text-slate-900 border-l border-slate-200 pl-4">{formatCurrency(c.valorPago)}</p>
                  <button 
                    onClick={(e) => handleDelete(c.id, e)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {stats.weekCompras.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300 italic space-y-4 border-2 border-dashed border-slate-50 rounded-[32px]">
                <Calendar size={48} strokeWidth={1} />
                <p className="font-bold uppercase text-[10px] tracking-widest">Nenhuma atividade registrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
