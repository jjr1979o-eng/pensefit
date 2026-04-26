/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Download, BarChart3, TrendingUp, DollarSign, PieChart, Info, Loader2, Trash2 } from 'lucide-react';
import { getCompras, getIngredientes, getMarmitas, deleteCompra } from '../lib/storage';
import { Compra, Ingrediente, Marmita } from '../types';

interface RelatoriosProps {
  onBack: () => void;
}

export default function Relatorios({ onBack }: RelatoriosProps) {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [marmitas, setMarmitas] = useState<Marmita[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [c, i, m] = await Promise.all([
        getCompras(),
        getIngredientes(),
        getMarmitas()
      ]);
      setCompras(c);
      setIngredientes(i);
      setMarmitas(m);
    } catch (error) {
      console.error("Error loading relatorios data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteCompra = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de compra?')) {
      try {
        await deleteCompra(id);
        await loadData();
      } catch (error) {
        alert('Erro ao excluir compra');
      }
    }
  };

  const reports = useMemo(() => {
    const ingMaisCaros = [...ingredientes]
      .sort((a, b) => (b.ultimoCustoPorKg || b.ultimoCustoPorUnidade || 0) - (a.ultimoCustoPorKg || a.ultimoCustoPorUnidade || 0))
      .slice(0, 5);

    const marmitasMaiorCusto = [...marmitas]
      .sort((a, b) => b.custoTotal - a.custoTotal)
      .slice(0, 5);

    const marmitasMelhorMargem = [...marmitas]
      .sort((a, b) => b.margemPercentual - a.margemPercentual)
      .slice(0, 5);

    const custoMedioMarmita = marmitas.length > 0 
      ? marmitas.reduce((acc, m) => acc + m.custoTotal, 0) / marmitas.length
      : 0;

    return {
      ingMaisCaros,
      marmitasMaiorCusto,
      marmitasMelhorMargem,
      custoMedioMarmita
    };
  }, [ingredientes, marmitas]);

  const exportCSV = () => {
    let csv = 'Tipo;Nome;Valor;Categoria;Data\n';
    
    compras.forEach(c => {
      csv += `Compra;${c.nomeProduto};${c.valorPago.toFixed(2)};${c.categoria};${c.data}\n`;
    });
    
    marmitas.forEach(m => {
      csv += `Marmita;${m.nome};${m.custoTotal.toFixed(2)};Marmita;${m.criadoEm.split('T')[0]}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pensefit_relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Compilando Inteligência de Negócio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Intelligence Report</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Insights de rentabilidade e custos</p>
          </div>
        </div>
        <button 
          onClick={exportCSV}
          className="p-4 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest active:scale-[0.98]"
        >
          <Download size={18} /> Exportar Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card: Ingredientes mais caros */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 group hover:shadow-lg transition-all">
           <h3 className="font-black text-sm flex items-center gap-3 text-slate-800 uppercase tracking-widest">
            <div className="w-8 h-8 bg-slate-50 text-red-500 rounded-lg flex items-center justify-center"><TrendingUp size={18} strokeWidth={3} /></div> Top Insumos / Custo
          </h3>
          <div className="space-y-4">
            {reports.ingMaisCaros.map((ing, i) => (
              <div key={ing.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center text-[9px] font-black">{i+1}</span>
                  <span className="font-black text-slate-600 truncate max-w-[120px]">{ing.nome}</span>
                </div>
                <span className="font-black text-slate-800">{formatCurrency(ing.ultimoCustoPorKg || ing.ultimoCustoPorUnidade || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card: Marmitas com maior custo */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 group hover:shadow-lg transition-all">
           <h3 className="font-black text-sm flex items-center gap-3 text-slate-800 uppercase tracking-widest">
            <div className="w-8 h-8 bg-slate-50 text-orange-500 rounded-lg flex items-center justify-center"><BarChart3 size={18} strokeWidth={3} /></div> Critical Cost / Recipes
          </h3>
          <div className="space-y-4">
            {reports.marmitasMaiorCusto.map((m, i) => (
              <div key={m.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center text-[9px] font-black">{i+1}</span>
                  <span className="font-black text-slate-600 truncate max-w-[120px]">{m.nome}</span>
                </div>
                <span className="font-black text-red-600">{formatCurrency(m.custoTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card: Marmitas com melhor margem */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 group hover:shadow-lg transition-all">
           <h3 className="font-black text-sm flex items-center gap-3 text-slate-800 uppercase tracking-widest">
            <div className="w-8 h-8 bg-slate-50 text-emerald-500 rounded-lg flex items-center justify-center"><PieChart size={18} strokeWidth={3} /></div> Profit Efficiency
          </h3>
          <div className="space-y-4">
            {reports.marmitasMelhorMargem.map((m, i) => (
              <div key={m.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center text-[9px] font-black">{i+1}</span>
                  <span className="font-black text-slate-600 truncate max-w-[120px]">{m.nome}</span>
                </div>
                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{m.margemPercentual.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-emerald-600 p-10 md:p-14 rounded-[56px] text-white flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl shadow-emerald-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
        <div className="space-y-4 text-center lg:text-left relative z-10">
          <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Visão Consolidada</h3>
          <p className="text-emerald-100 font-bold max-w-md uppercase text-xs tracking-widest leading-relaxed opacity-80">Sua operação mantém indicadores de margem dentro do desvio padrão esperado para o nicho fit.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 relative z-10">
          <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/20 text-center min-w-[160px] shadow-xl">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mb-2">Custo Médio/Un</p>
             <p className="text-4xl font-black">{formatCurrency(reports.custoMedioMarmita)}</p>
          </div>
          <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[32px] border border-white/20 text-center min-w-[160px] shadow-xl">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mb-2">Ativos em Catálogo</p>
             <p className="text-4xl font-black">{marmitas.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800 tracking-tight italic">Últimas Compras Registradas</h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{compras.length} registros</span>
        </div>
        
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Produto</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Local</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 font-medium italic">Nenhuma compra registrada ainda.</td>
                </tr>
              ) : (
                compras.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 50).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-5 text-sm font-bold text-slate-500">{c.data}</td>
                    <td className="p-5 text-sm font-black text-slate-700">{c.nomeProduto}</td>
                    <td className="p-5 text-sm font-black text-emerald-600">{formatCurrency(c.valorPago)}</td>
                    <td className="p-5 text-sm font-medium text-slate-400">{c.localCompra || '-'}</td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => handleDeleteCompra(c.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 bg-slate-900 border border-slate-800 rounded-[32px] flex gap-5 text-slate-400 items-start shadow-xl">
        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><Info size={24} strokeWidth={3} /></div>
        <div className="space-y-2">
          <p className="font-black text-white uppercase text-xs tracking-widest">Nota Fiscal Intelectual</p>
          <p className="text-sm font-medium leading-relaxed">
            Os dados apresentados são baseados nos registros manuais e escanneamento de comprovantes salvos localmente. 
            A precisão da inteligência de custos depende da atualização frequente dos tickets de compra.
          </p>
        </div>
      </div>
    </div>
  );
}
