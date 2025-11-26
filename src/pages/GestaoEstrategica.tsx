import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DirectorateSelector } from '@/components/gestao/DirectorateSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisaoGeral } from '@/components/gestao/VisaoGeral';
import { MonitoramentoOKRs } from '@/components/gestao/MonitoramentoOKRs';
import { ControleExecucao } from '@/components/gestao/ControleExecucao';
import { SprintAtual } from '@/components/gestao/SprintAtual';

export default function GestaoEstrategica() {
  const [activeTab, setActiveTab] = useState('visao-geral');

  return (
    <Layout>
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Gestão Estratégica</h1>
          <p className="text-sm lg:text-base text-white/80 mt-2">
            Acompanhamento de objetivos, KRs e iniciativas estratégicas
          </p>
        </div>

        {/* Seletor de Diretoria */}
        <DirectorateSelector />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="visao-geral" className="text-xs lg:text-sm py-2">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="monitoramento" className="text-xs lg:text-sm py-2">
              Monitoramento de OKRs
            </TabsTrigger>
            <TabsTrigger value="controle-execucao" className="text-xs lg:text-sm py-2">
              Controle de Execução
            </TabsTrigger>
            <TabsTrigger value="sprint-atual" className="text-xs lg:text-sm py-2">
              Sprint Atual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="space-y-4 lg:space-y-6">
            <VisaoGeral />
          </TabsContent>

          <TabsContent value="monitoramento" className="space-y-4 lg:space-y-6">
            <MonitoramentoOKRs />
          </TabsContent>

          <TabsContent value="controle-execucao" className="space-y-4 lg:space-y-6">
            <ControleExecucao />
          </TabsContent>

          <TabsContent value="sprint-atual" className="space-y-4 lg:space-y-6">
            <SprintAtual />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}