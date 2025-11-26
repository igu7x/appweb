import { User, Objective, KeyResult, Initiative, Program, ProgramInitiative, ExecutionControl, Directorate, OKRStatus, OKRSituation } from '@/types';
import Storage from '@/utils/storage';

// ============================================================
// PERSISTÊNCIA DE DADOS COM LOCALSTORAGE
// ============================================================
// Todos os dados são armazenados e recuperados do localStorage
// para garantir persistência entre reloads e restarts do servidor

// Helper para hash de senha (SHA-256)
async function hashPassword(password: string): Promise<string> {
  // Garantia para a senha padrão funcionar sempre, independente do ambiente
  if (password === 'senha123') {
    return DEFAULT_PASS_HASH;
  }

  // Fallback para ambientes onde crypto.subtle não está disponível (ex: contextos não seguros)
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    console.warn('Crypto API indisponível. Usando fallback simples (btoa).');
    return btoa(password);
  }

  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash SHA-256 de "senha123"
const DEFAULT_PASS_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

// Dados iniciais que serão usados apenas na primeira vez
const initialUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@tjgo.jus.br',
    role: 'ADMIN',
    status: 'ACTIVE',
    password: DEFAULT_PASS_HASH
  },
  {
    id: '2',
    name: 'Gestor User',
    email: 'gestor@tjgo.jus.br',
    role: 'MANAGER',
    status: 'ACTIVE',
    password: DEFAULT_PASS_HASH
  },
  {
    id: '3',
    name: 'Visualizador User',
    email: 'viewer@tjgo.jus.br',
    role: 'VIEWER',
    status: 'ACTIVE',
    password: DEFAULT_PASS_HASH
  }
];

// Helper para calcular situação
function calculateSituation(status: OKRStatus, deadline: string): OKRSituation {
  // REGRA A: Se Concluído, sempre Finalizado
  if (status === 'CONCLUIDO') {
    return 'FINALIZADO';
  }

  if (!deadline) return 'NO_PRAZO';

  try {
    const now = new Date();
    // Zerar horas para comparação apenas de data
    now.setHours(0, 0, 0, 0);

    let deadlineDate: Date | null = null;

    // Tentar identificar formato MM/AAAA (ex: 11/2025)
    const mmYyyyMatch = deadline.match(/(\d{1,2})\/(\d{4})/);

    // Tentar identificar formato DD/MM/AAAA (ex: 15/11/2025)
    const ddMmYyyyMatch = deadline.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

    // Tentar identificar nomes de meses (ex: julho - 2025)
    const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const monthShortNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    let monthNameMatch = -1;
    let yearMatch = 0;

    if (ddMmYyyyMatch) {
      const day = parseInt(ddMmYyyyMatch[1]);
      const month = parseInt(ddMmYyyyMatch[2]) - 1;
      const year = parseInt(ddMmYyyyMatch[3]);
      deadlineDate = new Date(year, month, day);
    } else if (mmYyyyMatch) {
      // Se for MM/AAAA, considerar último dia do mês
      const month = parseInt(mmYyyyMatch[1]) - 1;
      const year = parseInt(mmYyyyMatch[2]);
      deadlineDate = new Date(year, month + 1, 0); // Último dia do mês
    } else {
      // Tentar encontrar mês e ano no texto
      const lowerDeadline = deadline.toLowerCase();

      // Procurar ano (4 dígitos)
      const years = lowerDeadline.match(/\d{4}/g);
      if (years && years.length > 0) {
        // Pegar o último ano mencionado (para casos de intervalos "2025 a 2026")
        yearMatch = parseInt(years[years.length - 1]);

        // Procurar mês
        for (let i = 0; i < 12; i++) {
          if (lowerDeadline.includes(monthNames[i]) || lowerDeadline.includes(monthShortNames[i])) {
            monthNameMatch = i;
          }
        }

        if (monthNameMatch !== -1) {
          deadlineDate = new Date(yearMatch, monthNameMatch + 1, 0);
        }
      }
    }

    if (deadlineDate) {
      // Se data do prazo for menor que hoje, está em atraso
      return deadlineDate < now ? 'EM_ATRASO' : 'NO_PRAZO';
    }
  } catch (e) {
    console.warn('Erro ao analisar data:', deadline);
  }

  // Fallback padrão
  return 'NO_PRAZO';
}

// Carregar dados do localStorage ou usar dados iniciais
let users: User[] = Storage.load('api_users', initialUsers);

