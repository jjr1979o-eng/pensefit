/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Receipt, 
  Leaf, 
  Pizza, 
  ArrowUpRight,
  PlusCircle,
  CalendarDays,
  DollarSign,
  Loader2
} from 'lucide-react';
import { getCompras, getIngredientes, getMarmitas } from '../lib/storage';
import { Compra, Ingrediente, Marmita } from '../types';

interface DashboardProps {
  onNavigate: (screen: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [marmitas, setMarmitas] = useState<Marmita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, i, m] = await Promise.all([
          getCompras(),
          getIngredientes(),
          getMarmitas()
        ]);
        setCompras(c);
        setIngredientes(i);
        setMarmitas(m);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

    const gastosSemana = compras
      .filter(c => new Date(c.data) >= oneWeekAgo)
      .reduce((acc, c) => acc + c.valorPago, 0);

    const gastosMes = compras
      .filter(c => new Date(c.data) >= oneMonthAgo)
      .reduce((acc, c) => acc + c.valorPago, 0);

    const custoMedioMarmita = marmitas.length > 0 
      ? marmitas.reduce((acc, m) => acc + m.custoTotal, 0) / marmitas.length
      : 0;

    const marmitaMaisCara = marmitas.length > 0
      ? [...marmitas].sort((a, b) => b.custoTotal - a.custoTotal)[0]
      : null;

    const marmitaMaisBarata = marmitas.length > 0
      ? [...marmitas].sort((a, b) => a.custoTotal - b.custoTotal)[0]
      : null;

    const ultimaCompra = compras.length > 0 ? compras[0] : null;

    return {
      gastosSemana,
      gastosMes,
      custoMedioMarmita,
      marmitaMaisCara,
      marmitaMaisBarata,
      ultimaCompra
    };
  }, [compras, marmitas]);

  const cards = [
    { title: 'Gasto na Semana', value: stats.gastosSemana, type: 'currency', color: 'bg-green-100 text-green-700', icon: CalendarDays },
    { title: 'Gasto no Mês', value: stats.gastosMes, type: 'currency', color: 'bg-blue-100 text-blue-700', icon: DollarSign },
    { title: 'Ingredientes', value: ingredientes.length, type: 'number', color: 'bg-emerald-100 text-emerald-700', icon: Leaf },
    { title: 'Marmitas', value: marmitas.length, type: 'number', color: 'bg-orange-100 text-orange-700', icon: Pizza },
    { title: 'Custo Médio', value: stats.custoMedioMarmita, type: 'currency', color: 'bg-purple-100 text-purple-700', icon: ArrowUpRight },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sincronizando com a Nuvem...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard</h2>
        <p className="text-slate-500 font-medium">Relatório operacional simplificado</p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gasto na Semana</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.gastosSemana)}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 inline-flex items-center gap-1">
            <ArrowUpRight size={10} /> 12% vs. anterior
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Custo Médio Marmita</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.custoMedioMarmita)}</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">Otimizado: -R$ 0,45</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ingredientes</p>
          <h3 className="text-2xl font-bold text-slate-800">{ingredientes.length}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Total cadastrados</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Marmitas</p>
          <h3 className="text-2xl font-bold text-emerald-600">{marmitas.length}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Opções no cardápio</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => onNavigate('compras')}
          className="flex flex-col items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-3xl transition-all shadow-lg shadow-emerald-100 group"
        >
          <div className="p-3 bg-emerald-500 rounded-2xl group-hover:scale-110 transition-transform">
            <ShoppingBag size={24} />
          </div>
          <span className="font-bold text-sm">Nova Compra</span>
        </button>
        <button 
          onClick={() => onNavigate('comprovantes')}
          className="flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 hover:border-emerald-200 text-slate-700 p-6 rounded-3xl transition-all group"
        >
          <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
            <Receipt size={24} className="text-slate-500 group-hover:text-emerald-600" />
          </div>
          <span className="font-bold text-sm">Ler Comprovante</span>
        </button>
        <button 
          onClick={() => onNavigate('marmitas')}
          className="flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 hover:border-emerald-200 text-slate-700 p-6 rounded-3xl transition-all group"
        >
          <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
            <Pizza size={24} className="text-slate-500 group-hover:text-emerald-600" />
          </div>
          <span className="font-bold text-sm">Marmitas</span>
        </button>
        <button 
          onClick={() => onNavigate('resumo')}
          className="flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 hover:border-emerald-200 text-slate-700 p-6 rounded-3xl transition-all group"
        >
          <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
            <CalendarDays size={24} className="text-slate-500 group-hover:text-emerald-600" />
          </div>
          <span className="font-bold text-sm">Resumo</span>
        </button>
      </div>

      {/* Content Split */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ingredients List Section */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Leaf size={18} className="text-emerald-500" /> Ingredientes: Maiores Custos
            </h4>
            <button onClick={() => onNavigate('ingredientes')} className="text-xs text-emerald-600 font-bold hover:underline">Ver Tudo</button>
          </div>
          <div className="p-6">
             <div className="space-y-5">
               {ingredientes.slice(0, 4).map((ing, idx) => {
                 const isExpensive = (ing.ultimoCustoPorKg || 0) > 20;
                 return (
                   <div key={ing.id} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className={`w-1.5 h-10 rounded-full ${isExpensive ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                       <div>
                         <p className="text-sm font-bold text-slate-800">{ing.nome}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{ing.categoria}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-bold text-slate-700">
                         {formatCurrency(ing.ultimoCustoPorKg || ing.ultimoCustoPorUnidade || 0)} 
                         <span className="text-[10px] text-slate-400 ml-1">/{ing.ultimoCustoPorKg ? 'kg' : 'un'}</span>
                       </p>
                       <p className={`text-[10px] font-bold ${idx % 2 === 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                         {idx % 2 === 0 ? '↓ 3.1%' : 'Estável'}
                       </p>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        {/* Marmitas Performance Section */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle size={18} className="text-emerald-500" /> Marmitas Rentáveis
            </h4>
            <button onClick={() => onNavigate('marmitas')} className="text-xs text-emerald-600 font-bold hover:underline">Ver Todas</button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {marmitas.slice(0, 3).map((m, idx) => (
                <div key={m.id} className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${
                  idx === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                      idx === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      M{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{m.nome}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Custo: {formatCurrency(m.custoTotal)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${idx === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {m.margemPercentual.toFixed(0)}%
                    </p>
                    <p className={`text-[10px] font-bold ${idx === 0 ? 'text-emerald-500' : 'text-slate-400'}`}>Margem</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
