import {
  Form,
  FormField,
  FormSection,
  FormResponse,
  FormAnswer,
  FormWithDetails,
  ResponseWithAnswers,
  Directorate
} from '@/types';
import { apiClient } from './apiClient';

// ============================================================
// FORMS
// ============================================================

export const getForms = async (directorate?: Directorate, options?: { isAdmin?: boolean, filterByVisibility?: boolean }): Promise<Form[]> => {
  const params: any = {};

  if (options?.isAdmin) {
    params.isAdmin = 'true';
  } else if (directorate) {
    params.directorate = directorate;
  }

  return apiClient.get<Form[]>('/api/forms?' + new URLSearchParams(params).toString());
};

export const getFormById = async (id: string): Promise<FormWithDetails | null> => {
  try {
    return await apiClient.get<FormWithDetails>(`/api/forms/${id}`);
  } catch (error) {
    console.error('Error fetching form:', error);
    return null;
  }
};

export const createForm = async (data: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>): Promise<Form> => {
  return apiClient.post<Form>('/api/forms', data);
};

export const updateForm = async (id: string, data: Partial<Form>): Promise<Form> => {
  return apiClient.put<Form>(`/api/forms/${id}`, data);
};

export const deleteForm = async (id: string): Promise<void> => {
  await apiClient.delete<void>(`/api/forms/${id}`);
};

// ============================================================
// SECTIONS & FIELDS
// ============================================================

export const createSection = async (data: Omit<FormSection, 'id'>): Promise<FormSection> => {
  throw new Error('Use saveSectionsAndFields instead');
};

export const updateSection = async (id: string, data: Partial<FormSection>): Promise<FormSection> => {
  throw new Error('Use saveSectionsAndFields instead');
};

export const deleteSection = async (id: string): Promise<void> => {
  throw new Error('Use saveSectionsAndFields instead');
};

export const createField = async (data: Omit<FormField, 'id'>): Promise<FormField> => {
  throw new Error('Use saveSectionsAndFields instead');
};

export const updateField = async (id: string, data: Partial<FormField>): Promise<FormField> => {
  throw new Error('Use saveSectionsAndFields instead');
};

export const deleteField = async (id: string): Promise<void> => {
  throw new Error('Use saveSectionsAndFields instead');
};

// Batch operations
export const saveSectionsAndFields = async (
  formId: string,
  sections: FormSection[],
  fields: FormField[]
): Promise<{ sections: FormSection[]; fields: FormField[] }> => {

  await apiClient.post(`/api/forms/${formId}/structure`, {
    sections,
    fields
  });

  // Recarregar o formulário para pegar os IDs gerados
  const updatedForm = await getFormById(formId);

  if (!updatedForm) {
    throw new Error('Erro ao recarregar formulário após salvar');
  }

  return {
    sections: updatedForm.sections,
    fields: updatedForm.fields
  };
};

// ============================================================
// RESPONSES
// ============================================================

export const getFormResponses = async (formId: string): Promise<ResponseWithAnswers[]> => {
  return apiClient.get<ResponseWithAnswers[]>(`/api/forms/${formId}/responses`);
};

export const getUserResponses = async (userId: string, directorate?: Directorate): Promise<ResponseWithAnswers[]> => {
  return apiClient.get<ResponseWithAnswers[]>(`/api/users/${userId}/responses`);
};

export const createResponse = async (data: Omit<FormResponse, 'id' | 'createdAt' | 'updatedAt'> & { answers?: any[] }): Promise<FormResponse> => {
  // Extrair answers se existirem no objeto data (mesmo que o tipo diga que não)
  const { answers, ...responseData } = data as any;

  if (answers) {
    return apiClient.post<FormResponse>(`/api/forms/${responseData.formId}/responses`, {
      userId: responseData.userId,
      status: responseData.status,
      answers
    });
  }

  // Se não tiver answers, cria só a response
  return apiClient.post<FormResponse>(`/api/forms/${responseData.formId}/responses`, {
    userId: responseData.userId,
    status: responseData.status,
    answers: []
  });
};

export const updateResponse = async (id: string, data: Partial<FormResponse>): Promise<FormResponse> => {
  console.warn('updateResponse not implemented in backend');
  return {} as FormResponse;
};

export const saveAnswers = async (responseId: string, answers: Omit<FormAnswer, 'id'>[]): Promise<FormAnswer[]> => {
  console.warn('saveAnswers should be handled via createResponse or updateResponse');
  return [];
};

export const formApi = {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  createSection,
  updateSection,
  deleteSection,
  createField,
  updateField,
  deleteField,
  saveSectionsAndFields,
  getFormResponses,
  getUserResponses,
  createResponse,
  updateResponse,
  saveAnswers
};