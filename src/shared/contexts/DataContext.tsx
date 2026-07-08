
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  subscribeToHistory, 
  subscribeToStock, 
  subscribeToColoration,
  subscribeToWheatEntries,
  subscribeToSubproductLoads,
  subscribeToLoads,
  subscribeToBatches,
  subscribeToAnalyses,
  subscribeToDrivers,
  subscribeToWeighings,
  subscribeToEntities,
  subscribeToReturns,
  subscribeToAdditives,
  subscribeToAdditiveEntries,
  subscribeToAdditiveOutputs,
  subscribeToAdditiveApplications,
  subscribeToAdditiveLots
} from '../../../firebase';
import { SavedExtraction, StockData, Bica, WheatEntry, SubproductLoad, Load, Batch, Analysis, Driver, Weighing, Entity, ReturnRecord, Additive, AdditiveEntry, AdditiveOutput, AdditiveApplication, AdditiveLot } from '../../../types';

interface DataContextType {
  history: SavedExtraction[];
  stock: StockData;
  coloration: Bica[];
  wheatEntries: WheatEntry[];
  subproductLoads: SubproductLoad[];
  loads: Load[];
  batches: Batch[];
  analyses: Analysis[];
  drivers: Driver[];
  weighings: Weighing[];
  entities: Entity[];
  returns: ReturnRecord[];
  additives: Additive[];
  additiveEntries: AdditiveEntry[];
  additiveOutputs: AdditiveOutput[];
  additiveApplications: AdditiveApplication[];
  additiveLots: AdditiveLot[];
  loadingHistory: boolean;
  loadingStock: boolean;
  loadingColoration: boolean;
  loadingWheat: boolean;
  loadingSubproducts: boolean;
  loadingLoads: boolean;
  loadingBatches: boolean;
  loadingAnalyses: boolean;
  loadingDrivers: boolean;
  loadingWeighings: boolean;
  loadingEntities: boolean;
  loadingReturns: boolean;
  loadingAdditives: boolean;
  loadingAdditiveEntries: boolean;
  loadingAdditiveOutputs: boolean;
  loadingAdditiveApplications: boolean;
  loadingAdditiveLots: boolean;
}

