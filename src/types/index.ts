// Tipos de usuário e autenticação
export type UserRole = 'VIEWER' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  password?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Tipos de Diretoria
export type Directorate = 'DIJUD' | 'DPE' | 'DTI' | 'DSTI' | 'SGJT';

export const DIRECTORATES: { value: Directorate; label: string }[] = [
  { value: 'DIJUD', label: 'DIJUD' },
  { value: 'DPE', label: 'DPE' },
  { value: 'DTI', label: 'DTI' },
  { value: 'DSTI', label: 'DSTI' },
  { value: 'SGJT', label: 'SGJT' }
];

// Tipos de Gestão Estratégica
export type OKRStatus = 'CONCLUIDO' | 'EM_ANDAMENTO' | 'NAO_INICIADO';
export type OKRSituation = 'NO_PRAZO' | 'EM_ATRASO' | 'FINALIZADO';
export type BoardStatus = 'A_FAZER' | 'FAZENDO' | 'FEITO';
export type InitiativeLocation = 'BACKLOG' | 'EM_FILA' | 'SPRINT_ATUAL' | 'FORA_SPRINT' | 'CONCLUIDA';
export type Priority = 'SIM' | 'NAO';
export type ExecutionProgress = 'FAZENDO' | 'FEITO' | 'A_FAZER';

export interface Objective {
  id: string;
  code: string;
  title: string;
  description: string;
  directorate: Directorate;
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  code: string;
  description: string;
  status: OKRStatus;
  situation: OKRSituation;
  deadline: string;
  directorate: Directorate;
}

export interface Initiative {
  id: string;
  keyResultId: string;
  title: string;
  description: string;
  boardStatus: BoardStatus;
  location: InitiativeLocation;
  sprintId?: string;
  directorate: Directorate;
}

// Novo tipo para Controle de Execução
export interface ExecutionControl {
  id: string;
  planProgram: string;
  krProjectInitiative: string;
  backlogTasks: string;
  sprintStatus: InitiativeLocation;
  sprintTasks: string;
  progress: ExecutionProgress;
  directorate: Directorate;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  directorate: Directorate;
}

export interface ProgramInitiative {
  id: string;
  programId: string;
  title: string;
  description: string;
  boardStatus: BoardStatus;
  priority: Priority;
  directorate: Directorate;
}

// Tipos para estatísticas dos dashboards
export interface OKRStats {
  total: number;
  concluido: number;
  emAndamento: number;
  aIniciar: number;
  progresso: number;
}

export interface SprintStats {
  backlog: number;
  emFila: number;
  concluido: number;
  sprintAtual: number;
  progresso: number;
}

export interface ChartData {
  name: string;
  concluido?: number;
  emAndamento?: number;
  naoIniciado?: number;
  value?: number;
  [key: string]: string | number | undefined;
}

// Tipos para o módulo de Pessoas (Formulários)
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ResponseStatus = 'DRAFT' | 'SUBMITTED';

export type FieldType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'MULTIPLE_CHOICE'
  | 'CHECKBOXES'
  | 'SCALE'
  | 'DATE'
  | 'NUMBER'
  | 'DROPDOWN';

export interface FormFieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormFieldConfig {
  options?: FormFieldOption[];
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
}

export interface FormField {
  id: string;
  formId: string;
  sectionId?: string;
  type: FieldType;
  label: string;
  helpText?: string;
  required: boolean;
  order: number;
  config?: FormFieldConfig;
}

export interface FormSection {
  id: string;
  formId: string;
  title: string;
  description?: string;
  order: number;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  status: FormStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  directorate: Directorate;
  allowedDirectorates?: (Directorate | 'ALL')[];
}

export interface FormResponse {
  id: string;
  formId: string;
  userId: string;
  userName: string;
  status: ResponseStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormAnswer {
  id: string;
  responseId: string;
  fieldId: string;
  value: string | string[] | number;
}

export interface FormWithDetails extends Form {
  sections: FormSection[];
  fields: FormField[];
  responseCount?: number;
}

export interface ResponseWithAnswers extends FormResponse {
  answers: FormAnswer[];
}