let initialObjectives: Objective[] = [
  {
    id: 'sgjt-obj-1',
    code: 'Objetivo 1',
    title: 'Orquestrar a Integração Estratégica entre áreas Judiciárias e Tecnológicas, potencializando a entrega de valor sob usuários do PJGO.',
    description: 'Orquestrar a Integração Estratégica entre áreas Judiciárias e Tecnológicas, potencializando a entrega de valor sob usuários do PJGO.',
    directorate: 'SGJT'
  },
  {
    id: 'sgjt-obj-2',
    code: 'Objetivo 2',
    title: 'Desenvolver Pessoas e Ampliar a Capacidade de TI.',
    description: 'Desenvolver Pessoas e Ampliar a Capacidade de TI.',
    directorate: 'SGJT'
  },
  {
    id: 'sgjt-obj-3',
    code: 'Objetivo 3',
    title: 'Modernizar Serviços de TI e Estrutura Organizacional.',
    description: 'Modernizar Serviços de TI e Estrutura Organizacional.',
    directorate: 'SGJT'
  },
  {
    id: 'sgjt-obj-4',
    code: 'Objetivo 4',
    title: 'Consolidar Governança de Desempenho (OKR e Dados).',
    description: 'Consolidar Governança de Desempenho (OKR e Dados).',
    directorate: 'SGJT'
  },
  {
    id: 'sgjt-obj-5',
    code: 'Objetivo 5',
    title: 'Implantar Gestão por Processos e Cultura de Melhoria Contínua no âmbito da Secretaria de Governança Judiciária e Tecnológica.',
    description: 'Implantar Gestão por Processos e Cultura de Melhoria Contínua no âmbito da Secretaria de Governança Judiciária e Tecnológica.',
    directorate: 'SGJT'
  },
  {
    id: 'sgjt-obj-6',
    code: 'Objetivo 6 Técnico',
    title: 'Legado e Continuidade: nov/2026 → jan/2027',
    description: 'Legado e Continuidade: nov/2026 → jan/2027',
    directorate: 'SGJT'
  },
  // Objetivos - DPE
  {
    id: 'dpe-obj-1',
    code: 'Objetivo 1',
    title: 'Escalar a atuação das Centrais da DPE para todas as comarcas do interior.',
    description: 'Escalar a atuação das Centrais da DPE para todas as comarcas do interior.',
    directorate: 'DPE'
  },
  {
    id: 'dpe-obj-2',
    code: 'Objetivo 2',
    title: 'Consolidar a gestão por processos e a cultura de melhoria contínua.',
    description: 'Consolidar a gestão por processos e a cultura de melhoria contínua.',
    directorate: 'DPE'
  },
  {
    id: 'dpe-obj-3',
    code: 'Objetivo 3',
    title: 'or competências na DPE, formando líderes e cultivando feedback e colabor',
    description: 'or competências na DPE, formando líderes e cultivando feedback e colabor',
    directorate: 'DPE'
  },
  {
    id: 'dpe-obj-4',
    code: 'Objetivo 4',
    title: 'Consolidar a governança de desempenho (OKR e Dados).',
    description: 'Consolidar a governança de desempenho (OKR e Dados).',
    directorate: 'DPE'
  },
  {
    id: 'dpe-obj-5',
    code: 'Objetivo 5',
    title: 'Avançar tecnologia e automação.',
    description: 'Avançar tecnologia e automação.',
    directorate: 'DPE'
  },
  // Objetivos - DIJUD
  {
    id: 'dijud-obj-1',
    code: 'Objetivo 1',
    title: 'Consolidar o modelo de atuação integrada da Diretoria Judiciária, fortalecendo',
    description: 'Consolidar o modelo de atuação integrada da Diretoria Judiciária, fortalecendo',
    directorate: 'DIJUD'
  },
  {
    id: 'dijud-obj-2',
    code: 'Objetivo 2',
    title: 'Consolidar a gestão por competências na DJUD, formando líderes, implantando',
    description: 'Consolidar a gestão por competências na DJUD, formando líderes, implantando',
    directorate: 'DIJUD'
  },
  {
    id: 'dijud-obj-3',
    code: 'Objetivo 3',
    title: 'Estruturar e expandir o uso de tecnologia e automação.',
    description: 'Estruturar e expandir o uso de tecnologia e automação.',
    directorate: 'DIJUD'
  },
  {
    id: 'dijud-obj-4',
    code: 'Objetivo 4',
    title: 'Consolidar a governança de desempenho (OKR e Dados).',
    description: 'Consolidar a governança de desempenho (OKR e Dados).',
    directorate: 'DIJUD'
  },
  {
    id: 'dijud-obj-5',
    code: 'Objetivo 5',
    title: 'Implementar gestão por processos e melhoria contínua.',
    description: 'Implementar gestão por processos e melhoria contínua.',
    directorate: 'DIJUD'
  },
  // Objetivos - DTI
  {
    id: 'dti-obj-1',
    code: 'Objetivo 1',
    title: 'Consolidar os projetos estratégicos da DTI no ciclo 2025/2027, garantindo',
    description: 'Consolidar os projetos estratégicos da DTI no ciclo 2025/2027, garantindo',
    directorate: 'DTI'
  },
  {
    id: 'dti-obj-2',
    code: 'Objetivo 2',
    title: 'Consolidar a gestão por competências na DTI, formando líderes, promovendo',
    description: 'Consolidar a gestão por competências na DTI, formando líderes, promovendo',
    directorate: 'DTI'
  },
  {
    id: 'dti-obj-3',
    code: 'Objetivo 3',
    title: 'Estruturar e implantar o ecossistema integrado de gestão de serviços, ativ',
    description: 'Estruturar e implantar o ecossistema integrado de gestão de serviços, ativ',
    directorate: 'DTI'
  },
  {
    id: 'dti-obj-4',
    code: 'Objetivo 4',
    title: 'Consolidar a governança de desempenho (OKR e Dados).',
    description: 'Consolidar a governança de desempenho (OKR e Dados).',
    directorate: 'DTI'
  },
  {
    id: 'dti-obj-5',
    code: 'Objetivo 5',
    title: 'Implementar gestão por processos e melhoria contínua.',
    description: 'Implementar gestão por processos e melhoria contínua.',
    directorate: 'DTI'
  },
  // Objetivos - DSTI
  {
    id: 'dsti-obj-1',
    code: 'Objetivo 1',
    title: 'Implementar o Portfólio Estratégico de Soluções (PES) como agenda prioritária',
    description: 'Implementar o Portfólio Estratégico de Soluções (PES) como agenda prioritária',
    directorate: 'DSTI'
  },
  {
    id: 'dsti-obj-2',
    code: 'Objetivo 2',
    title: 'Consolidar a gestão por competências na DSTI, formando líderes, promovendo',
    description: 'Consolidar a gestão por competências na DSTI, formando líderes, promovendo',
    directorate: 'DSTI'
  },
  {
    id: 'dsti-obj-3',
    code: 'Objetivo 3',
    title: 'Estruturar e operar, no âmbito da DSTI, a Estratégia de Armazenamento',
    description: 'Estruturar e operar, no âmbito da DSTI, a Estratégia de Armazenamento',
    directorate: 'DSTI'
  },
  {
    id: 'dsti-obj-4',
    code: 'Objetivo 4',
    title: 'Consolidar a governança de desempenho (OKR e Dados).',
    description: 'Consolidar a governança de desempenho (OKR e Dados).',
    directorate: 'DSTI'
  },
  {
    id: 'dsti-obj-5',
    code: 'Objetivo 5',
    title: 'Estruturar e operar o Processo de Gestão de Demandas por Soluções Tecnológicas',
    description: 'Estruturar e operar o Processo de Gestão de Demandas por Soluções Tecnológicas',
    directorate: 'DSTI'
  }
];

// Carregar objetivos do Storage
let objectives: Objective[] = Storage.load('api_objectives', initialObjectives);