const DataContext = createContext<DataContextType>({
  history: [],
  stock: { common: 0, special: 0, whole: 0, glue: 0 },
  coloration: [],
  wheatEntries: [],
  subproductLoads: [],
  loads: [],
  batches: [],
  analyses: [],
  drivers: [],
  weighings: [],
  entities: [],
  returns: [],
  additives: [],
  additiveEntries: [],
  additiveOutputs: [],
  additiveApplications: [],
  additiveLots: [],
  loadingHistory: true,
  loadingStock: true,
  loadingColoration: true,
  loadingWheat: true,
  loadingSubproducts: true,
  loadingLoads: true,
  loadingBatches: true,
  loadingAnalyses: true,
  loadingDrivers: true,
  loadingWeighings: true,
  loadingEntities: true,
  loadingReturns: true,
  loadingAdditives: true,
  loadingAdditiveEntries: true,
  loadingAdditiveOutputs: true,
  loadingAdditiveApplications: true,
  loadingAdditiveLots: true,
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<SavedExtraction[]>([]);
  const [stock, setStock] = useState<StockData>({ common: 0, special: 0, whole: 0, glue: 0 });
  const [coloration, setColoration] = useState<Bica[]>([]);
  const [wheatEntries, setWheatEntries] = useState<WheatEntry[]>([]);
  const [subproductLoads, setSubproductLoads] = useState<SubproductLoad[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [weighings, setWeighings] = useState<Weighing[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [additives, setAdditives] = useState<Additive[]>([]);
  const [additiveEntries, setAdditiveEntries] = useState<AdditiveEntry[]>([]);
  const [additiveOutputs, setAdditiveOutputs] = useState<AdditiveOutput[]>([]);
  const [additiveApplications, setAdditiveApplications] = useState<AdditiveApplication[]>([]);
  const [additiveLots, setAdditiveLots] = useState<AdditiveLot[]>([]);
  
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingColoration, setLoadingColoration] = useState(true);
  const [loadingWheat, setLoadingWheat] = useState(true);
  const [loadingSubproducts, setLoadingSubproducts] = useState(true);
  const [loadingLoads, setLoadingLoads] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingWeighings, setLoadingWeighings] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [loadingAdditives, setLoadingAdditives] = useState(true);
  const [loadingAdditiveEntries, setLoadingAdditiveEntries] = useState(true);
  const [loadingAdditiveOutputs, setLoadingAdditiveOutputs] = useState(true);
  const [loadingAdditiveApplications, setLoadingAdditiveApplications] = useState(true);
  const [loadingAdditiveLots, setLoadingAdditiveLots] = useState(true);

  useEffect(() => {
    const unsubHistory = subscribeToHistory(
      (data) => {
        setHistory(data);
        setLoadingHistory(false);
      },
      (error) => {
        console.error("Falha histórico:", error);
        setLoadingHistory(false);
      }
    );

    const unsubStock = subscribeToStock(
      (data) => {
        setStock(data);
        setLoadingStock(false);
      },
      (error) => {
        console.error("Falha estoque:", error);
        setLoadingStock(false);
      }
    );

    const unsubColoration = subscribeToColoration(
      (data) => {
        setColoration(data);
        setLoadingColoration(false);
      },
      (error) => {
        console.error("Falha coloração:", error);
        setColoration([]);
        setLoadingColoration(false);
      }
    );

    const unsubWheat = subscribeToWheatEntries(
      (data) => {
        setWheatEntries(data);
        setLoadingWheat(false);
      },
      (error) => {
        console.error("Falha entradas trigo:", error);
        setLoadingWheat(false);
      }
    );

    const unsubSubproducts = subscribeToSubproductLoads(
      (data) => {
        setSubproductLoads(data);
        setLoadingSubproducts(false);
      },
      (error) => {
        console.error("Falha subprodutos:", error);
        setLoadingSubproducts(false);
      }
    );

    const unsubLoads = subscribeToLoads(
      (data) => {
        setLoads(data);
        setLoadingLoads(false);
      },
      (error) => {
        console.error("Falha cargas:", error);
        setLoadingLoads(false);
      }
    );

    const unsubBatches = subscribeToBatches(
      (data) => {
        setBatches(data);
        setLoadingBatches(false);
      },
      (error) => {
        console.error("Falha lotes:", error);
        setLoadingBatches(false);
      }
    );

    const unsubAnalyses = subscribeToAnalyses(
      (data) => {
        setAnalyses(data);
        setLoadingAnalyses(false);
      },
      (error) => {
        console.error("Falha análises:", error);
        setLoadingAnalyses(false);
      }
    );

    const unsubDrivers = subscribeToDrivers(
      (data) => {
        setDrivers(data);
        setLoadingDrivers(false);
      },
      (error) => {
        console.error("Falha motoristas:", error);
        setLoadingDrivers(false);
      }
    );

    const unsubWeighings = subscribeToWeighings(
      (data) => {
        setWeighings(data);
        setLoadingWeighings(false);
      },
      (error) => {
        console.error("Falha pesagens:", error);
        setLoadingWeighings(false);
      }
    );

    const unsubEntities = subscribeToEntities(
      (data) => {
        setEntities(data);
        setLoadingEntities(false);
      },
      (error) => {
        console.error("Falha entities:", error);
        setLoadingEntities(false);
      }
    );

    const unsubReturns = subscribeToReturns(
      (data) => {
        setReturns(data);
        setLoadingReturns(false);
      },
      (error) => {
        console.error("Falha retornos:", error);
        setLoadingReturns(false);
      }
    );

    const unsubAdditives = subscribeToAdditives(
      (data) => {
        setAdditives(data);
        setLoadingAdditives(false);
      },
      (error) => {
        console.error("Falha aditivos:", error);
        setLoadingAdditives(false);
      }
    );

    const unsubAdditiveEntries = subscribeToAdditiveEntries(
      (data) => {
        setAdditiveEntries(data);
        setLoadingAdditiveEntries(false);
      },
      (error) => {
        console.error("Falha entradas aditivos:", error);
        setLoadingAdditiveEntries(false);
      }
    );

    const unsubAdditiveOutputs = subscribeToAdditiveOutputs(
      (data) => {
        setAdditiveOutputs(data);
        setLoadingAdditiveOutputs(false);
      },
      (error) => {
        console.error("Falha saídas aditivos:", error);
        setLoadingAdditiveOutputs(false);
      }
    );

    const unsubAdditiveApplications = subscribeToAdditiveApplications(
      (data) => {
        setAdditiveApplications(data);
        setLoadingAdditiveApplications(false);
      },
      (error) => {
        console.error("Falha aplicações aditivos:", error);
        setLoadingAdditiveApplications(false);
      }
    );

    const unsubAdditiveLots = subscribeToAdditiveLots(
      (data) => {
        setAdditiveLots(data);
        setLoadingAdditiveLots(false);
      },
      (error) => {
        console.error("Falha lotes aditivos:", error);
        setLoadingAdditiveLots(false);
      }
    );

    return () => {
      unsubHistory();
      unsubStock();
      unsubColoration();
      unsubWheat();
      unsubSubproducts();
      unsubLoads();
      unsubBatches();
      unsubAnalyses();
      unsubDrivers();
      unsubWeighings();
      unsubEntities();
      unsubReturns();
      unsubAdditives();
      unsubAdditiveEntries();
      unsubAdditiveOutputs();
      unsubAdditiveApplications();
      unsubAdditiveLots();
    };
  }, []);

  return (
    <DataContext.Provider value={{ 
      history, 
      stock, 
      coloration,
      wheatEntries,
      subproductLoads,
      loads,
      batches,
      analyses,
      drivers,
      weighings,
      entities,
      returns,
      additives,
      additiveEntries,
      additiveOutputs,
      additiveApplications,
      additiveLots,
      loadingHistory, 
      loadingStock, 
      loadingColoration, 
      loadingWheat,
      loadingSubproducts,
      loadingLoads,
      loadingBatches,
      loadingAnalyses,
      loadingDrivers,
      loadingWeighings,
      loadingEntities,
      loadingReturns,
      loadingAdditives,
      loadingAdditiveEntries,
      loadingAdditiveOutputs,
      loadingAdditiveApplications,
      loadingAdditiveLots
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
