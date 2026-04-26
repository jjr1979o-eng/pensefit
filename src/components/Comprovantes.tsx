/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle2, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Categoria, Unidade } from '../types';
import { saveCompra } from '../lib/storage';

interface ComprovantesProps {
  onBack: () => void;
}

interface ItemEncontrado {
  id: string;
  nome: string;
  quantidade: number;
  unidade: Unidade;
  valorPago: number;
  categoria: Categoria;
}

export default function Comprovantes({ onBack }: ComprovantesProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<ItemEncontrado[]>([]);
  const [isDone, setIsDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setItems([]);
        setIsDone(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const simularOCR = () => {
    setIsAnalyzing(true);
    // Simulate API delay
    setTimeout(() => {
      const fakeItems: ItemEncontrado[] = [
        { id: '1', nome: 'Frango Peito', quantidade: 2.5, unidade: 'kg', valorPago: 37.50, categoria: 'Proteínas' },
        { id: '2', nome: 'Arroz 5kg', quantidade: 1, unidade: 'pacote', valorPago: 28.90, categoria: 'Carboidratos' },
        { id: '3', nome: 'Cenoura Kg', quantidade: 0.8, unidade: 'kg', valorPago: 4.50, categoria: 'Legumes' },
      ];
      setItems(fakeItems);
      setIsAnalyzing(false);
    }, 2000);
  };

  const updateItem = (id: string, field: keyof ItemEncontrado, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    const newItem: ItemEncontrado = {
      id: crypto.randomUUID(),
      nome: '',
      quantidade: 0,
      unidade: 'kg',
      valorPago: 0,
      categoria: 'Outros'
    };
    setItems([...items, newItem]);
  };

  const salvarTudo = async () => {
    if (items.length === 0) return;
    
    try {
      setIsSaving(true);
      const data = new Date().toISOString().split('T')[0];
      
      // Use sequential saves to ensure ingredient consistency
      for (const item of items) {
        await saveCompra({
          data,
          nomeProduto: item.nome,
          categoria: item.categoria,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valorPago: item.valorPago,
          localCompra: 'Scan de Comprovante',
          observacoes: 'Importado via OCR'
        });
      }

      setIsDone(true);
      alert('Todos os itens foram sincronizados com a nuvem com sucesso!');
    } catch (error) {
      console.error("Error saving scanned items:", error);
      alert('Erro ao sincronizar itens.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Scan Inteligente</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Leitura de cupom via OCR</p>
          </div>
        </div>
        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
          <FileText size={24} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Step 1: Upload */}
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all min-h-[300px] bg-white ${
              image ? 'border-emerald-200 ring-4 ring-emerald-50/50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50 hover:ring-8 hover:ring-slate-50/50'
            }`}
          >
            {image ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={image} alt="Comprovante" className="max-h-80 rounded-2xl shadow-xl border-4 border-white" />
                <div className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm">
                  <Upload size={32} />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-slate-700">Carregar Imagem</p>
                  <p className="text-xs text-slate-400 font-medium px-4">Tire uma foto legível do cupom fiscal para extração de dados</p>
                </div>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          {image && !isAnalyzing && items.length === 0 && (
            <button 
              onClick={simularOCR}
              className="w-full p-5 bg-emerald-600 text-white rounded-[20px] font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-100/50 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <Loader2 size={24} className="group-hover:animate-spin" />
              Iniciar Processamento
            </button>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center p-12 space-y-6 text-emerald-600 bg-white border border-emerald-100 rounded-[32px] animate-pulse">
              <div className="relative">
                 <Loader2 className="animate-spin text-emerald-100" size={80} />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-12 h-1 bg-emerald-500 rounded-full animate-bounce"></div>
                 </div>
              </div>
              <p className="font-black text-xl tracking-tighter uppercase">Analisando Estrutura...</p>
            </div>
          )}
        </div>

        {/* Step 2: Edit & Review */}
        <div className="space-y-6">
          {items.length > 0 && !isDone && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  Dados Extraídos
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-wider">{items.length} itens</span>
                </h3>
                <button 
                  onClick={addItem}
                  className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} strokeWidth={3} /> Add Novo
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 font-bold uppercase leading-tight">
                  Atenção: Revise preços e quantidades. O sistema pode arredondar valores da imagem.
                </p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                {items.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:border-emerald-200 transition-colors group">
                    <div className="flex items-start gap-3">
                      <input 
                        type="text" 
                        value={item.nome}
                        onChange={(e) => updateItem(item.id, 'nome', e.target.value)}
                        placeholder="Nome do produto"
                        className="flex-1 font-bold text-slate-800 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                      <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-slate-400 ml-1">Volume</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={item.quantidade}
                            onChange={(e) => updateItem(item.id, 'quantidade', parseFloat(e.target.value))}
                            className="w-20 bg-slate-50 border border-slate-100 rounded-xl px-2 py-3 text-sm font-bold text-slate-700 text-center focus:bg-white outline-none"
                          />
                           <select 
                            value={item.unidade}
                            onChange={(e) => updateItem(item.id, 'unidade', e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-2 py-3 text-xs font-bold text-slate-600 appearance-none text-center focus:bg-white outline-none"
                          >
                            {['kg', 'g', 'unidade', 'pacote', 'litro', 'ml', 'maço', 'caixa'].map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-slate-400 ml-1">Valor Final</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                          <input 
                            type="number" 
                            value={item.valorPago}
                            onChange={(e) => updateItem(item.id, 'valorPago', parseFloat(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 pl-8 py-3 text-sm font-black text-slate-800 focus:bg-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <select 
                      value={item.categoria}
                      onChange={(e) => updateItem(item.id, 'categoria', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-50 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest appearance-none text-center hover:bg-slate-100 transition-colors outline-none"
                    >
                      {['Proteínas', 'Carboidratos', 'Legumes', 'Verduras', 'Temperos', 'Embalagens', 'Molhos', 'Laticínios', 'Outros'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button 
                  onClick={salvarTudo}
                  disabled={isSaving}
                  className={`w-full p-5 text-white rounded-[20px] font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all ${
                    isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
                  }`}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} className="text-emerald-400" />}
                  {isSaving ? 'Sincronizando...' : 'Consolidar Compras'}
                </button>
              </div>
            </div>
          )}

          {isDone && (
            <div className="bg-white p-12 rounded-[40px] border border-emerald-100 text-center space-y-8 shadow-2xl shadow-emerald-50 animate-in zoom-in duration-500">
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
                <div className="relative w-full h-full bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle2 size={60} strokeWidth={3} />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">SUCESSO!</h3>
                <p className="text-slate-500 font-medium px-4">Os itens foram extraídos e injetados no sistema com precisão.</p>
              </div>
              <button 
                onClick={onBack}
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 text-slate-800 rounded-[20px] font-black hover:bg-white hover:border-emerald-500 transition-all uppercase tracking-widest text-sm"
              >
                Retornar ao Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
