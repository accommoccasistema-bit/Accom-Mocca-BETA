
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  Timestamp, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  getDocs,
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  onSnapshot,
  where,
  serverTimestamp,
  increment,
  deleteField,
  getDocFromServer
} from "firebase/firestore";
import { 
  getAuth, 
  onAuthStateChanged, 
  User,
  signOut,
  signInWithEmailAndPassword,
  signInAnonymously
} from "firebase/auth";
import firebaseConfig from "./firebase-applet-config.json";

// Corrected imports and re-exports
import { Load, LoadType, StockData, Bica, SavedExtraction, MoistureEntry, MillingBoxData, MillingBoxDetails, Destination, CalculatorState, AppConfig, WheatEntry, SubproductLoad, Analysis, Driver, Weighing, Entity, ReturnRecord, MoccaDocument } from "./types";
// Removed UMAD import from types_umad.ts

export type { Load, LoadType, StockData, Bica, SavedExtraction, MoistureEntry, MillingBoxData, MillingBoxDetails, Destination, CalculatorState, AppConfig, WheatEntry, SubproductLoad, Analysis, Driver, Weighing, Entity, ReturnRecord, MoccaDocument };

const app = initializeApp(firebaseConfig);

const isAiStudio = typeof window !== 'undefined' && window.location.hostname.includes('run.app');

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalForceLongPolling: isAiStudio,
  }, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e) {
  console.warn("Firestore already initialized, falling back to getFirestore:", e);
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
}

export const db = dbInstance;
export const auth = getAuth(app);

let directDbInstance;
try {
  const existingApp = getApps().find(a => a.name === "DirectUploadApp");
  const directApp = existingApp || initializeApp(firebaseConfig, "DirectUploadApp");
  directDbInstance = initializeFirestore(directApp, {
    experimentalForceLongPolling: isAiStudio,
  }, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e) {
  console.warn("Error initializing directDb, falling back to default db:", e);
  directDbInstance = dbInstance;
}
export const directDb = directDbInstance;

async function testConnection() {
  console.log("Starting Firestore connection test with project:", firebaseConfig.projectId, "and database:", firebaseConfig.firestoreDatabaseId);
  try {
    // Tenta uma leitura direta do servidor para testar a conectividade
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test: SUCCESS");
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.error("Firestore connection test: FAIL. Check your Firebase configuration.");
    } else {
      console.error("Firestore connection test: ERROR", error);
    }
  }
}
testConnection();

