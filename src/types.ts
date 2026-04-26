/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Unidade = 'kg' | 'g' | 'unidade' | 'pacote' | 'litro' | 'ml' | 'maço' | 'caixa';

export type Categoria = 
  | 'Proteínas'
  | 'Carboidratos'
  | 'Legumes'
  | 'Verduras'
  | 'Temperos'
  | 'Embalagens'
  | 'Molhos'
  | 'Laticínios'
  | 'Outros';

export interface HistoricoPreco {
  id: string;
  data: string;
  valorPago: number;
  quantidade: number;
  unidade: Unidade;
  custoPorKg?: number;
  custoPorGrama?: number;
  custoPorUnidade?: number;
  localCompra: string;
}

export interface Ingrediente {
  id: string;
  nome: string;
  categoria: Categoria;
  ultimoCustoPorKg?: number;
  ultimoCustoPorGrama?: number;
  ultimoCustoPorUnidade?: number;
  dataUltimaCompra: string;
  localUltimaCompra: string;
  historicoPrecos: HistoricoPreco[];
}

export interface Compra {
  id: string;
  data: string;
  nomeProduto: string;
  categoria: Categoria;
  quantidade: number;
  unidade: Unidade;
  valorPago: number;
  localCompra: string;
  observacoes: string;
  custoPorKg?: number;
  custoPorGrama?: number;
  custoPorUnidade?: number;
  criadoEm: string;
}

export interface IngredienteDaMarmita {
  ingredienteId: string;
  nomeIngrediente: string;
  quantidadeGramas: number;
  custoPorGrama: number;
  custoTotal: number;
}

export interface Marmita {
  id: string;
  nome: string;
  codigo: string;
  pesoTotalGramas: number;
  precoVenda: number;
  custoEmbalagem: number;
  taxaIfood: number;
  taxaMaquininha: number;
  outrosCustos: number;
  ingredientes: IngredienteDaMarmita[];
  custoIngredientes: number;
  custoTotal: number;
  lucroBruto: number;
  margemPercentual: number;
  custoPor100g: number;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
}