let initialKeyResults: KeyResult[] = [
  // Objetivo 1 - SGJT
  { id: 'sgjt-kr1.1', objectiveId: 'sgjt-obj-1', code: 'KR 1.1', description: 'Diretrizes e atos de institucionalização dos Programas Sinergia TECJUD, ConectJOTI e ConectatJUT formalizados.', status: 'CONCLUIDO', situation: 'FINALIZADO', deadline: 'fev/2025 a jul/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr1.2', objectiveId: 'sgjt-obj-1', code: 'KR 1.2', description: 'Carteira de 9 iniciativas priorizadas (3 por programa) com responsáveis designados.', status: 'EM_ANDAMENTO', situation: 'EM_ATRASO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr1.3', objectiveId: 'sgjt-obj-1', code: 'KR 1.3', description: 'Pelo menos 6 iniciativas (2 por programa) lançadas e gerando dados de uso.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr1.4', objectiveId: 'sgjt-obj-1', code: 'KR 1.4', description: 'Pelo menos 12 iniciativas operacionais e documentadas, com lições aprendidas consolidadas.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jun/2026 a out/2026', directorate: 'SGJT' },

  // Objetivo 2 - SGJT
  { id: 'sgjt-kr2.1', objectiveId: 'sgjt-obj-2', code: 'KR 2.1', description: 'Formalização e aprovação do Projeto Gestão por Competências - SGIT, com cronograma.', status: 'CONCLUIDO', situation: 'FINALIZADO', deadline: 'dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr2.2', objectiveId: 'sgjt-obj-2', code: 'KR 2.2', description: 'Matriz de competências publicada e Plano Anual de Capacitação 2026 elaborados.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr2.3', objectiveId: 'sgjt-obj-2', code: 'KR 2.3', description: 'Ciclo de Formação de Gestores construído e pelo menos 25 Servidores matriculados.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr2.4', objectiveId: 'sgjt-obj-2', code: 'KR 2.4', description: 'Conversão de cargos aprovada; primeira nomeação do cadastro de reserva de TI.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jan/2026 a mai/2026', directorate: 'SGJT' },
  { id: 'sgjt-kr2.5', objectiveId: 'sgjt-obj-2', code: 'KR 2.5', description: '80% dos servidores das quatro diretorias com Plano de Desenvolvimento Individual ativo e cumprimento de pelo menos 80% das 1258 hs de capacitação registradas em painel de monitoramento.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jun/2026 a out/2026', directorate: 'SGJT' },

  // Objetivo 3 - SGJT
  { id: 'sgjt-kr3.1', objectiveId: 'sgjt-obj-3', code: 'KR 3.1', description: 'Estudo técnico realizado com proposta de reorganização das diretorias de TI, incluindo análise de reestruturação de cargos e regimento interno operacional.', status: 'NAO_INICIADO', situation: 'EM_ATRASO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr3.2', objectiveId: 'sgjt-obj-3', code: 'KR 3.2', description: 'Gestão de serviços e ativos aplicada conforme ITIL v4: ITSM e Gestão de Ativos funcionais, com documentação integrada a Plano de Trabalho para implementação formalizado.', status: 'NAO_INICIADO', situation: 'EM_ATRASO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr3.3', objectiveId: 'sgjt-obj-3', code: 'KR 3.3', description: 'ITSM e ITAM operacionais no catálogo EDTI em produtividade, SPOCs ativo como ponto único de contato com serviços priorizados; fluxos básicos de atendimento e solicitações em produção; inventário inicial com base de relacionamento de ativos; padrões mínimos de estrutura, processo e indicadores publicados.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jan/2026 a mai/2026', directorate: 'SGJT' },
  { id: 'sgjt-kr3.4', objectiveId: 'sgjt-obj-3', code: 'KR 3.4', description: 'Ecossistema no sistema Log único de log com integração inicial de monitoramento e tracing de sistemas críticos divulgados; processos de ciclo de vida de ativos estabelecidos; integrações em operação e cronograma de evolução validado.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jun/2026 a out/2026', directorate: 'SGJT' },
  { id: 'sgjt-kr3.5', objectiveId: 'sgjt-obj-3', code: 'KR 3.5', description: 'SLAs e indicadores de serviços e ativos padronizados institucionalmente, com cobertura ampliada, qualidade de dados auditada e relatórios executivos claros de melhoria contínua aprovado para o ciclo seguinte.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jun/2026 a out/2026', directorate: 'SGJT' },

  // Objetivo 4 - SGJT
  { id: 'sgjt-kr4.1', objectiveId: 'sgjt-obj-4', code: 'KR 4.1', description: 'Planos de Coordenadorias elaborados: criação de agenda estratégica, objetivos e diretrizes definidos, com objetivos viés à governança de acompanhamento definidos.', status: 'CONCLUIDO', situation: 'FINALIZADO', deadline: 'fev/2025 a jul/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr4.2', objectiveId: 'sgjt-obj-4', code: 'KR 4.2', description: 'As quatro diretorias com padrão de gestão, com processos essenciais de forma colaborativa, validadas pela SGIT e alinhadas à metodologia OKR e à cultura de dados.', status: 'NAO_INICIADO', situation: 'EM_ATRASO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr4.3', objectiveId: 'sgjt-obj-4', code: 'KR 4.3', description: 'Painel on-line da SGIT publicado, com foco no acompanhamento de ecosistema de estratégia, abrangendo o Plano de Gestão detalhado dos programas estruturantes e eixos de institucionalização de equipamento, com atualização semanal.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr4.4', objectiveId: 'sgjt-obj-4', code: 'KR 4.4', description: 'Diretrizes da coordenação de Legado e Continuidade para 2026 definida, que integra os planos de acordo com metodologia OKR e a cultura de dados dos seus planos, com revisão trimestral.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jan/2026 a mai/2026', directorate: 'SGJT' },

  // Objetivo 5 - SGJT
  { id: 'sgjt-kr5.1', objectiveId: 'sgjt-obj-5', code: 'KR 5.1', description: 'Plano de Melhoria Contínua por processos e Cultura de Melhor contínua definido, com controle de atuação sistêmica, resultados e abordagem de acompanhamento estabelecidos.', status: 'NAO_INICIADO', situation: 'EM_ATRASO', deadline: 'ago/2025 a dez/2025', directorate: 'SGJT' },
  { id: 'sgjt-kr5.2', objectiveId: 'sgjt-obj-5', code: 'KR 5.2', description: 'Execução iniciada: diagnóstico dos processos já executado em nível de maturidade concluído, e publicação do primeiro instrumento prático, mapeamento de acessos e dados, com controle de acompanhamento dos processos.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jan/2026 a mai/2026', directorate: 'SGJT' },
  { id: 'sgjt-kr5.3', objectiveId: 'sgjt-obj-5', code: 'KR 5.3', description: 'Quatro processos piloto, um por diretoria, mapeados e modelados com indicadores básicos em operação, Painel de monitoramento de eficiência publicado, com controle de aumento de rota de melhoria operacional promovido.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jan/2026 a mai/2026', directorate: 'SGJT' },
  { id: 'sgjt-kr5.4', objectiveId: 'sgjt-obj-5', code: 'KR 5.4', description: 'Consolidação inicial da cultura de melhoria contínua: Painel de Governança evolutivo, carteira inicial de processos em ciclos de melhoria e cronograma pactuado para expansão TI e demais estruturas.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'jun/2026 a out/2026', directorate: 'SGJT' },

  // Objetivo 6 - SGJT
  { id: 'sgjt-kr6.1', objectiveId: 'sgjt-obj-6', code: 'KR L.1', description: 'Relatório de Transição consolidado resultados e recomendações.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'nov/26 a jan/2027', directorate: 'SGJT' },
  { id: 'sgjt-kr6.2', objectiveId: 'sgjt-obj-6', code: 'KR L.2', description: 'Workshop de conhecimento para nova gestão com 100% dos líderes.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'nov/26 a jan/2027', directorate: 'SGJT' },
  { id: 'sgjt-kr6.3', objectiveId: 'sgjt-obj-6', code: 'KR L.3', description: 'Relatório de lições aprendidas e checklist 2027-2028 entregue à próxima gestão.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: 'nov/26 a jan/2027', directorate: 'SGJT' },

  // Objetivos DPE
  // Objetivo 1
  { id: 'dpe-kr1.1', objectiveId: 'dpe-obj-1', code: 'KR 1.1', description: 'Articular com a SGIT a aprovação de ato da Presidência que autorize a adesão de todas as comarcas à', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DPE' },
  { id: 'dpe-kr1.2', objectiveId: 'dpe-obj-1', code: 'KR 1.2', description: 'Publicar o Cronograma Integrado de Interiorização — abrangendo cada uma das centrais — com map', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '12/2026', directorate: 'DPE' },
  { id: 'dpe-kr1.3', objectiveId: 'dpe-obj-1', code: 'KR 1.3', description: 'Desenvolver e implementar o Modelo de Expansão por Volume de Serviço, aplicável quando cada cen', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '08/2026', directorate: 'DPE' },
  { id: 'dpe-kr1.4', objectiveId: 'dpe-obj-1', code: 'KR 1.4', description: 'Concluir expansão das centrais da DPE para todas as comarcas do interior.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '12/2026', directorate: 'DPE' },

  // Objetivo 2
  { id: 'dpe-kr2.1', objectiveId: 'dpe-obj-2', code: 'KR 2.1', description: 'Publicar a Diretriz de Processos da DPE, estabelecendo Modelo Padrão de Serviço (MPS) — composto', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DPE' },
  { id: 'dpe-kr2.2', objectiveId: 'dpe-obj-2', code: 'KR 2.2', description: 'Publicar MPS de cada serviço das centrais —com adoção obrigatória em toda nova atuação de comar', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DPE' },
  { id: 'dpe-kr2.3', objectiveId: 'dpe-obj-2', code: 'KR 2.3', description: 'Implementar o critério"Pronto para Tecnologia": somente ingressam na esteira de TI demandas de au', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '04/2026', directorate: 'DPE' },
  { id: 'dpe-kr2.4', objectiveId: 'dpe-obj-2', code: 'KR 2.4', description: 'Identificar e modelar pelo menos 2 novos serviços da DPE para apoio às comarcas, a partir de diagnól', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '07/2026', directorate: 'DPE' },
  { id: 'dpe-kr2.5', objectiveId: 'dpe-obj-2', code: 'KR 2.5', description: 'Implementar o "DPE Day " como evento institucional de reconhecimento, integração e intercâmbio di', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '03/2026', directorate: 'DPE' },

  // Objetivo 3
  { id: 'dpe-kr3.1', objectiveId: 'dpe-obj-3', code: 'KR 3.1', description: 'Executar, no âmbito da DPE, as ações do Projeto de Gestão por Competências da SGIT: definir o refer', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DPE' },
  { id: 'dpe-kr3.2', objectiveId: 'dpe-obj-3', code: 'KR 3.2', description: 'Assegurar a participação da DPE no Curso de Formação de Gestores da SGIT, organizar iniciativas com', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DPE' },
  { id: 'dpe-kr3.3', objectiveId: 'dpe-obj-3', code: 'KR 3.3', description: 'Elaborar PDI para 100% do corpo funcional da DPE com base no diagnóstico de competências e valida', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DPE' },
  { id: 'dpe-kr3.4', objectiveId: 'dpe-obj-3', code: 'KR 3.4', description: 'Implantar cultura de feedback e colaboração: 1:1 trimestral entre líderes e liderados e agenda de boa', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '06/2026', directorate: 'DPE' },
  { id: 'dpe-kr3.5', objectiveId: 'dpe-obj-3', code: 'KR 3.5', description: 'Sensibilizar todas as Centrais quanto à cultura de qualidade, promovendo capacitações.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '12/2026', directorate: 'DPE' },

  // Objetivo 4
  { id: 'dpe-kr4.1', objectiveId: 'dpe-obj-4', code: 'KR 4.1', description: 'Planos de Gestão da DPE elaborado, validados pela SGIT e alinhados à metodologia OKR e à cultura d', status: 'CONCLUIDO', situation: 'FINALIZADO', deadline: '10/2025', directorate: 'DPE' },
  { id: 'dpe-kr4.2', objectiveId: 'dpe-obj-4', code: 'KR 4.2', description: 'Painel de acompanhamento do ecossistema de estratégia da DPE publicado.', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DPE' },
  { id: 'dpe-kr4.3', objectiveId: 'dpe-obj-4', code: 'KR 4.3', description: 'Instituir ciclo de monitoramento e ajuste estratégico: check-ins mensais dos OKRs e revisões trimestrn', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DPE' },
  { id: 'dpe-kr4.4', objectiveId: 'dpe-obj-4', code: 'KR 4.4', description: 'Preparar o ciclo estratégico 2027–2029: consolidar e publicar o Dossiê de Gestão 2025–2027 da DPE (', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2026', directorate: 'DPE' },
  { id: 'dpe-kr4.5', objectiveId: 'dpe-obj-4', code: 'KR 4.5', description: 'Cada Central/unidade deverá elaborar seu Plano Operacional validado pela DPE, assegurando coerên', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '06/2026', directorate: 'DPE' },

  // Objetivo 5
  { id: 'dpe-kr5.1', objectiveId: 'dpe-obj-5', code: 'KR 5.1', description: 'Realizar o diagnóstico técnico-operacional do Sistema Operacionalizar pelo Núcleo de Automação, identi', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '12/2025', directorate: 'DPE' },
  { id: 'dpe-kr5.2', objectiveId: 'dpe-obj-5', code: 'KR 5.2', description: 'Executar o Plano de Governança: Aprimoramento em gestão de acessos, monitoramento/ logs, SLOs ı', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DPE' },
  { id: 'dpe-kr5.3', objectiveId: 'dpe-obj-5', code: 'KR 5.3', description: 'Operar a Esteira DPE de Automação e Desenvolvimento, alinhada ao "Pronto para Tecnologia" (KR 2.3', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DPE' },
  { id: 'dpe-kr5.4', objectiveId: 'dpe-obj-5', code: 'KR 5.4', description: 'Aprimorar o Sistema de Plantão Judicial, padronizando fluxos, possibilitando automação de escalas e', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '09/2026', directorate: 'DPE' },

  // Objetivos DIJUD
  // Objetivo 1
  { id: 'dijud-kr1.1', objectiveId: 'dijud-obj-1', code: 'KR 1.1', description: 'Elaborar, aprovar e publicar o Plano de Entregas P', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DIJUD' },
  { id: 'dijud-kr1.2', objectiveId: 'dijud-obj-1', code: 'KR 1.2', description: 'Estruturar as iniciativas de cada frente de entrega', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr1.3', objectiveId: 'dijud-obj-1', code: 'KR 1.3', description: 'Executar, sob acompanhamento periódico, pelo m', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr1.4', objectiveId: 'dijud-obj-1', code: 'KR 1.4', description: 'Concluir integralmente as cinco frentes de entreg', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '12/2026', directorate: 'DIJUD' },

  // Objetivo 2
  { id: 'dijud-kr2.1', objectiveId: 'dijud-obj-2', code: 'KR 2.1', description: 'Executar, no âmbito da DJUD, as ações do Projet', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DIJUD' },
  { id: 'dijud-kr2.2', objectiveId: 'dijud-obj-2', code: 'KR 2.2', description: 'Assegurar a participação da DJUD no Curso de Fo', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr2.3', objectiveId: 'dijud-obj-2', code: 'KR 2.3', description: 'Elaborar PDIs para 100% dos servidores da DJUD', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr2.4', objectiveId: 'dijud-obj-2', code: 'KR 2.4', description: 'Implantar cultura de feedback e colaboração: 1:1', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '06/2026', directorate: 'DIJUD' },

  // Objetivo 3
  { id: 'dijud-kr3.1', objectiveId: 'dijud-obj-3', code: 'KR 3.1', description: 'Mapear todas as automações e soluções digitais já', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr3.2', objectiveId: 'dijud-obj-3', code: 'KR 3.2', description: 'Implantar a base do Sistema Orquestrador da DJU', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '04/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr3.3', objectiveId: 'dijud-obj-3', code: 'KR 3.3', description: 'Ampliar a centralização das automações, integran', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '08/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr3.4', objectiveId: 'dijud-obj-3', code: 'KR 3.4', description: 'Concluir a integração de 100% do Catálogo de Sol', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '12/2026', directorate: 'DIJUD' },

  // Objetivo 4
  { id: 'dijud-kr4.1', objectiveId: 'dijud-obj-4', code: 'KR 4.1', description: 'Planos de Gestão da DJUD elaborado, validados p', status: 'NAO_INICIADO', situation: 'EM_ATRASO', deadline: '10/2025', directorate: 'DIJUD' },
  { id: 'dijud-kr4.2', objectiveId: 'dijud-obj-4', code: 'KR 4.2', description: 'Painel de acompanhamento do ecossistema de es', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr4.3', objectiveId: 'dijud-obj-4', code: 'KR 4.3', description: 'Instituir ciclo de monitoramento e ajuste estraté', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr4.4', objectiveId: 'dijud-obj-4', code: 'KR 4.4', description: 'Preparar o ciclo estratégico 2027–2029: consolida', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2026', directorate: 'DIJUD' },

  // Objetivo 5
  { id: 'dijud-kr5.1', objectiveId: 'dijud-obj-5', code: 'KR 5.1', description: 'Concluir o levantamento inicial de ao menos 10 p', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr5.2', objectiveId: 'dijud-obj-5', code: 'KR 5.2', description: 'Definir e formalizar o Modelo Padrão de Gestão p', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr5.3', objectiveId: 'dijud-obj-5', code: 'KR 5.3', description: 'Ampliar o Catálogo de Processos da DJUD com m', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DIJUD' },
  { id: 'dijud-kr5.4', objectiveId: 'dijud-obj-5', code: 'KR 5.4', description: 'Dar continuidade à ampliação do Catálogo de Pro', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '09/2026', directorate: 'DIJUD' },

  // Objetivos DTI
  // Objetivo 1
  { id: 'dti-kr1.1', objectiveId: 'dti-obj-1', code: 'KR 1.1', description: 'Elaborar o Plano de Entregas Prioritárias - PEP com', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DTI' },
  { id: 'dti-kr1.2', objectiveId: 'dti-obj-1', code: 'KR 1.2', description: 'Iniciar a execução dos quatro projetos estratégico', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '04/2026', directorate: 'DTI' },
  { id: 'dti-kr1.3', objectiveId: 'dti-obj-1', code: 'KR 1.3', description: 'Alcançar 60% da execução global dos projetos do', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '08/2026', directorate: 'DTI' },
  { id: 'dti-kr1.4', objectiveId: 'dti-obj-1', code: 'KR 1.4', description: 'Concluir 90% do escopo do PEP e apresentar à pré', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2026', directorate: 'DTI' },

  // Objetivo 2
  { id: 'dti-kr2.1', objectiveId: 'dti-obj-2', code: 'KR 2.1', description: 'Executar, no âmbito da DTI, as ações do Projeto d', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DTI' },
  { id: 'dti-kr2.2', objectiveId: 'dti-obj-2', code: 'KR 2.2', description: 'Assegurar a participação da DTI no Curso de Form', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DTI' },
  { id: 'dti-kr2.3', objectiveId: 'dti-obj-2', code: 'KR 2.3', description: 'Elaborar PDI para 100% dos servidores da DTI con', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DTI' },
  { id: 'dti-kr2.4', objectiveId: 'dti-obj-2', code: 'KR 2.4', description: 'Implementar cultura de feedback e colaboração: p', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '07/2026', directorate: 'DTI' },

  // Objetivo 3
  { id: 'dti-kr3.1', objectiveId: 'dti-obj-3', code: 'KR 3.1', description: 'Elaborar o Plano de Implementação do Ecossistem', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DTI' },
  { id: 'dti-kr3.2', objectiveId: 'dti-obj-3', code: 'KR 3.2', description: 'ITSM e ITAM operacionais no sistema GLPI em vers', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '03/2026', directorate: 'DTI' },
  { id: 'dti-kr3.3', objectiveId: 'dti-obj-3', code: 'KR 3.3', description: 'Ecossistema GLPI ampliado: SPOCs consolidado e c', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '07/2026', directorate: 'DTI' },
  { id: 'dti-kr3.4', objectiveId: 'dti-obj-3', code: 'KR 3.4', description: 'Implementar módulos de Gestão do Conhecim', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '09/2026', directorate: 'DTI' },

  // Objetivo 4
  { id: 'dti-kr4.1', objectiveId: 'dti-obj-4', code: 'KR 4.1', description: 'Planos de Gestão da DTI elaborado, validados pela', status: 'NAO_INICIADO', situation: 'EM_ATRASO', deadline: '10/2025', directorate: 'DTI' },
  { id: 'dti-kr4.2', objectiveId: 'dti-obj-4', code: 'KR 4.2', description: 'Painel de acompanhamento do ecossistema de es', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DTI' },
  { id: 'dti-kr4.3', objectiveId: 'dti-obj-4', code: 'KR 4.3', description: 'Instituir ciclo de monitoramento e ajuste estratég', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DTI' },
  { id: 'dti-kr4.4', objectiveId: 'dti-obj-4', code: 'KR 4.4', description: 'Preparar o ciclo estratégico 2027–2029: consolida', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2026', directorate: 'DTI' },

  // Objetivo 5
  { id: 'dti-kr5.1', objectiveId: 'dti-obj-5', code: 'KR 5.1', description: 'Elaborar o Catálogo de Processos da DTI, com pelo', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DTI' },
  { id: 'dti-kr5.2', objectiveId: 'dti-obj-5', code: 'KR 5.2', description: 'Elaborar e submeter à apreciação das instâncias c', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DTI' },
  { id: 'dti-kr5.3', objectiveId: 'dti-obj-5', code: 'KR 5.3', description: 'Ampliar o Catálogo de Processos da DTI, incorpor', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DTI' },
  { id: 'dti-kr5.4', objectiveId: 'dti-obj-5', code: 'KR 5.4', description: 'Dar continuidade à ampliação do Catálogo e ativa', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '09/2026', directorate: 'DTI' },

  // Objetivos DSTI
  // Objetivo 1
  { id: 'dsti-kr1.1', objectiveId: 'dsti-obj-1', code: 'KR 1.1', description: 'Institucionalizar o Portfólio Estratégico de Soluçõ', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DSTI' },
  { id: 'dsti-kr1.2', objectiveId: 'dsti-obj-1', code: 'KR 1.2', description: 'Alcançar pelo menos 35% do escopo aprovado pa', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DSTI' },
  { id: 'dsti-kr1.3', objectiveId: 'dsti-obj-1', code: 'KR 1.3', description: 'Alcançar pelo menos 70% do escopo aprovado pa', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '08/2026', directorate: 'DSTI' },
  { id: 'dsti-kr1.4', objectiveId: 'dsti-obj-1', code: 'KR 1.4', description: 'Alcançar pelo menos 90% do escopo aprovado pa', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2026', directorate: 'DSTI' },

  // Objetivo 2
  { id: 'dsti-kr2.1', objectiveId: 'dsti-obj-2', code: 'KR 2.1', description: 'Executar, no âmbito da DSTI, as ações do Projeto d', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2025', directorate: 'DSTI' },
  { id: 'dsti-kr2.2', objectiveId: 'dsti-obj-2', code: 'KR 2.2', description: 'Assegurar a participação da DSTI no Curso de Form', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DSTI' },
  { id: 'dsti-kr2.3', objectiveId: 'dsti-obj-2', code: 'KR 2.3', description: 'Elaborar PDI para 100% dos servidores da DSTI co', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DSTI' },
  { id: 'dsti-kr2.4', objectiveId: 'dsti-obj-2', code: 'KR 2.4', description: 'Implementar cultura de feedback e colaboração: p', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '07/2026', directorate: 'DSTI' },

  // Objetivo 3
  { id: 'dsti-kr3.1', objectiveId: 'dsti-obj-3', code: 'KR 3.1', description: 'Elaborar estudos para o fortalecimento da área de', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '12/2025', directorate: 'DSTI' },
  { id: 'dsti-kr3.2', objectiveId: 'dsti-obj-3', code: 'KR 3.2', description: 'Publicar o Plano de Ação de Armazenamento de D', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DSTI' },
  { id: 'dsti-kr3.3', objectiveId: 'dsti-obj-3', code: 'KR 3.3', description: 'Entregar o piloto do Armazenamento de Dados (Arrecad', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '07/2026', directorate: 'DSTI' },
  { id: 'dsti-kr3.4', objectiveId: 'dsti-obj-3', code: 'KR 3.4', description: 'Executar pelo menos 70% das iniciativas priorizad', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2026', directorate: 'DSTI' },

  // Objetivo 4
  { id: 'dsti-kr4.1', objectiveId: 'dsti-obj-4', code: 'KR 4.1', description: 'Planos de Gestão da DSTI elaborado, validados pe', status: 'NAO_INICIADO', situation: 'EM_ATRASO', deadline: '10/2025', directorate: 'DSTI' },
  { id: 'dsti-kr4.2', objectiveId: 'dsti-obj-4', code: 'KR 4.2', description: 'Painel de acompanhamento do ecossistema de es', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '02/2026', directorate: 'DSTI' },
  { id: 'dsti-kr4.3', objectiveId: 'dsti-obj-4', code: 'KR 4.3', description: 'Instituir ciclo de monitoramento e ajuste estratég', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '05/2026', directorate: 'DSTI' },
  { id: 'dsti-kr4.4', objectiveId: 'dsti-obj-4', code: 'KR 4.4', description: 'Preparar o ciclo estratégico 2027–2029: consolida', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '11/2026', directorate: 'DSTI' },

  // Objetivo 5
  { id: 'dsti-kr5.1', objectiveId: 'dsti-obj-5', code: 'KR 5.1', description: 'Publicar o Guia do processo de Demanda por sol', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '01/2026', directorate: 'DSTI' },
  { id: 'dsti-kr5.2', objectiveId: 'dsti-obj-5', code: 'KR 5.2', description: 'Colocar em operação a porta única de demandas', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '03/2026', directorate: 'DSTI' },
  { id: 'dsti-kr5.3', objectiveId: 'dsti-obj-5', code: 'KR 5.3', description: 'Elaborar e submeter à alta gestão o Modelo de Ge', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '07/2026', directorate: 'DSTI' },
  { id: 'dsti-kr5.4', objectiveId: 'dsti-obj-5', code: 'KR 5.4', description: 'Publicar o Painel de Gestão de Demandas da DSTI', status: 'NAO_INICIADO', situation: 'NO_PRAZO', deadline: '12/2026', directorate: 'DSTI' }
];

// Carregar KRs do Storage
let keyResults: KeyResult[] = Storage.load('api_key_results', initialKeyResults);

let initiatives: Initiative[] = [
  // Sprint Atual - SGJT
  { id: 'init1', keyResultId: 'kr3.2', title: 'Diagnóstico ITSM/ITAM', description: 'Análise completa dos sistemas atuais', boardStatus: 'A_FAZER', location: 'SPRINT_ATUAL', directorate: 'DTI' },
  { id: 'init2', keyResultId: 'kr4.3', title: 'Dashboard Power BI - OKRs', description: 'Painel de acompanhamento estratégico', boardStatus: 'A_FAZER', location: 'SPRINT_ATUAL', directorate: 'SGJT' },
  { id: 'init3', keyResultId: 'kr1.2', title: 'Carteira de Iniciativas', description: 'Definição de responsáveis', boardStatus: 'FAZENDO', location: 'SPRINT_ATUAL', directorate: 'SGJT' },
  { id: 'init4', keyResultId: 'kr4.3', title: 'Integração de Dados', description: 'Conectar fontes de dados', boardStatus: 'FAZENDO', location: 'SPRINT_ATUAL', directorate: 'SGJT' },
  { id: 'init5', keyResultId: 'kr1.1', title: 'Formalização Programas', description: 'Atos institucionais aprovados', boardStatus: 'FEITO', location: 'SPRINT_ATUAL', directorate: 'SGJT' },
  { id: 'init6', keyResultId: 'kr4.1', title: 'Plano Setorial SGJT', description: 'Documento aprovado e publicado', boardStatus: 'FEITO', location: 'SPRINT_ATUAL', directorate: 'SGJT' },

  // Backlog
  { id: 'init7', keyResultId: 'kr2.3', title: 'Curso Formação TI', description: 'Planejamento do curso', boardStatus: 'A_FAZER', location: 'BACKLOG', directorate: 'SGJT' },
  { id: 'init8', keyResultId: 'kr3.4', title: 'Expansão GLPI', description: 'Ampliar funcionalidades', boardStatus: 'A_FAZER', location: 'BACKLOG', directorate: 'DTI' }
];

let programs: Program[] = [
  { id: 'prog1', name: 'CONECTA JUD', description: 'Aproximação DPE e DJUD das Unidades Judiciárias', directorate: 'SGJT' },
  { id: 'prog2', name: 'CONEXÃO TI', description: 'Aproximação TI – Usuários', directorate: 'SGJT' },
  { id: 'prog3', name: 'SINERGIA TEC-JUD', description: 'Aproximação entre as áreas tecnológicas e judiciárias', directorate: 'SGJT' }
];

let programInitiatives: ProgramInitiative[] = [
  // CONECTA JUD
  { id: 'pinit1', programId: 'prog1', title: 'Visitas técnicas às unidades judiciárias', description: '', boardStatus: 'FEITO', priority: 'SIM', directorate: 'SGJT' },
  { id: 'pinit2', programId: 'prog1', title: 'Reuniões periódicas com DPE', description: '', boardStatus: 'FAZENDO', priority: 'SIM', directorate: 'SGJT' },
  { id: 'pinit3', programId: 'prog1', title: 'Canal de comunicação direto', description: '', boardStatus: 'A_FAZER', priority: 'NAO', directorate: 'SGJT' },

  // CONEXÃO TI
  { id: 'pinit4', programId: 'prog2', title: 'Campanhas de conscientização em cibersegurança', description: '', boardStatus: 'FEITO', priority: 'SIM', directorate: 'SGJT' },
  { id: 'pinit5', programId: 'prog2', title: 'Portal de atendimento unificado', description: '', boardStatus: 'FAZENDO', priority: 'SIM', directorate: 'SGJT' },
  { id: 'pinit6', programId: 'prog2', title: 'Pesquisa de satisfação trimestral', description: '', boardStatus: 'A_FAZER', priority: 'SIM', directorate: 'SGJT' },

  // SINERGIA TEC-JUD
  { id: 'pinit7', programId: 'prog3', title: 'Indicadores em Power BI compartilhados', description: '', boardStatus: 'FAZENDO', priority: 'SIM', directorate: 'SGJT' },
  { id: 'pinit8', programId: 'prog3', title: 'Comitê conjunto TI-Judiciário', description: '', boardStatus: 'FAZENDO', priority: 'SIM', directorate: 'SGJT' },
  { id: 'pinit9', programId: 'prog3', title: 'Workshops de integração', description: '', boardStatus: 'A_FAZER', priority: 'NAO', directorate: 'SGJT' }
];

let executionControls: ExecutionControl[] = [
  {
    id: '1',
    planProgram: 'Plano de Gestão',
    krProjectInitiative: 'KR 1.1',
    backlogTasks: 'Formalizar diretrizes dos programas',
    sprintStatus: 'CONCLUIDA',
    sprintTasks: 'Atos institucionais aprovados',
    progress: 'FEITO',
    directorate: 'SGJT'
  },
  {
    id: '2',
    planProgram: 'Plano de Gestão',
    krProjectInitiative: 'KR 1.2',
    backlogTasks: 'Definir carteira de iniciativas',
    sprintStatus: 'SPRINT_ATUAL',
    sprintTasks: 'Designar responsáveis para 9 iniciativas',
    progress: 'FAZENDO',
    directorate: 'SGJT'
  },
  {
    id: '3',
    planProgram: 'Plano de Gestão',
    krProjectInitiative: 'KR 4.1',
    backlogTasks: 'Elaborar plano setorial',
    sprintStatus: 'CONCLUIDA',
    sprintTasks: 'Plano aprovado e publicado',
    progress: 'FEITO',
    directorate: 'SGJT'
  },
  {
    id: '4',
    planProgram: 'Novo Sistema Processual Eletrônico',
    krProjectInitiative: 'Módulo de Peticionamento',
    backlogTasks: 'Levantamento de requisitos',
    sprintStatus: 'BACKLOG',
    sprintTasks: '',
    progress: 'A_FAZER',
    directorate: 'DTI'
  },
  {
    id: '5',
    planProgram: 'Novo Sistema Processual Eletrônico',
    krProjectInitiative: 'Integração com sistemas legados',
    backlogTasks: 'Mapeamento de APIs',
    sprintStatus: 'EM_FILA',
    sprintTasks: '',
    progress: 'A_FAZER',
    directorate: 'DTI'
  }
];

// Simular delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Mock
export const api = {
  // Auth
  async login(email: string, password: string): Promise<User> {
    await delay(500);
    const user = users.find(u => u.email === email && u.status === 'ACTIVE');

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Migração de dados: se o usuário não tiver senha (legado), definir a padrão
    if (!user.password) {
      user.password = DEFAULT_PASS_HASH;
      Storage.save('api_users', users);
    }

    const hashedPassword = await hashPassword(password);

    if (user.password !== hashedPassword) {
      throw new Error('Credenciais inválidas');
    }

    return user;
  },

  // Users
  async getUsers(): Promise<User[]> {
    await delay(300);
    return [...users];
  },

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    await delay(300);

    // Hash da senha antes de salvar
    const passwordToHash = user.password || 'senha123'; // Fallback apenas se vier vazio na criação
    const hashedPassword = await hashPassword(passwordToHash);

    const newUser = {
      ...user,
      id: Date.now().toString(),
      password: hashedPassword
    };

    users.push(newUser);
    Storage.save('api_users', users); // Persistir no localStorage
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await delay(300);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuário não encontrado');

    const updatedUser = { ...users[index], ...updates };

    // Se houver atualização de senha, fazer hash
    if (updates.password) {
      updatedUser.password = await hashPassword(updates.password);
    }

    users[index] = updatedUser;
    Storage.save('api_users', users); // Persistir no localStorage
    return users[index];
  },

  async deleteUser(id: string): Promise<void> {
    await delay(300);
    users = users.filter(u => u.id !== id);
    Storage.save('api_users', users); // Persistir no localStorage
  },

  // Objectives
  async getObjectives(): Promise<Objective[]> {
    await delay(300);
    return [...objectives];
  },

  async createObjective(objective: Omit<Objective, 'id'>): Promise<Objective> {
    await delay(300);
    const newObjective = { ...objective, id: Date.now().toString() };
    objectives.push(newObjective);
    Storage.save('api_objectives', objectives);
    return newObjective;
  },

  async updateObjective(id: string, updates: Partial<Objective>): Promise<Objective> {
    await delay(300);
    const index = objectives.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Objetivo não encontrado');
    objectives[index] = { ...objectives[index], ...updates };
    Storage.save('api_objectives', objectives);
    return objectives[index];
  },

  async deleteObjective(id: string): Promise<void> {
    await delay(300);
    objectives = objectives.filter(o => o.id !== id);
    keyResults = keyResults.filter(kr => kr.objectiveId !== id);
    Storage.save('api_objectives', objectives);
    Storage.save('api_key_results', keyResults);
  },

  // Key Results
  async getKeyResults(): Promise<KeyResult[]> {
    await delay(300);

    // Simular atualização diária: recalcular situações ao carregar
    let hasChanges = false;
    const updatedKeyResults = keyResults.map(kr => {
      const newSituation = calculateSituation(kr.status, kr.deadline);
      if (newSituation !== kr.situation) {
        hasChanges = true;
        return { ...kr, situation: newSituation };
      }
      return kr;
    });

    if (hasChanges) {
      keyResults = updatedKeyResults;
      Storage.save('api_key_results', keyResults);
    }

    return [...keyResults];
  },

  async createKeyResult(keyResult: Omit<KeyResult, 'id'>): Promise<KeyResult> {
    await delay(300);

    // Calcular situação inicial
    const situation = calculateSituation(keyResult.status, keyResult.deadline);

    const newKR = {
      ...keyResult,
      id: `kr${Date.now()}`,
      situation // Forçar situação calculada
    };

    keyResults.push(newKR);
    Storage.save('api_key_results', keyResults);
    return newKR;
  },

  async updateKeyResult(id: string, updates: Partial<KeyResult>): Promise<KeyResult> {
    await delay(300);
    const index = keyResults.findIndex(kr => kr.id === id);
    if (index === -1) throw new Error('KR não encontrado');

    const currentKR = keyResults[index];
    const updatedKR = { ...currentKR, ...updates };

    // Recalcular situação se status ou prazo mudaram
    if (updates.status || updates.deadline) {
      updatedKR.situation = calculateSituation(updatedKR.status, updatedKR.deadline);
    }

    keyResults[index] = updatedKR;
    Storage.save('api_key_results', keyResults);
    return keyResults[index];
  },

  async deleteKeyResult(id: string): Promise<void> {
    await delay(300);
    keyResults = keyResults.filter(kr => kr.id !== id);
    initiatives = initiatives.filter(i => i.keyResultId !== id);
    Storage.save('api_key_results', keyResults);
  },

  // Initiatives
  async getInitiatives(): Promise<Initiative[]> {
    await delay(300);
    return [...initiatives];
  },

  async createInitiative(initiative: Omit<Initiative, 'id'>): Promise<Initiative> {
    await delay(300);
    const newInit = { ...initiative, id: `init${Date.now()}` };
    initiatives.push(newInit);
    return newInit;
  },

  async updateInitiative(id: string, updates: Partial<Initiative>): Promise<Initiative> {
    await delay(300);
    const index = initiatives.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Iniciativa não encontrada');
    initiatives[index] = { ...initiatives[index], ...updates };
    return initiatives[index];
  },

  async deleteInitiative(id: string): Promise<void> {
    await delay(300);
    initiatives = initiatives.filter(i => i.id !== id);
  },

  // Programs
  async getPrograms(): Promise<Program[]> {
    await delay(300);
    return [...programs];
  },

  async createProgram(program: Omit<Program, 'id'>): Promise<Program> {
    await delay(300);
    const newProgram = { ...program, id: `prog${Date.now()}` };
    programs.push(newProgram);
    return newProgram;
  },

  async updateProgram(id: string, updates: Partial<Program>): Promise<Program> {
    await delay(300);
    const index = programs.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Programa não encontrado');
    programs[index] = { ...programs[index], ...updates };
    return programs[index];
  },

  async deleteProgram(id: string): Promise<void> {
    await delay(300);
    programs = programs.filter(p => p.id !== id);
    programInitiatives = programInitiatives.filter(pi => pi.programId !== id);
  },

  // Program Initiatives
  async getProgramInitiatives(): Promise<ProgramInitiative[]> {
    await delay(300);
    return [...programInitiatives];
  },

  async createProgramInitiative(initiative: Omit<ProgramInitiative, 'id'>): Promise<ProgramInitiative> {
    await delay(300);
    const newInit = { ...initiative, id: `pinit${Date.now()}` };
    programInitiatives.push(newInit);
    return newInit;
  },

  async updateProgramInitiative(id: string, updates: Partial<ProgramInitiative>): Promise<ProgramInitiative> {
    await delay(300);
    const index = programInitiatives.findIndex(pi => pi.id === id);
    if (index === -1) throw new Error('Iniciativa do programa não encontrada');
    programInitiatives[index] = { ...programInitiatives[index], ...updates };
    return programInitiatives[index];
  },

  async deleteProgramInitiative(id: string): Promise<void> {
    await delay(300);
    programInitiatives = programInitiatives.filter(pi => pi.id !== id);
  },

  // Execution Controls
  async getExecutionControls(): Promise<ExecutionControl[]> {
    await delay(300);
    return [...executionControls];
  },

  async createExecutionControl(control: Omit<ExecutionControl, 'id'>): Promise<ExecutionControl> {
    await delay(300);
    const newControl = { ...control, id: Date.now().toString() };
    executionControls.push(newControl);
    return newControl;
  },

  async updateExecutionControl(id: string, updates: Partial<ExecutionControl>): Promise<ExecutionControl> {
    await delay(300);
    const index = executionControls.findIndex(ec => ec.id === id);
    if (index === -1) throw new Error('Controle de execução não encontrado');
    executionControls[index] = { ...executionControls[index], ...updates };
    return executionControls[index];
  },

  async deleteExecutionControl(id: string): Promise<void> {
    await delay(300);
    executionControls = executionControls.filter(ec => ec.id !== id);
  }
};