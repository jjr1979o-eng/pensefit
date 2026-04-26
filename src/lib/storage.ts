/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Compra, Ingrediente, Marmita, Unidade, Categoria, HistoricoPreco } from '../types';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

// --- Unit Utilities ---

export const calcularCustosPorUnidade = (quantidade: number, unidade: Unidade, valorPago: number) => {
  let custoPorKg: number | undefined;
  let custoPorGrama: number | undefined;
  let custoPorUnidade: number | undefined;

  if (unidade === 'kg') {
    custoPorKg = valorPago / quantidade;
    custoPorGrama = custoPorKg / 1000;
  } else if (unidade === 'g') {
    custoPorGrama = valorPago / quantidade;
    custoPorKg = custoPorGrama * 1000;
  } else {
    custoPorUnidade = valorPago / quantidade;
  }

  return { custoPorKg, custoPorGrama, custoPorUnidade };
};

// --- Firestore Sync & CRUD ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
};

export const getCompras = async (): Promise<Compra[]> => {
  const path = 'compras';
  try {
    const userId = getUserId();
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Compra));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const getIngredientes = async (): Promise<Ingrediente[]> => {
  const path = 'ingredientes';
  try {
    const userId = getUserId();
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingrediente));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const getMarmitas = async (): Promise<Marmita[]> => {
  const path = 'marmitas';
  try {
    const userId = getUserId();
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Marmita));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const saveCompra = async (compra: Omit<Compra, 'id' | 'criadoEm'>) => {
  const pathCompra = 'compras';
  const pathIngrediente = 'ingredientes';
  try {
    const userId = getUserId();
    const { custoPorKg, custoPorGrama, custoPorUnidade } = calcularCustosPorUnidade(
      compra.quantidade,
      compra.unidade,
      compra.valorPago
    );

    const novaCompra = {
      ...compra,
      userId,
      custoPorKg: custoPorKg || 0,
      custoPorGrama: custoPorGrama || 0,
      custoPorUnidade: custoPorUnidade || 0,
      criadoEm: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, pathCompra), novaCompra);

    // Update or Create Ingrediente
    const ingredientes = await getIngredientes();
    const index = ingredientes.findIndex(i => i.nome.toLowerCase() === compra.nomeProduto.toLowerCase());
    
    const historicoEntry: HistoricoPreco = {
      id: crypto.randomUUID(),
      data: compra.data,
      valorPago: compra.valorPago,
      quantidade: compra.quantidade,
      unidade: compra.unidade,
      custoPorKg: custoPorKg || 0,
      custoPorGrama: custoPorGrama || 0,
      custoPorUnidade: custoPorUnidade || 0,
      localCompra: compra.localCompra
    };

    if (index !== -1) {
      const ing = ingredientes[index];
      const ingRef = doc(db, pathIngrediente, ing.id);
      await updateDoc(ingRef, {
        categoria: compra.categoria,
        ultimoCustoPorKg: custoPorKg || ing.ultimoCustoPorKg,
        ultimoCustoPorGrama: custoPorGrama || ing.ultimoCustoPorGrama,
        ultimoCustoPorUnidade: custoPorUnidade || ing.ultimoCustoPorUnidade,
        dataUltimaCompra: compra.data,
        localUltimaCompra: compra.localCompra,
        unidadeOriginal: compra.unidade, // Sincroniza a unidade para facilitar marmitas
        historicoPrecos: [historicoEntry, ...ing.historicoPrecos].slice(0, 50)
      });
    } else {
      const novoIng = {
        userId,
        nome: compra.nomeProduto,
        categoria: compra.categoria,
        ultimoCustoPorKg: custoPorKg || 0,
        ultimoCustoPorGrama: custoPorGrama || 0,
        ultimoCustoPorUnidade: custoPorUnidade || 0,
        dataUltimaCompra: compra.data,
        localUltimaCompra: compra.localCompra,
        unidadeOriginal: compra.unidade,
        historicoPrecos: [historicoEntry]
      };
      await addDoc(collection(db, pathIngrediente), novoIng);
    }

    return { id: docRef.id, ...novaCompra } as Compra;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathCompra);
  }
};

export const saveMarmita = async (marmita: Omit<Marmita, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
  const path = 'marmitas';
  try {
    const userId = getUserId();
    const now = new Date().toISOString();
    
    const novaMarmita = {
      ...marmita,
      userId,
      criadoEm: now,
      atualizadoEm: now
    };

    const docRef = await addDoc(collection(db, path), novaMarmita);
    return { id: docRef.id, ...novaMarmita } as Marmita;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deleteMarmita = async (id: string) => {
  const path = 'marmitas';
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const deleteIngrediente = async (id: string) => {
  const path = 'ingredientes';
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveIngredienteManual = async (nome: string, categoria: Categoria) => {
  const path = 'ingredientes';
  try {
    const userId = getUserId();
    const currentIngredientes = await getIngredientes();
    
    if (currentIngredientes.some(i => i.nome.toLowerCase() === nome.toLowerCase())) {
      return;
    }

    const novoIng = {
      userId,
      nome,
      categoria,
      dataUltimaCompra: new Date().toISOString().split('T')[0],
      localUltimaCompra: 'Pendente',
      historicoPrecos: []
    };

    await addDoc(collection(db, path), novoIng);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deleteCompra = async (id: string) => {
  const path = 'compras';
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateMarmita = async (marmita: Marmita) => {
  const path = 'marmitas';
  try {
    const docRef = doc(db, path, marmita.id);
    const { id, ...data } = marmita;
    await updateDoc(docRef, {
      ...data,
      atualizadoEm: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