export const signInWithId = async (id: string, pass: string) => {
  try {
    // Transformamos o ID em um formato de email para o Firebase
    const email = `${id.toLowerCase().trim()}@mocca.app`;
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    console.error("Error signing in with ID:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const signInAnon = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Error signing in anonymously:", error);
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
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
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const SHARED_TEAM_ID = "EQUIPE_MOCCA_GERAL";

// --- FUNÇÕES EXTRAÇÃO ---
export const saveExtraction = async (data: any) => {
  const path = "extractions";
  try {
    await addDoc(collection(db, path), {
      userId: SHARED_TEAM_ID,
      flour: data.flourTotal,
      bran: data.bran,
      yieldPercentage: data.yieldPercentage,
      date: Timestamp.now(),
      flourCommon: data.breakdown.common,
      flourSpecial: data.breakdown.special,
      flourWhole: data.breakdown.whole,
      flourGlue: data.breakdown.glue
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

// Updated to accept error callback
export const subscribeToHistory = (onUpdate: (data: SavedExtraction[]) => void, onError?: (error: any) => void) => {
  const path = "extractions";
  const q = query(
    collection(db, path), 
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("date", "desc"), 
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const history: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      history.push({ id: doc.id, ...data });
    });
    onUpdate(history);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

export const saveAnalysis = async (data: { type: string; color: number, moisture: number }) => {
  const path = "analyses";
  try {
    await addDoc(collection(db, path), {
      ...data,
      userId: SHARED_TEAM_ID,
      date: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const subscribeToAnalyses = (onUpdate: (data: Analysis[]) => void, onError?: (error: any) => void) => {
  const path = "analyses";
  const q = query(
    collection(db, path), 
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("date", "desc"), 
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const analyses: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      analyses.push({ id: doc.id, ...data });
    });
    onUpdate(analyses);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// --- FUNÇÕES ESTOQUE ---
export const saveStock = async (data: StockData) => {
  const path = `stock/${SHARED_TEAM_ID}`;
  try {
    await setDoc(doc(db, "stock", SHARED_TEAM_ID), { ...data, updatedAt: Timestamp.now(), userId: SHARED_TEAM_ID });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const resetGlueStock = async () => {
  try {
    const docRef = doc(db, "stock", SHARED_TEAM_ID);
    const stockSnap = await getDoc(docRef);
    
    const updates: any = {
      glue: 0,
      updatedAt: serverTimestamp()
    };

    if (stockSnap.exists()) {
      const data = stockSnap.data() as StockData;
      if (data.common < 0) updates.common = 0;
      if (data.special < 0) updates.special = 0;
      if (data.whole < 0) updates.whole = 0;
    }

    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error("Error resetting glue stock:", error);
    return false;
  }
};

// Updated to accept error callback
export const subscribeToStock = (onUpdate: (data: StockData) => void, onError?: (error: any) => void) => {
  const path = `stock/${SHARED_TEAM_ID}`;
  const docRef = doc(db, "stock", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data() as StockData);
    else onUpdate({ common: 0, special: 0, whole: 0, glue: 0, branStock: 0 });
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// --- NOVO SISTEMA DE CARGAS ---
const getBranPerBag = (type: LoadType): number => {
  return type === 'CL' ? 314 : 358;
};

export const createLoad = async (loadData: Omit<Load, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'status'>, batchInfo?: { id: string; name: string }) => {
  const path = "loads";
  try {
    const activeBatch = batchInfo || await getActiveBatch();
    if (!activeBatch) return false;

    await runTransaction(db, async (transaction) => {
      const stockRef = doc(db, "stock", SHARED_TEAM_ID);
      const stockSnap = await transaction.get(stockRef);
      
      const batchPrefix = activeBatch.name.startsWith('#') ? activeBatch.name : `#${activeBatch.name}`;
      const formattedLoadId = `${batchPrefix}/${loadData.loadId}`;
      const currentQty = loadData.currentQty || 0;
      
      const newDocRef = doc(collection(db, path));
      
      // Clean data of undefined values for Firestore
      const cleanData = Object.fromEntries(
        Object.entries(loadData).filter(([_, v]) => v !== undefined)
      );

      transaction.set(newDocRef, {
        ...cleanData,
        loadId: formattedLoadId,
        currentQty: currentQty,
        status: 'ATIVO',
        userId: SHARED_TEAM_ID,
        batchId: activeBatch.id,
        batchName: activeBatch.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const type = loadData.type;
      let field: keyof StockData | null = null;
      if (type === 'C') field = 'common';
      else if (type === 'E') field = 'special';
      else if (type === 'I') field = 'whole';
      else if (type === 'CL') field = 'glue';

      const updates: any = { updatedAt: serverTimestamp() };
      if (field) {
          updates[field] = increment(currentQty);
      }
      
      const branChange = currentQty * getBranPerBag(type);
      updates.branStock = increment(branChange);

      if (stockSnap.exists()) {
        transaction.update(stockRef, updates);
      } else {
        transaction.set(stockRef, {
          common: 0,
          special: 0,
          whole: 0,
          glue: 0,
          branStock: 0,
          returnFlourBalance: 0,
          returnBranBalance: 0,
          returnOtherBalance: 0,
          userId: SHARED_TEAM_ID,
          createdAt: serverTimestamp(),
          ...updates
        }, { merge: true });
      }
    });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const syncLoadQtyWithStock = async (id: string, targetQty: number, type: LoadType, currentQty: number, step: number) => {
  if (targetQty < 0) return false;
  
  try {
    if (step >= 6) {
      throw new Error("Cannot update qty of a load already in process (step >= 6)");
    }

    const docRef = doc(db, "loads", id);
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    
    await runTransaction(db, async (transaction) => {
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) {
        throw new Error("Load not found");
      }

      const stockSnap = await transaction.get(stockRef);

      const actualCurrentQty = loadSnap.data()?.currentQty ?? currentQty;
      const diff = targetQty - actualCurrentQty;
      if (diff === 0) return;

      const stockFieldMap: Record<LoadType, keyof StockData> = {
        'E': 'special',
        'C': 'common',
        'I': 'whole',
        'CL': 'glue'
      };
      const field = stockFieldMap[type];
      const branChange = diff * getBranPerBag(type);

      transaction.update(docRef, {
        currentQty: targetQty,
        updatedAt: serverTimestamp()
      });

      const stockUpdates = {
        [field]: increment(diff),
        branStock: increment(branChange)
      };

      if (stockSnap.exists()) {
        transaction.update(stockRef, {
          ...stockUpdates,
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.set(stockRef, {
          common: 0,
          special: 0,
          whole: 0,
          glue: 0,
          branStock: 0,
          returnFlourBalance: 0,
          returnBranBalance: 0,
          returnOtherBalance: 0,
          userId: SHARED_TEAM_ID,
          createdAt: serverTimestamp(),
          ...stockUpdates,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    });

    return true;
  } catch (error) {
    console.error("Error syncing load qty with stock:", error);
    return false;
  }
};

export const updateLoadStep = async (loadData: Load, step: number, extraData?: any) => {
  const id = loadData.id;
  const path = `loads/${id}`;
  try {
    const docRef = doc(db, "loads", id);
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    
    const oldStep = loadData.step;
    const targetStep = Math.max(1, Math.min(7, step));
    if (oldStep === targetStep && !extraData) return true;

    const bags = loadData.currentQty || 0;
    
    // stockFieldMap
    const stockFieldMap: Record<LoadType, keyof StockData> = {
      'E': 'special',
      'C': 'common',
      'I': 'whole',
      'CL': 'glue'
    };
    const field = stockFieldMap[loadData.type];

    await runTransaction(db, async (transaction) => {
      // 1. Read load, stock, and batch (if needed)
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) throw new Error("Load not found");
      
      const stockSnap = await transaction.get(stockRef);
      const stockData = stockSnap.exists() ? (stockSnap.data() as StockData) : null;
      
      let batchRef = null;
      if (loadData.batchId) {
        batchRef = doc(db, "batches", loadData.batchId);
      }

      const updates: any = {};
      const stockUpdates: any = { updatedAt: serverTimestamp() };
      
      // Caso 1: Avançando de <=5 para >=6 (Subtração do estoque)
      if (oldStep <= 5 && targetStep >= 6) {
        stockUpdates[field] = increment(-bags);
        
        const weightToUse = extraData?.weight || loadData.weight || 0;
        if (weightToUse > 0 && loadData.batchId && batchRef) {
          const isManualAmortized = loadSnap.data()?.isAmortized;
          const manualAmortizedWeight = loadSnap.data()?.amortizedWeight || 0;
          
          let weightFromProduction = weightToUse;
          
          if (isManualAmortized && manualAmortizedWeight > 0) {
            weightFromProduction = Math.max(0, weightToUse - manualAmortizedWeight);
            updates.consumedReturnWeight = manualAmortizedWeight;
          } else {
            // Check Return Balance
            const returnBalance = stockData?.returnFlourBalance || 0;
            let newReturnBalance = returnBalance;
            
            if (returnBalance > 0) {
              if (returnBalance >= weightToUse) {
                // Entire weight consumed from Return Balance
                newReturnBalance = returnBalance - weightToUse;
                weightFromProduction = 0;
              } else {
                // Partially consumed from Return Balance
                newReturnBalance = 0;
                weightFromProduction = weightToUse - returnBalance;
              }
              stockUpdates.returnFlourBalance = newReturnBalance;
              // Record the exact amount consumed from returns in the load doc
              updates.consumedReturnWeight = weightToUse - weightFromProduction;
            }
          }
          
          if (weightFromProduction > 0) {
            transaction.update(batchRef, {
              currentFlour: increment(weightFromProduction),
              updatedAt: serverTimestamp()
            });
          }
        }
      }
      
      // Caso 2: Voltando de >=6 para <=5 (Estorno do estoque)
      else if (oldStep >= 6 && targetStep <= 5) {
        stockUpdates[field] = increment(bags);
        
        const weightToRevert = loadData.weight || 0;
        if (weightToRevert > 0 && loadData.batchId && batchRef) {
          // If the load had previously consumed some return balance
          const consumedReturnWeight = loadSnap.data()?.consumedReturnWeight || 0;
          const isManualAmortized = loadSnap.data()?.isAmortized;
          const weightFromProduction = weightToRevert - consumedReturnWeight;
          
          if (consumedReturnWeight > 0 && !isManualAmortized) {
            // Restore return balance
            stockUpdates.returnFlourBalance = increment(consumedReturnWeight);
            updates.consumedReturnWeight = deleteField(); // Clear the field safely using Firebase's delete indicator or simple null
          }
          
          if (weightFromProduction > 0) {
            transaction.update(batchRef, {
              currentFlour: increment(-weightFromProduction),
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      if (stockSnap.exists()) {
        transaction.update(stockRef, stockUpdates);
      } else {
        transaction.set(stockRef, {
          common: 0,
          special: 0,
          whole: 0,
          glue: 0,
          branStock: 0,
          returnFlourBalance: 0,
          returnBranBalance: 0,
          returnOtherBalance: 0,
          userId: SHARED_TEAM_ID,
          createdAt: serverTimestamp(),
          ...stockUpdates,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      transaction.update(docRef, {
        step: targetStep,
        quantity: (oldStep === 1 && targetStep > 1) ? loadData.currentQty : loadData.quantity,
        updatedAt: serverTimestamp(),
        ...extraData,
        ...updates
      });
    });

    return true;
  } catch (error) { 
    handleFirestoreError(error, OperationType.WRITE, path);
    return false; 
  }
};

export const finalizeLoad = async (id: string) => {
  try {
    const docRef = doc(db, "loads", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      console.warn(`[finalizeLoad] Load document ${id} does not exist. Skipping finalization.`);
      return false;
    }
    
    // Apenas marcar como FINALIZADO e limpar o anexo de análise temporário.
    // O estoque e o progresso do lote já foram atualizados no passo 6.
    await updateDoc(docRef, {
      status: 'FINALIZADO',
      attachment: deleteField(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) { 
    console.error("Error finalizing load:", error);
    return false; 
  }
};

export const deleteLoad = async (id: string) => {
  try {
    const docRef = doc(db, "loads", id);
    
    await runTransaction(db, async (transaction) => {
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) return;
      
      const loadData = loadSnap.data() as Load;
      const stockRef = doc(db, "stock", SHARED_TEAM_ID);
      
      const stockFieldMap: Record<LoadType, keyof StockData> = {
        'E': 'special',
        'C': 'common',
        'I': 'whole',
        'CL': 'glue'
      };
      const field = stockFieldMap[loadData.type];
      const qty = loadData.currentQty || 0;

      if (qty > 0) {
        const stockSnap = await transaction.get(stockRef);
        if (stockSnap.exists()) {
          const stockData = stockSnap.data() as StockData;
          const currentBran = stockData.branStock || 0;
          const amortizedBran = (loadData as any).amortizedBran || 0;
          const branToSubtract = Math.max(0, (qty * getBranPerBag(loadData.type)) - amortizedBran);
          
          const updates: any = {
            branStock: currentBran - branToSubtract,
            updatedAt: serverTimestamp()
          };

          if (loadData.step >= 6) {
            // Se a carga já tinha saído (passo >= 6), as bags já foram debitadas do estoque.
            // Ao excluir, devemos devolver essas bags ao estoque (estorno da saída).
            const currentFieldStock = stockData[field] || 0;
            transaction.update(stockRef, {
              [field]: currentFieldStock + qty,
              branStock: currentBran - branToSubtract,
              updatedAt: serverTimestamp()
            });
          } else {
            // Se a carga ainda não saiu (passo < 6), as bags estão no estoque (somadas na contagem).
            // Ao excluir, removemos as bags (estorno da produção) e o farelo do estoque.
            const currentFieldStock = stockData[field] || 0;
            transaction.update(stockRef, {
              [field]: Math.max(0, currentFieldStock - qty),
              branStock: currentBran - branToSubtract,
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      // 2. Se a carga já contabilizou no lote (passo >= 6 ou FINALIZADA), remover o peso do progresso do lote
      if ((loadData.status === 'FINALIZADO' || loadData.step >= 6) && loadData.weight && loadData.batchId) {
        const batchRef = doc(db, "batches", loadData.batchId);
        const amortizedWeight = (loadData as any).amortizedWeight || (loadData as any).consumedReturnWeight || 0;
        const weightFromProduction = Math.max(0, loadData.weight - amortizedWeight);
        if (weightFromProduction > 0) {
          transaction.update(batchRef, {
            currentFlour: increment(-weightFromProduction),
            updatedAt: serverTimestamp()
          });
        }
      }

      // Restore Return Balance if the deleted load was amortized
      const amortizedWeight = (loadData as any).amortizedWeight || (loadData as any).consumedReturnWeight || 0;
      if (amortizedWeight > 0) {
        const stockSnapForRestore = await transaction.get(stockRef);
        if (stockSnapForRestore.exists()) {
          transaction.update(stockRef, {
            returnFlourBalance: increment(amortizedWeight),
            updatedAt: serverTimestamp()
          });
        } else {
          transaction.set(stockRef, {
            common: 0,
            special: 0,
            whole: 0,
            glue: 0,
            branStock: 0,
            returnFlourBalance: amortizedWeight,
            returnBranBalance: 0,
            returnOtherBalance: 0,
            userId: SHARED_TEAM_ID,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
      
      // 3. Excluir a carga
      transaction.delete(docRef);
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting load:", error);
    return false;
  }
};

// Updated to accept error callback
export const updateLoadAttachment = async (id: string, attachment: Load['attachment'] | null) => {
  const path = `loads/${id}`;
  try {
    const docRef = doc(db, "loads", id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      console.warn(`[updateLoadAttachment] Load document ${id} does not exist. Skipping update.`);
      return false;
    }
    await updateDoc(docRef, {
      attachment,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const subscribeToLoads = (onUpdate: (data: Load[]) => void, onError?: (error: any) => void) => {
  const path = "loads";
  // Remove orderBy from server-side query to avoid documents disappearing during optimistic updates
  const q = query(collection(db, path), where("userId", "==", SHARED_TEAM_ID));
  
  return onSnapshot(q, (snapshot) => {
    const loads: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      loads.push({ id: doc.id, ...data });
    });
    
    // Sort on client side to handle null timestamps during optimistic updates
    loads.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || Date.now();
      const timeB = b.createdAt?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
    
    onUpdate(loads);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// --- OUTRAS FUNÇÕES ---
// Added saveColoration
export const saveColoration = async (bicas: Bica[]) => {
  const path = `coloration/${SHARED_TEAM_ID}`;
  try {
    await setDoc(doc(db, "coloration", SHARED_TEAM_ID), { bicas, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

// Updated to accept error callback
export const subscribeToColoration = (onUpdate: (data: Bica[]) => void, onError?: (error: any) => void) => {
  const path = `coloration/${SHARED_TEAM_ID}`;
  const docRef = doc(db, "coloration", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data()?.bicas || []);
    else onUpdate([]);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

export const saveMillingBox = async (boxId: number, data: MillingBoxData) => {
  const path = `milling/box_${boxId}`;
  try {
    await setDoc(doc(db, "milling", `box_${boxId}`), { 
      ...data, 
      userId: SHARED_TEAM_ID,
      updatedAt: Timestamp.now() 
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

// Updated to accept error callback
export const subscribeToMillingBoxes = (onUpdate: (data: MillingBoxData[]) => void, onError?: (error: any) => void) => {
  const path = "milling";
  const q = query(
    collection(db, path), 
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("id", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const boxes: any[] = [];
    snapshot.forEach((doc) => boxes.push(doc.data()));
    onUpdate(boxes);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

export const saveMoisture = async (wheat: number, flour: number, bran: number) => {
  const path = "moisture";
  try {
    await addDoc(collection(db, path), { userId: SHARED_TEAM_ID, wheat, flour, bran, date: Timestamp.now() });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

// --- FUNÇÕES CALCULADORA (SINCRONIZAÇÃO) ---
export const saveCalculatorState = async (state: CalculatorState) => {
  const path = `calculator_config/${SHARED_TEAM_ID}`;
  try {
    await setDoc(doc(db, "calculator_config", SHARED_TEAM_ID), { ...state, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const subscribeToCalculatorState = (onUpdate: (data: CalculatorState) => void, onError?: (error: any) => void) => {
  const path = `calculator_config/${SHARED_TEAM_ID}`;
  const docRef = doc(db, "calculator_config", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data() as CalculatorState);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// --- FUNÇÕES ENTRADA MOEGA ---
export const saveWheatEntry = async (data: Omit<WheatEntry, 'id' | 'date' | 'userId'> & { batchId?: string; batchName?: string; ticket?: string }) => {
  const path = "wheat_entries";
  try {
    let batchId = data.batchId;
    let batchName = data.batchName;

    if (!batchId || !batchName) {
      const activeBatch = await getActiveBatch();
      if (!activeBatch) return false;
      batchId = activeBatch.id;
      batchName = activeBatch.name;
    }

    const now = new Date();
    const dayMap = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const dayLetter = dayMap[now.getDay()];
    const dayNumber = now.getDate();
    
    // Check for existing entries today to determine the letter
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const q = query(
      collection(db, path),
      where("userId", "==", SHARED_TEAM_ID),
      where("date", ">=", Timestamp.fromDate(startOfDay))
    );
    const snapshot = await getDocs(q);
    const count = snapshot.size;
    const letter = count === 0 ? '' : String.fromCharCode(64 + count);
    
    const generatedId = `T${letter}${dayLetter}${dayNumber}`;
    
    const batchPrefix = batchName.startsWith('#') ? batchName : `#${batchName}`;
    const formattedTicketId = `${batchPrefix}/${generatedId}`;

    // Clean data of undefined values for Firestore
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    await addDoc(collection(db, path), {
      ...cleanData,
      ticket: data.ticket || formattedTicketId,
      userId: SHARED_TEAM_ID,
      batchId: batchId,
      date: serverTimestamp()
    });
    
    // Update batch wheat progress
    await updateBatchProgress(batchId, { wheatAdd: data.liquidWeight });
    
    return true;
  } catch (error) { 
    handleFirestoreError(error, OperationType.WRITE, path);
    return false; 
  }
};

export const deleteWheatEntry = async (entryId: string, batchId: string, weight: number) => {
  try {
    await deleteDoc(doc(db, 'wheat_entries', entryId));
    
    // Subtrair do progresso do lote
    if (batchId) {
      await updateBatchProgress(batchId, { wheatAdd: -weight });
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting wheat entry:", error);
    return false;
  }
};

export const subscribeToWheatEntries = (onUpdate: (data: WheatEntry[]) => void, onError?: (error: any) => void) => {
  const path = "wheat_entries";
  const q = query(collection(db, path), where("userId", "==", SHARED_TEAM_ID));
  
  return onSnapshot(q, (snapshot) => {
    const entries: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({ id: doc.id, ...data });
    });
    
    entries.sort((a, b) => {
      const timeA = a.date?.toMillis?.() || Date.now();
      const timeB = b.date?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
    
    onUpdate(entries);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// --- FUNÇÕES SUBPRODUTOS (SIMILAR AO CONTROLE) ---
export const createSubproductLoad = async (
  data: Omit<SubproductLoad, 'id' | 'loadId' | 'createdAt' | 'updatedAt' | 'userId' | 'status'>,
  activeBatch: any
) => {
  const path = "subproduct_loads";
  try {
    if (!activeBatch) {
      console.error("No active batch provided for subproduct load");
      return false;
    }

    const now = new Date();
    const dayMap = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const dayLetter = dayMap[now.getDay()];
    const dayNumber = now.getDate();
    
    let prefix = 'O'; // Default for OUTRO
    if (data.type === 'FARELO') prefix = 'F';
    else if (data.type === 'RESIDUO') prefix = 'R';

    // Check for existing subproduct loads of this type today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const q = query(
      collection(db, path),
      where("userId", "==", SHARED_TEAM_ID),
      where("type", "==", data.type),
      where("createdAt", ">=", Timestamp.fromDate(startOfDay))
    );
    const snapshot = await getDocs(q);
    const count = snapshot.size;
    const letter = count === 0 ? '' : String.fromCharCode(64 + count);

    const generatedId = `${prefix}${letter}${dayLetter}${dayNumber}`;
    const batchPrefix = activeBatch.name.startsWith('#') ? activeBatch.name : `#${activeBatch.name}`;
    const formattedLoadId = `${batchPrefix}/${generatedId}`;

    // Clean data of undefined values for Firestore
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    await addDoc(collection(db, path), {
      ...cleanData,
      loadId: formattedLoadId,
      status: 'ATIVO',
      userId: SHARED_TEAM_ID,
      batchId: activeBatch.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) { 
    handleFirestoreError(error, OperationType.WRITE, path);
    return false; 
  }
};

export const finalizeSubproductLoad = async (id: string) => {
  try {
    const docRef = doc(db, "subproduct_loads", id);
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    
    await runTransaction(db, async (transaction) => {
      // 1. All Reads First
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) throw new Error("Load not found");
      
      const loadData = loadSnap.data() as SubproductLoad;
      if (loadData.status === 'FINALIZADO') return;

      let stockSnap = null;
      if (loadData.type === 'FARELO') {
        stockSnap = await transaction.get(stockRef);
      }

      const quantity = loadData.quantity || 0;

      // 2. All Writes After
      transaction.update(docRef, {
        status: 'FINALIZADO',
        updatedAt: serverTimestamp()
      });

      if (loadData.type === 'FARELO' && stockSnap) {
        if (stockSnap.exists()) {
          const currentBran = stockSnap.data().branStock || 0;
          const newBran = currentBran - quantity;
          transaction.update(stockRef, {
            branStock: newBran,
            updatedAt: serverTimestamp()
          });
        } else {
          transaction.set(stockRef, {
            common: 0,
            special: 0,
            whole: 0,
            glue: 0,
            branStock: -quantity,
            returnFlourBalance: 0,
            returnBranBalance: 0,
            returnOtherBalance: 0,
            userId: SHARED_TEAM_ID,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      if (loadData.batchId) {
        const batchRef = doc(db, "batches", loadData.batchId);
        transaction.update(batchRef, {
          currentSubproduct: increment(quantity),
          updatedAt: serverTimestamp()
        });
      }
    });
    
    return true;
  } catch (error) { 
    console.error("Error finalizing subproduct load:", error);
    return false; 
  }
};

export const reopenSubproductLoad = async (id: string) => {
  try {
    const docRef = doc(db, "subproduct_loads", id);
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    
    await runTransaction(db, async (transaction) => {
      // 1. All Reads First
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) throw new Error("Load not found");
      
      const loadData = loadSnap.data() as SubproductLoad;
      if (loadData.status === 'ATIVO') return;

      let stockSnap = null;
      if (loadData.type === 'FARELO') {
        stockSnap = await transaction.get(stockRef);
      }

      const quantity = loadData.quantity || 0;

      // 2. All Writes After
      transaction.update(docRef, {
        status: 'ATIVO',
        updatedAt: serverTimestamp()
      });

      if (loadData.type === 'FARELO' && stockSnap) {
        if (stockSnap.exists()) {
          const currentBran = stockSnap.data().branStock || 0;
          const newBran = currentBran + quantity;
          transaction.update(stockRef, {
            branStock: newBran,
            updatedAt: serverTimestamp()
          });
        } else {
          transaction.set(stockRef, {
            common: 0,
            special: 0,
            whole: 0,
            glue: 0,
            branStock: quantity,
            returnFlourBalance: 0,
            returnBranBalance: 0,
            returnOtherBalance: 0,
            userId: SHARED_TEAM_ID,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      if (loadData.batchId) {
        const batchRef = doc(db, "batches", loadData.batchId);
        transaction.update(batchRef, {
          currentSubproduct: increment(-quantity),
          updatedAt: serverTimestamp()
        });
      }
    });
    
    return true;
  } catch (error) { 
    console.error("Error reopening subproduct load:", error);
    return false; 
  }
};

export const subscribeToSubproductLoads = (onUpdate: (data: SubproductLoad[]) => void, onError?: (error: any) => void) => {
  const path = "subproduct_loads";
  const q = query(collection(db, path), where("userId", "==", SHARED_TEAM_ID));
  return onSnapshot(q, (snapshot) => {
    const loads: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      loads.push({ id: doc.id, ...data });
    });
    loads.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || Date.now();
      const timeB = b.createdAt?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
    onUpdate(loads);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// --- FUNÇÕES APP (SINCRONIZAÇÃO) ---
export const saveAppConfig = async (config: AppConfig) => {
  const path = `app_config/${SHARED_TEAM_ID}`;
  try {
    await setDoc(doc(db, "app_config", SHARED_TEAM_ID), { ...config, updatedAt: Timestamp.now() });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const subscribeToAppConfig = (onUpdate: (data: AppConfig) => void, onError?: (error: any) => void) => {
  const path = `app_config/${SHARED_TEAM_ID}`;
  const docRef = doc(db, "app_config", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data() as AppConfig);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// Updated to accept error callback
export const subscribeToMoisture = (onUpdate: (data: MoistureEntry[]) => void, onError?: (error: any) => void) => {
  const path = "moisture";
  const q = query(
    collection(db, path), 
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("date", "desc"), 
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const history: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      history.push({ id: doc.id, ...data });
    });
    onUpdate(history);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// Added missing config functions
export const isFirebaseReady = () => true;

export const saveFirebaseConfiguration = (config: string) => {
  localStorage.setItem('firebase_config_mocca', config);
  return true;
};

export const resetFirebaseConfiguration = () => {
  localStorage.removeItem('firebase_config_mocca');
  window.location.reload();
};

// --- FUNÇÕES CLIENTE/FORNECEDOR ---
export const saveEntity = async (data: Omit<Entity, 'id' | 'createdAt' | 'userId'>) => {
  const path = "entities";
  try {
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    await addDoc(collection(db, path), {
      ...cleanData,
      userId: SHARED_TEAM_ID,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const updateEntity = async (id: string, data: Partial<Entity>) => {
  const path = `entities/${id}`;
  try {
    const docRef = doc(db, "entities", id);
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    await updateDoc(docRef, { ...cleanData, updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const deleteEntity = async (id: string) => {
  try {
    await deleteDoc(doc(db, "entities", id));
    return true;
  } catch (error) {
    console.error("Error deleting entity:", error);
    return false;
  }
};

export const subscribeToEntities = (onUpdate: (data: Entity[]) => void, onError?: (error: any) => void) => {
  const path = "entities";
  const q = query(collection(db, path), where("userId", "==", SHARED_TEAM_ID));
  return onSnapshot(q, (snapshot) => {
    const entities: any[] = [];
    snapshot.forEach((doc) => entities.push({ id: doc.id, ...doc.data() }));
    entities.sort((a, b) => a.name.localeCompare(b.name));
    onUpdate(entities);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// --- Batches (Lotes de Produção) ---
export const createBatch = async (data: { name: string; targetWheat: number; millingCapacity: number; startDate?: any; estimatedEndDate?: any }) => {
  const path = "batches";
  try {
    const targetFlour = Math.round(data.targetWheat * 0.77);
    const targetSubproduct = Math.round(data.targetWheat * 0.23);
    
    // Convert string dates to server timestamp if they are strings
    const finalData = {
      ...data,
      targetFlour,
      targetSubproduct,
      currentWheat: 0,
      currentFlour: 0,
      currentSubproduct: 0,
      status: 'OPEN',
      createdAt: serverTimestamp(),
      userId: SHARED_TEAM_ID
    };

    await addDoc(collection(db, path), finalData);

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const updateBatchProgress = async (batchId: string, data: { wheatAdd?: number; flourAdd?: number; subproductAdd?: number }) => {
  const path = `batches/${batchId}`;
  try {
    const batchRef = doc(db, "batches", batchId);
    const updates: any = {};
    if (data.wheatAdd) updates.currentWheat = increment(data.wheatAdd);
    if (data.flourAdd) updates.currentFlour = increment(data.flourAdd);
    if (data.subproductAdd) updates.currentSubproduct = increment(data.subproductAdd);
    await updateDoc(batchRef, updates);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const updateBatchTarget = async (batchId: string, targetWheat: number) => {
  const path = `batches/${batchId}`;
  try {
    const batchRef = doc(db, "batches", batchId);
    const targetFlour = Math.round(targetWheat * 0.77);
    const targetSubproduct = Math.round(targetWheat * 0.23);
    
    await updateDoc(batchRef, {
      targetWheat,
      targetFlour,
      targetSubproduct,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const closeBatch = async (batchId: string) => {
  const path = `batches/${batchId}`;
  try {
    const batchRef = doc(db, "batches", batchId);
    const batchSnap = await getDoc(batchRef);
    if (!batchSnap.exists()) return false;
    
    const batchData = batchSnap.data();
    const startTime = batchData.createdAt?.toDate() || new Date();
    const endTime = new Date();
    
    // Calculate duration
    const diffTime = Math.abs(endTime.getTime() - startTime.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Query wheat entries
    const wheatQ = query(collection(db, "wheat_entries"), where("batchId", "==", batchId));
    const wheatSnap = await getDocs(wheatQ);
    let wheatEntryCount = 0;
    let totalWheat = 0;
    wheatSnap.forEach(doc => {
      wheatEntryCount++;
      totalWheat += doc.data().liquidWeight || 0;
    });
    
    // Query flour loads
    const flourQ = query(collection(db, "loads"), where("batchId", "==", batchId));
    const flourSnap = await getDocs(flourQ);
    let flourLoadCount = 0;
    let totalFlour = 0;
    let totalBags = 0;
    flourSnap.forEach(doc => {
      const data = doc.data();
      flourLoadCount++;
      totalFlour += data.weight || 0;
      totalBags += data.currentQty || 0;
    });
    
    // Query subproduct loads
    const subQ = query(collection(db, "subproduct_loads"), where("batchId", "==", batchId));
    const subSnap = await getDocs(subQ);
    let subproductLoadCount = 0;
    let totalSubproduct = 0;
    subSnap.forEach(doc => {
      subproductLoadCount++;
      totalSubproduct += doc.data().quantity || 0;
    });
    
    await updateDoc(batchRef, {
      status: 'CLOSED',
      closedAt: serverTimestamp(),
      wheatEntryCount,
      currentWheat: totalWheat, // Ensure it's accurate
      flourLoadCount,
      currentFlour: totalFlour, // Ensure it's accurate
      subproductLoadCount,
      currentSubproduct: totalSubproduct, // Ensure it's accurate
      totalBags,
      durationDays
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const subscribeToBatches = (callback: (batches: any[]) => void, onError?: (error: any) => void) => {
  const path = "batches";
  const q = query(
    collection(db, path), 
    where("userId", "==", SHARED_TEAM_ID),
    limit(100)
  );
  return onSnapshot(q, (snapshot) => {
    const batches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort client-side to avoid composite index requirement
    batches.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || Date.now();
      const timeB = b.createdAt?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
    callback(batches);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

export const getActiveBatches = async () => {
  const q = query(
    collection(db, "batches"), 
    where("status", "==", "OPEN")
  );
  const snap = await getDocs(q);
  const batches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
  // Sort client-side
  batches.sort((a: any, b: any) => {
    const timeA = a.createdAt?.toMillis?.() || Date.now();
    const timeB = b.createdAt?.toMillis?.() || Date.now();
    return timeB - timeA;
  });
  return batches;
};

export const getActiveBatch = async () => {
  const batches = await getActiveBatches();
  if (batches.length === 0) return null;
  return batches[0];
};

export const saveProductionEntry = async (data: { batchId: string; flourQty: number; branQty: number }) => {
  const path = "production_entries";
  try {
    await addDoc(collection(db, path), {
      ...data,
      userId: SHARED_TEAM_ID,
      createdAt: serverTimestamp()
    });
    // Update batch progress
    await updateBatchProgress(data.batchId, { flourAdd: data.flourQty });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const resetAllData = async () => {
  try {
    // 1. Limpar Cargas (Farinha)
    const loadsSnap = await getDocs(query(collection(db, "loads"), where("userId", "==", SHARED_TEAM_ID)));
    const loadsDeletes = loadsSnap.docs.map(d => deleteDoc(doc(db, "loads", d.id)));
    
    // 2. Limpar Extrações / Histórico
    const extractionsSnap = await getDocs(query(collection(db, "extractions"), where("userId", "==", SHARED_TEAM_ID)));
    const extractionsDeletes = extractionsSnap.docs.map(d => deleteDoc(doc(db, "extractions", d.id)));

    // 2.1 Limpar Análises
    const analysesSnap = await getDocs(query(collection(db, "analyses"), where("userId", "==", SHARED_TEAM_ID)));
    const analysesDeletes = analysesSnap.docs.map(d => deleteDoc(doc(db, "analyses", d.id)));
    
    // 3. Limpar Umidade
    const moistureSnap = await getDocs(query(collection(db, "moisture"), where("userId", "==", SHARED_TEAM_ID)));
    const moistureDeletes = moistureSnap.docs.map(d => deleteDoc(doc(db, "moisture", d.id)));
    
    // 4. Resetar Estoque
    const stockReset = setDoc(doc(db, "stock", SHARED_TEAM_ID), { 
      common: 0, special: 0, whole: 0, glue: 0, branStock: 0,
      returnFlourBalance: 0, returnBranBalance: 0, returnOtherBalance: 0,
      updatedAt: Timestamp.now(), userId: SHARED_TEAM_ID 
    });
    
    // 5. Limpar Moagem (Boxes)
    const millingSnap = await getDocs(query(collection(db, "milling"), where("userId", "==", SHARED_TEAM_ID)));
    const millingDeletes = millingSnap.docs.map(d => deleteDoc(doc(db, "milling", d.id)));

    // 6. Limpar Entrada Trigo (Moega)
    const wheatSnap = await getDocs(query(collection(db, "wheat_entries"), where("userId", "==", SHARED_TEAM_ID)));
    const wheatDeletes = wheatSnap.docs.map(d => deleteDoc(doc(db, "wheat_entries", d.id)));

    // 7. Limpar Lotes (Batches)
    const batchesSnap = await getDocs(query(collection(db, "batches"), where("userId", "==", SHARED_TEAM_ID)));
    const batchesDeletes = batchesSnap.docs.map(d => deleteDoc(doc(db, "batches", d.id)));

    // 8. Limpar Subprodutos
    const subSnap = await getDocs(query(collection(db, "subproduct_loads"), where("userId", "==", SHARED_TEAM_ID)));
    const subDeletes = subSnap.docs.map(d => deleteDoc(doc(db, "subproduct_loads", d.id)));

    // 8.1 Limpar Devoluções
    const returnsSnap = await getDocs(query(collection(db, "returns"), where("userId", "==", SHARED_TEAM_ID)));
    const returnsDeletes = returnsSnap.docs.map(d => deleteDoc(doc(db, "returns", d.id)));

    // 9. Lançamentos de Produção - não tem userId direto mas são secundários ao lote
    // No entanto, para fins de reset, vamos tentar limpar todos (visto que operamos como equipe única)
    const prodSnap = await getDocs(collection(db, "production_entries"));
    const prodDeletes = prodSnap.docs.map(d => deleteDoc(doc(db, "production_entries", d.id)));

    // 10. Limpar Coloração
    const colorationReset = setDoc(doc(db, "coloration", SHARED_TEAM_ID), { bicas: [], updatedAt: Timestamp.now() });

    // 11. Resetar Configurações (App, Umad, Calculadora)
    const appConfigReset = setDoc(doc(db, "app_config", SHARED_TEAM_ID), { currentView: 'menu', updatedAt: Timestamp.now() });
    const umadReset = deleteDoc(doc(db, "umad_config", SHARED_TEAM_ID));
    const calcReset = deleteDoc(doc(db, "calculator_config", SHARED_TEAM_ID));

    await Promise.all([
      ...loadsDeletes, 
      ...extractionsDeletes, 
      ...analysesDeletes,
      ...moistureDeletes, 
      ...millingDeletes,
      ...wheatDeletes,
      ...batchesDeletes,
      ...subDeletes,
      ...returnsDeletes,
      ...prodDeletes,
      stockReset,
      colorationReset,
      appConfigReset,
      umadReset,
      calcReset
    ]);
    
    return true;
  } catch (error) {
    console.error("Erro ao resetar dados:", error);
    return false;
  }
};

export const resetActiveLoadsAndStock = async () => {
  try {
    // 1. Zerar todo o estoque de farinha (Comum, Especial, Integral e Cola)
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    const stockSnap = await getDoc(stockRef);
    
    if (stockSnap.exists()) {
      await updateDoc(stockRef, {
        common: 0,
        special: 0,
        whole: 0,
        glue: 0,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(stockRef, {
        common: 0,
        special: 0,
        whole: 0,
        glue: 0,
        branStock: 0,
        userId: SHARED_TEAM_ID,
        updatedAt: serverTimestamp()
      });
    }

    // 2. Zerar o contador de TODAS as cargas de farinha que estão em vigor (ATIVO)
    const q = query(
      collection(db, "loads"), 
      where("userId", "==", SHARED_TEAM_ID),
      where("status", "==", "ATIVO")
    );
    
    const querySnapshot = await getDocs(q);
    const updates = querySnapshot.docs.map(d => updateDoc(doc(db, "loads", d.id), { 
      currentQty: 0, 
      updatedAt: serverTimestamp() 
    }));
    
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error("Error resetting loads and stock:", error);
    return false;
  }
};

export const resetStockField = async (field: keyof StockData) => {
  try {
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    await updateDoc(stockRef, {
      [field]: 0,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error resetting stock field ${field}:`, error);
    return false;
  }
};

// --- FUNÇÕES DRIVERS ---
export const saveDriver = async (data: Omit<Driver, 'id' | 'createdAt' | 'userId'>) => {
  const path = "drivers";
  try {
    await addDoc(collection(db, path), {
      ...data,
      userId: SHARED_TEAM_ID,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const deleteSubproductLoad = async (id: string) => {
  const path = "subproduct_loads";
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const updateSubproductLoad = async (id: string, data: Partial<Omit<SubproductLoad, 'id' | 'loadId' | 'createdAt' | 'updatedAt' | 'userId'>>) => {
  const path = `subproduct_loads/${id}`;
  try {
    const docRef = doc(db, "subproduct_loads", id);
    
    // Clean data of undefined values for Firestore
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const subscribeToWeighings = (onUpdate: (data: Weighing[]) => void, onError?: (error: any) => void) => {
  const path = "weighings";
  const q = query(collection(db, path), where("userId", "==", SHARED_TEAM_ID), orderBy("entryDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    const weighings: any[] = [];
    snapshot.forEach((doc) => {
      weighings.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(weighings);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

export const updateDriver = async (id: string, data: Partial<Omit<Driver, 'id' | 'createdAt' | 'userId'>>) => {
  const path = `drivers/${id}`;
  try {
    await updateDoc(doc(db, "drivers", id), data);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const deleteDriver = async (id: string) => {
  const path = `drivers/${id}`;
  try {
    await deleteDoc(doc(db, "drivers", id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
};

export const subscribeToDrivers = (onUpdate: (data: Driver[]) => void, onError?: (error: any) => void) => {
  const path = "drivers";
  const q = query(collection(db, path), where("userId", "==", SHARED_TEAM_ID));
  return onSnapshot(q, (snapshot) => {
    const drivers: any[] = [];
    snapshot.forEach((doc) => {
      drivers.push({ id: doc.id, ...doc.data() });
    });
    drivers.sort((a, b) => a.name.localeCompare(b.name));
    onUpdate(drivers);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
    if (onError) onError(error);
  });
};

// Utility to remove undefined values from objects before sending to Firestore
const cleanData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean;
};

// --- NOVAS OPERACOES DE RETORNO (DEVOLUCOES) ---
export const subscribeToReturns = (onUpdate: (data: ReturnRecord[]) => void, onError?: (error: any) => void) => {
  const path = "returns";
  const q = query(
    collection(db, path),
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const data: ReturnRecord[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as ReturnRecord);
      });
      onUpdate(data);
    },
    (error) => {
      console.error("Erro na escuta de retornos:", error);
      if (onError) onError(error);
    }
  );
};

export const createReturn = async (returnData: {
  type: 'FARINHA' | 'FARELO' | 'OUTROS';
  loadId: string;    // Full or formatted load ID selected
  loadDocId: string; // The Firestore document ID of the load or subproduct load
  motivo: string;
  bagsQty?: number;
  weightKg: number;
  qtyGeneral?: number;
  observations?: string;
}) => {
  const path = "returns";
  try {
    const activeBatch = await getActiveBatch();
    if (!activeBatch) {
      throw new Error("Não há lote em vigor ativo.");
    }

    await runTransaction(db, async (transaction) => {
      const stockRef = doc(db, "stock", SHARED_TEAM_ID);
      const stockSnap = await transaction.get(stockRef);
      const stockData = stockSnap.exists()
        ? (stockSnap.data() as StockData)
        : { common: 0, special: 0, whole: 0, glue: 0, branStock: 0, returnFlourBalance: 0, returnBranBalance: 0, returnOtherBalance: 0 };
      
      let loadSnap: any = null;
      if (returnData.type === 'FARINHA') {
        const loadDocRef = doc(db, "loads", returnData.loadDocId);
        loadSnap = await transaction.get(loadDocRef);
      }

      // Prepare stock updates first (Read phase finished, preparing Write data)
      const stockUpdates: any = { updatedAt: serverTimestamp() };

      if (returnData.type === 'FARINHA') {
        const currentReturnFlourBalance = stockData.returnFlourBalance || 0;
        stockUpdates.returnFlourBalance = currentReturnFlourBalance + returnData.weightKg;
      } else if (returnData.type === 'FARELO') {
        const currentBranStock = stockData.branStock || 0;
        const currentReturnBranBalance = stockData.returnBranBalance || 0;
        
        stockUpdates.branStock = currentBranStock + returnData.weightKg;
        stockUpdates.returnBranBalance = currentReturnBranBalance + returnData.weightKg;
      } else {
        const currentReturnOtherBalance = stockData.returnOtherBalance || 0;
        stockUpdates.returnOtherBalance = currentReturnOtherBalance + returnData.weightKg;
      }

      // Write actions begin here
      const newDocRef = doc(collection(db, path));
      const cleanLoadId = returnData.loadId.includes('/') ? returnData.loadId.split('/')[1] : returnData.loadId;

      transaction.set(newDocRef, cleanData({
        ...returnData,
        cleanLoadId,
        batchId: activeBatch.id,
        batchName: activeBatch.name,
        userId: SHARED_TEAM_ID,
        createdAt: serverTimestamp()
      }));

      if (stockSnap.exists()) {
        transaction.update(stockRef, stockUpdates);
      } else {
        transaction.set(stockRef, {
          common: 0,
          special: 0,
          whole: 0,
          glue: 0,
          branStock: 0,
          returnFlourBalance: 0,
          returnBranBalance: 0,
          returnOtherBalance: 0,
          userId: SHARED_TEAM_ID,
          createdAt: serverTimestamp(),
          ...stockUpdates,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    });
    
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const amortizeLoadWithPendingFlour = async (loadId: string, bagsToAmortize: number, type: LoadType) => {
  try {
    const docRef = doc(db, "loads", loadId);
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);

    await runTransaction(db, async (transaction) => {
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) throw new Error("Carga não encontrada");
      
      const loadData = loadSnap.data();
      if (loadData.isAmortized) {
        throw new Error("Esta carga já está amortizada");
      }

      const stockSnap = await transaction.get(stockRef);
      if (!stockSnap.exists()) throw new Error("Estoque não encontrado");
      const stockData = stockSnap.data() as StockData;
      
      const returnFlourBalance = stockData.returnFlourBalance || 0;
      if (returnFlourBalance <= 0) {
        throw new Error("Não há Farinha Pendente disponível no estoque para amortização");
      }

      const bagWeight = type === 'CL' ? 1050 : 1200;
      const weightNeeded = bagsToAmortize * bagWeight;
      const amortizedAmt = Math.min(returnFlourBalance, weightNeeded);

      // Deduct from returnFlourBalance only (no bran deduction)
      transaction.update(stockRef, {
        returnFlourBalance: increment(-amortizedAmt),
        updatedAt: serverTimestamp()
      });

      // Update load document
      transaction.update(docRef, {
        isAmortized: true,
        amortizedWeight: amortizedAmt,
        consumedReturnWeight: amortizedAmt,
        updatedAt: serverTimestamp()
      });
    });

    return true;
  } catch (error) {
    console.error("Erro ao amortizar carga:", error);
    return false;
  }
};

export const cancelLoadAmortization = async (loadId: string) => {
  try {
    const docRef = doc(db, "loads", loadId);
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);

    await runTransaction(db, async (transaction) => {
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) throw new Error("Carga não encontrada");
      
      const loadData = loadSnap.data();
      if (!loadData.isAmortized) {
        throw new Error("Esta carga não está amortizada");
      }

      const stockSnap = await transaction.get(stockRef);
      const amortizedAmt = loadData.amortizedWeight || loadData.consumedReturnWeight || 0;

      // Restore to returnFlourBalance only
      if (stockSnap.exists()) {
        transaction.update(stockRef, {
          returnFlourBalance: increment(amortizedAmt),
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.set(stockRef, {
          common: 0,
          special: 0,
          whole: 0,
          glue: 0,
          branStock: 0,
          returnFlourBalance: amortizedAmt,
          returnBranBalance: 0,
          returnOtherBalance: 0,
          userId: SHARED_TEAM_ID,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
          }, { merge: true });
      }

      // Remove amortization fields from load
      transaction.update(docRef, {
        isAmortized: false,
        amortizedWeight: deleteField(),
        consumedReturnWeight: deleteField(),
        amortizedBran: deleteField(),
        updatedAt: serverTimestamp()
      });
    });

    return true;
  } catch (error) {
    console.error("Erro ao cancelar amortização:", error);
    return false;
  }
};

// --- OPERAÇÕES DOS DOCUMENTOS MOCCA (DOCS MOCCA) ---
export const saveMoccaDocument = async (docData: { name: string; revisionDate: string; fileName: string; fileSize: number; fileData: string }) => {
  const path = "mocca_documents";
  try {
    const { fileData, ...metadata } = docData;
    const CHUNK_SIZE = 700 * 1024; // 700KB chunks (keeps payload safe under Firestore 1MB limits)
    
    // We ALWAYS store the fileData in the chunks subcollection.
    // This allows the parent document to remain extremely lightweight (<1KB),
    // avoiding heavy bandwidth and real-time read costs when querying/subscribing to documents.
    const numChunks = Math.ceil(fileData.length / CHUNK_SIZE);
    
    const docRef = await addDoc(collection(directDb, path), {
      ...metadata,
      fileData: "", // Omit heavy data completely from the main listing document
      isChunked: true,
      numChunks,
      userId: SHARED_TEAM_ID,
      createdAt: serverTimestamp()
    });

    const parentId = docRef.id;
    for (let i = 0; i < numChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileData.length);
      const chunkData = fileData.substring(start, end);
      
      await setDoc(doc(directDb, "mocca_documents", parentId, "chunks", `chunk_${i}`), {
        data: chunkData,
        index: i
      });
    }
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const deleteMoccaDocument = async (docId: string) => {
  const path = "mocca_documents";
  try {
    const chunksColl = collection(directDb, "mocca_documents", docId, "chunks");
    const chunksSnap = await getDocs(chunksColl);
    
    // Concurrently delete all chunk documents to optimize performance
    const deletePromises = chunksSnap.docs.map(chunkDoc => deleteDoc(chunkDoc.ref));
    await Promise.all(deletePromises);
    
    await deleteDoc(doc(directDb, path, docId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

export const subscribeToMoccaDocuments = (onUpdate: (data: MoccaDocument[]) => void, onError?: (error: any) => void) => {
  const path = "mocca_documents";
  const q = query(
    collection(db, path),
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const docs: MoccaDocument[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as MoccaDocument);
      });
      onUpdate(docs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
};

export const fetchMoccaDocumentData = async (docId: string, isChunked: boolean, fallbackData?: string) => {
  if (!isChunked && fallbackData) {
    return fallbackData; // For legacy documents
  }
  const chunksColl = collection(directDb, "mocca_documents", docId, "chunks");
  const chunksSnap = await getDocs(chunksColl);
  
  if (chunksSnap.size > 0) {
    const sortedChunks = chunksSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as unknown as { data: string; index: number }))
      .sort((a, b) => a.index - b.index);
    return sortedChunks.map(c => c.data).join("");
  }
  
  return fallbackData || "";
};

export const findInspecaoVeicularDoc = async (): Promise<MoccaDocument | null> => {
  const path = "mocca_documents";
  const q = query(
    collection(db, path),
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("createdAt", "desc")
  );
  try {
    const snap = await getDocs(q);
    let foundDoc: MoccaDocument | null = null;
    snap.forEach((doc) => {
      if (foundDoc) return;
      const data = doc.data();
      const normalizedName = (data.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedName.includes('inpecao veicular') || normalizedName.includes('inspecao veicular')) {
        foundDoc = { id: doc.id, ...data } as MoccaDocument;
      }
    });
    return foundDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
};

// ==========================================
// ADDITIVES MODULE (CONTROL OF ADITIVOS)
// ==========================================

import { Additive, AdditiveEntry, AdditiveOutput, AdditiveApplication, AdditiveLot } from './types';

// Real-time Subscriptions

export const subscribeToAdditives = (onUpdate: (data: Additive[]) => void, onError?: (error: any) => void) => {
  const path = "additives";
  const q = query(
    collection(db, path),
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("name", "asc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Additive[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Additive);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
};

export const subscribeToAdditiveEntries = (onUpdate: (data: AdditiveEntry[]) => void, onError?: (error: any) => void) => {
  const path = "additive_entries";
  const q = query(
    collection(db, path),
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdditiveEntry[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AdditiveEntry);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
};

export const subscribeToAdditiveOutputs = (onUpdate: (data: AdditiveOutput[]) => void, onError?: (error: any) => void) => {
  const path = "additive_outputs";
  const q = query(
    collection(db, path),
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdditiveOutput[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AdditiveOutput);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
};

export const subscribeToAdditiveApplications = (onUpdate: (data: AdditiveApplication[]) => void, onError?: (error: any) => void) => {
  const path = "additive_applications";
  const q = query(
    collection(db, path),
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdditiveApplication[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AdditiveApplication);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
};

export const subscribeToAdditiveLots = (onUpdate: (data: AdditiveLot[]) => void, onError?: (error: any) => void) => {
  const path = "additive_lots";
  const q = query(
    collection(db, path),
    where("userId", "==", SHARED_TEAM_ID),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdditiveLot[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AdditiveLot);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
};

// Mutations

export const saveAdditive = async (additiveData: Omit<Additive, 'id' | 'userId' | 'createdAt'>, id?: string) => {
  const path = "additives";
  try {
    if (id) {
      const docRef = doc(db, path, id);
      await updateDoc(docRef, {
        ...additiveData,
        updatedAt: serverTimestamp()
      });
      return true;
    } else {
      const collRef = collection(db, path);
      const docRef = await addDoc(collRef, {
        ...additiveData,
        userId: SHARED_TEAM_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, path);
    return false;
  }
};

export const deleteAdditive = async (id: string) => {
  const path = "additives";
  try {
    await deleteDoc(doc(db, path, id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
};

// Generates Internal Lot Code exactly following the pattern:
// AD #L66/ADSX26 (where SX is day of week abbreviation and 26 is day of month)
export const generateAdditiveLotCode = async (dateStr: string): Promise<string> => {
  const activeBatch = await getActiveBatch();
  const batchPrefix = activeBatch ? (activeBatch.name.startsWith('#') ? activeBatch.name : `#${activeBatch.name}`) : '#L00';

  // Day of week
  const parts = dateStr.split('-');
  let dayLetter = 'S';
  let dayOfMonthStr = '01';
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    const dayMap = ['D', 'S', 'T', 'QA', 'Q', 'SX', 'SA'];
    dayLetter = dayMap[dateObj.getDay()];
    dayOfMonthStr = parts[2];
  }

  const baseCode = `AD ${batchPrefix}/AD${dayLetter}${dayOfMonthStr}`;

  // Query how many matches exist for this date
  const q = query(
    collection(db, "additive_entries"),
    where("userId", "==", SHARED_TEAM_ID),
    where("date", "==", dateStr)
  );
  
  const snap = await getDocs(q);
  const count = snap.size;
  const letter = count === 0 ? '' : String.fromCharCode(65 + count - 1); // 1 -> A, 2 -> B etc.

  return `${baseCode}${letter}`;
};

export const saveAdditiveEntry = async (entryData: Omit<AdditiveEntry, 'id' | 'userId' | 'lotInternalCode' | 'createdAt'>) => {
  const path = "additive_entries";
  try {
    const lotCode = await generateAdditiveLotCode(entryData.date);

    await runTransaction(db, async (transaction) => {
      // 1. Save entry
      const newEntryRef = doc(collection(db, "additive_entries"));
      transaction.set(newEntryRef, {
        ...entryData,
        userId: SHARED_TEAM_ID,
        lotInternalCode: lotCode,
        createdAt: serverTimestamp()
      });

      // 2. Create additive lot
      const newLotRef = doc(collection(db, "additive_lots"));
      transaction.set(newLotRef, {
        additiveId: entryData.additiveId,
        additiveName: entryData.additiveName,
        lotInternalCode: lotCode,
        initialQty: entryData.qtyReceived,
        currentStock: entryData.qtyReceived,
        unit: entryData.unit,
        expiryDate: entryData.expiryDate,
        manufacturingDate: entryData.manufacturingDate,
        manufacturerLot: entryData.manufacturerLot,
        supplier: entryData.supplier,
        userId: SHARED_TEAM_ID,
        createdAt: serverTimestamp()
      });
    });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return false;
  }
};

export const saveAdditiveOutput = async (outputData: Omit<AdditiveOutput, 'id' | 'userId' | 'createdAt'>, lotDocId: string) => {
  const path = "additive_outputs";
  try {
    await runTransaction(db, async (transaction) => {
      const lotRef = doc(db, "additive_lots", lotDocId);
      const lotSnap = await transaction.get(lotRef);

      if (!lotSnap.exists()) {
        throw new Error("Lote do aditivo não encontrado.");
      }

      const lotData = lotSnap.data() as AdditiveLot;
      if (lotData.currentStock < outputData.qty) {
        throw new Error("Saldo insuficiente no lote de aditivo.");
      }

      // Record output
      const newOutputRef = doc(collection(db, "additive_outputs"));
      transaction.set(newOutputRef, {
        ...outputData,
        userId: SHARED_TEAM_ID,
        createdAt: serverTimestamp()
      });

      // Deduct from stock
      transaction.update(lotRef, {
        currentStock: increment(-outputData.qty)
      });
    });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return false;
  }
};

export const saveAdditiveApplication = async (applicationData: Omit<AdditiveApplication, 'id' | 'userId' | 'createdAt'>, lotDocId: string) => {
  const path = "additive_applications";
  try {
    await runTransaction(db, async (transaction) => {
      const lotRef = doc(db, "additive_lots", lotDocId);
      const lotSnap = await transaction.get(lotRef);

      if (!lotSnap.exists()) {
        throw new Error("Lote do aditivo não encontrado.");
      }

      const lotData = lotSnap.data() as AdditiveLot;
      if (lotData.currentStock < applicationData.qtyApplied) {
        throw new Error("Saldo insuficiente no lote de aditivo.");
      }

      // Record application
      const newAppRef = doc(collection(db, "additive_applications"));
      transaction.set(newAppRef, {
        ...applicationData,
        userId: SHARED_TEAM_ID,
        createdAt: serverTimestamp()
      });

      // Deduct from stock
      transaction.update(lotRef, {
        currentStock: increment(-applicationData.qtyApplied)
      });
    });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return false;
  }
};


