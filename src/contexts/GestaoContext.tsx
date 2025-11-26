import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Objective, KeyResult, Initiative, Program, ProgramInitiative, ExecutionControl } from '@/types';
import { api } from '@/services/api';
import Storage from '@/utils/storage';

interface GestaoContextType {
  objectives: Objective[];
  keyResults: KeyResult[];
  initiatives: Initiative[];
  programs: Program[];
  programInitiatives: ProgramInitiative[];
  executionControls: ExecutionControl[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const GestaoContext = createContext<GestaoContextType | undefined>(undefined);

export function GestaoProvider({ children }: { children: ReactNode }) {
  // Carrega dados em cache do localStorage
  const [objectives, setObjectives] = useState<Objective[]>(() => Storage.load('gestao_objectives', []));
  const [keyResults, setKeyResults] = useState<KeyResult[]>(() => Storage.load('gestao_keyResults', []));
  const [initiatives, setInitiatives] = useState<Initiative[]>(() => Storage.load('gestao_initiatives', []));
  const [programs, setPrograms] = useState<Program[]>(() => Storage.load('gestao_programs', []));
  const [programInitiatives, setProgramInitiatives] = useState<ProgramInitiative[]>(() => Storage.load('gestao_programInitiatives', []));
  const [executionControls, setExecutionControls] = useState<ExecutionControl[]>(() => Storage.load('gestao_executionControls', []));
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [objData, krData, initData, progData, progInitData, execData] = await Promise.all([
        api.getObjectives(),
        api.getKeyResults(),
        api.getInitiatives(),
        api.getPrograms(),
        api.getProgramInitiatives(),
        api.getExecutionControls()
      ]);

      // Atualiza estados e salva em cache
      setObjectives(objData);
      setKeyResults(krData);
      setInitiatives(initData);
      setPrograms(progData);
      setProgramInitiatives(progInitData);
      setExecutionControls(execData);

      Storage.save('gestao_objectives', objData);
      Storage.save('gestao_keyResults', krData);
      Storage.save('gestao_initiatives', initData);
      Storage.save('gestao_programs', progData);
      Storage.save('gestao_programInitiatives', progInitData);
      Storage.save('gestao_executionControls', execData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <GestaoContext.Provider
      value={{
        objectives,
        keyResults,
        initiatives,
        programs,
        programInitiatives,
        executionControls,
        loading,
        refreshData
      }}
    >
      {children}
    </GestaoContext.Provider>
  );
}

export function useGestao() {
  const context = useContext(GestaoContext);
  if (context === undefined) {
    throw new Error('useGestao must be used within a GestaoProvider');
  }
  return context;
}