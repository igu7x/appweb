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

// LocalStorage keys
const STORAGE_KEYS = {
  FORMS: 'mgx_forms',
  SECTIONS: 'mgx_form_sections',
  FIELDS: 'mgx_form_fields',
  RESPONSES: 'mgx_form_responses',
  ANSWERS: 'mgx_form_answers'
};

// Helper function to deep clone objects
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Helper functions for localStorage persistence
const loadFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return [];
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Initialize data from localStorage
let forms: Form[] = loadFromStorage<Form>(STORAGE_KEYS.FORMS);
let formSections: FormSection[] = loadFromStorage<FormSection>(STORAGE_KEYS.SECTIONS);
let formFields: FormField[] = loadFromStorage<FormField>(STORAGE_KEYS.FIELDS);
let formResponses: FormResponse[] = loadFromStorage<FormResponse>(STORAGE_KEYS.RESPONSES);
let formAnswers: FormAnswer[] = loadFromStorage<FormAnswer>(STORAGE_KEYS.ANSWERS);

// Forms - Updated to support visibility by allowedDirectorates
export const getForms = async (directorate?: Directorate, options?: { isAdmin?: boolean, filterByVisibility?: boolean }): Promise<Form[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  // Reload from storage to ensure fresh data
  forms = loadFromStorage<Form>(STORAGE_KEYS.FORMS);
  const allForms = deepClone(forms);

  console.log('[formApi.getForms] Total forms loaded:', allForms.length);
  console.log('[formApi.getForms] User directorate:', directorate);
  console.log('[formApi.getForms] Is ADMIN:', options?.isAdmin);
  console.log('[formApi.getForms] Filter by visibility:', options?.filterByVisibility);

  // ADMIN sempre vê todos os formulários
  if (options?.isAdmin) {
    console.log('[formApi.getForms] ADMIN user - returning ALL forms');
    return allForms;
  }

  // Se filterByVisibility é true, filtrar por allowedDirectorates
  if (options?.filterByVisibility && directorate) {
    const visibleForms = allForms.filter(form => {
      // Se não tem allowedDirectorates, é compatibilidade - visível para todos
      if (!form.allowedDirectorates || form.allowedDirectorates.length === 0) {
        console.log(`[formApi.getForms] Form "${form.title}" has no allowedDirectorates - visible to all`);
        return true;
      }

      // Se tem 'ALL', é visível para todos
      if (form.allowedDirectorates.includes('ALL')) {
        console.log(`[formApi.getForms] Form "${form.title}" is visible to ALL directorates`);
        return true;
      }

      // Verificar se a diretoria do usuário está na lista
      const isVisible = form.allowedDirectorates.includes(directorate);
      console.log(`[formApi.getForms] Form "${form.title}" allowed for:`, form.allowedDirectorates, `- Visible to ${directorate}:`, isVisible);
      return isVisible;
    });

    console.log('[formApi.getForms] Visible forms after filtering:', visibleForms.length);
    return visibleForms;
  }

  // Filtro antigo por diretoria do criador (para compatibilidade com AdminFormsView)
  if (directorate && !options?.filterByVisibility) {
    console.log('[formApi.getForms] Filtering by creator directorate:', directorate);
    return allForms.filter(f => f.directorate === directorate);
  }

  return allForms;
};

export const getFormById = async (id: string): Promise<FormWithDetails | null> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  // Reload from storage to ensure fresh data
  forms = loadFromStorage<Form>(STORAGE_KEYS.FORMS);
  formSections = loadFromStorage<FormSection>(STORAGE_KEYS.SECTIONS);
  formFields = loadFromStorage<FormField>(STORAGE_KEYS.FIELDS);
  formResponses = loadFromStorage<FormResponse>(STORAGE_KEYS.RESPONSES);

  const form = forms.find(f => f.id === id);
  if (!form) return null;

  const sections = deepClone(formSections.filter(s => s.formId === id).sort((a, b) => a.order - b.order));
  const fields = deepClone(formFields.filter(f => f.formId === id).sort((a, b) => a.order - b.order));
  const responseCount = formResponses.filter(r => r.formId === id && r.status === 'SUBMITTED').length;

  console.log(`[getFormById] Form: "${form.title}" (ID: ${id})`);
  console.log(`[getFormById] Sections loaded: ${sections.length}`);
  sections.forEach(s => console.log(`  - Section: "${s.title}" (ID: ${s.id})`));
  console.log(`[getFormById] Fields loaded: ${fields.length}`);
  fields.forEach(f => console.log(`  - Field: "${f.label}" (ID: ${f.id}, SectionId: ${f.sectionId || 'none'})`));

  return {
    ...deepClone(form),
    sections,
    fields,
    responseCount
  };
};

export const createForm = async (data: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>): Promise<Form> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const newForm: Form = {
    ...data,
    id: `form-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  forms.push(newForm);
  saveToStorage(STORAGE_KEYS.FORMS, forms);
  return deepClone(newForm);
};

export const updateForm = async (id: string, data: Partial<Form>): Promise<Form> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const index = forms.findIndex(f => f.id === id);
  if (index === -1) throw new Error('Form not found');

  forms[index] = {
    ...forms[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  saveToStorage(STORAGE_KEYS.FORMS, forms);
  return deepClone(forms[index]);
};

export const deleteForm = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  forms = forms.filter(f => f.id !== id);
  formSections = formSections.filter(s => s.formId !== id);
  formFields = formFields.filter(f => f.formId !== id);
  const responseIds = formResponses.filter(r => r.formId === id).map(r => r.id);
  formResponses = formResponses.filter(r => r.formId !== id);
  formAnswers = formAnswers.filter(a => !responseIds.includes(a.responseId));

  saveToStorage(STORAGE_KEYS.FORMS, forms);
  saveToStorage(STORAGE_KEYS.SECTIONS, formSections);
  saveToStorage(STORAGE_KEYS.FIELDS, formFields);
  saveToStorage(STORAGE_KEYS.RESPONSES, formResponses);
  saveToStorage(STORAGE_KEYS.ANSWERS, formAnswers);
};

// Sections
export const createSection = async (data: Omit<FormSection, 'id'>): Promise<FormSection> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const newSection: FormSection = {
    ...data,
    id: `section-${Date.now()}-${Math.random()}`
  };
  formSections.push(newSection);
  saveToStorage(STORAGE_KEYS.SECTIONS, formSections);
  return deepClone(newSection);
};

export const updateSection = async (id: string, data: Partial<FormSection>): Promise<FormSection> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const index = formSections.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Section not found');

  formSections[index] = { ...formSections[index], ...data };
  saveToStorage(STORAGE_KEYS.SECTIONS, formSections);
  return deepClone(formSections[index]);
};

export const deleteSection = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  formSections = formSections.filter(s => s.id !== id);
  formFields = formFields.filter(f => f.sectionId !== id);
  saveToStorage(STORAGE_KEYS.SECTIONS, formSections);
  saveToStorage(STORAGE_KEYS.FIELDS, formFields);
};

// Fields
export const createField = async (data: Omit<FormField, 'id'>): Promise<FormField> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const newField: FormField = {
    ...deepClone(data),
    id: `field-${Date.now()}-${Math.random()}`
  };
  formFields.push(newField);
  saveToStorage(STORAGE_KEYS.FIELDS, formFields);
  return deepClone(newField);
};

export const updateField = async (id: string, data: Partial<FormField>): Promise<FormField> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const index = formFields.findIndex(f => f.id === id);
  if (index === -1) throw new Error('Field not found');

  formFields[index] = {
    ...formFields[index],
    ...deepClone(data)
  };
  saveToStorage(STORAGE_KEYS.FIELDS, formFields);
  return deepClone(formFields[index]);
};

export const deleteField = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  formFields = formFields.filter(f => f.id !== id);
  formAnswers = formAnswers.filter(a => a.fieldId !== id);
  saveToStorage(STORAGE_KEYS.FIELDS, formFields);
  saveToStorage(STORAGE_KEYS.ANSWERS, formAnswers);
};

// Batch operations for better performance
export const saveSectionsAndFields = async (
  formId: string,
  sections: FormSection[],
  fields: FormField[]
): Promise<{ sections: FormSection[]; fields: FormField[] }> => {
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('[saveSectionsAndFields] Iniciando salvamento...');
  console.log('[saveSectionsAndFields] FormId:', formId);
  console.log('[saveSectionsAndFields] Sections:', sections.length);
  console.log('[saveSectionsAndFields] Fields:', fields.length);

  // Remove all existing sections and fields for this form
  formSections = formSections.filter(s => s.formId !== formId);
  formFields = formFields.filter(f => f.formId !== formId);

  // Create a mapping from old section IDs to new section IDs
  const sectionIdMap = new Map<string, string>();

  // Add new sections and build ID mapping
  const savedSections: FormSection[] = [];
  for (const section of sections) {
    const oldId = section.id;
    const newId = section.id.startsWith('temp-') ? `section-${Date.now()}-${Math.random()}` : section.id;

    // Store the mapping
    sectionIdMap.set(oldId, newId);

    const newSection: FormSection = {
      ...deepClone(section),
      id: newId,
      formId
    };
    formSections.push(newSection);
    savedSections.push(deepClone(newSection));

    console.log(`[saveSectionsAndFields] Section ID mapping: ${oldId} -> ${newId}`);
  }

  // Add new fields with updated section IDs
  const savedFields: FormField[] = [];
  for (const field of fields) {
    const oldFieldId = field.id;
    const newFieldId = field.id.startsWith('temp-') ? `field-${Date.now()}-${Math.random()}` : field.id;

    // Update sectionId if it's a temporary ID
    let updatedSectionId = field.sectionId;
    if (field.sectionId && sectionIdMap.has(field.sectionId)) {
      updatedSectionId = sectionIdMap.get(field.sectionId);
      console.log(`[saveSectionsAndFields] Field "${field.label}" - SectionId updated: ${field.sectionId} -> ${updatedSectionId}`);
    }

    const newField: FormField = {
      ...deepClone(field),
      id: newFieldId,
      formId,
      sectionId: updatedSectionId
    };
    formFields.push(newField);
    savedFields.push(deepClone(newField));

    console.log(`[saveSectionsAndFields] Field saved: "${field.label}" (ID: ${oldFieldId} -> ${newFieldId}, SectionId: ${updatedSectionId})`);
  }

  saveToStorage(STORAGE_KEYS.SECTIONS, formSections);
  saveToStorage(STORAGE_KEYS.FIELDS, formFields);

  console.log('[saveSectionsAndFields] Salvamento concluído!');
  console.log('[saveSectionsAndFields] Total sections saved:', savedSections.length);
  console.log('[saveSectionsAndFields] Total fields saved:', savedFields.length);

  return { sections: savedSections, fields: savedFields };
};

// Responses
export const getFormResponses = async (formId: string): Promise<ResponseWithAnswers[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  // Reload from storage
  formResponses = loadFromStorage<FormResponse>(STORAGE_KEYS.RESPONSES);
  formAnswers = loadFromStorage<FormAnswer>(STORAGE_KEYS.ANSWERS);

  const responses = formResponses.filter(r => r.formId === formId);

  return responses.map(response => ({
    ...deepClone(response),
    answers: deepClone(formAnswers.filter(a => a.responseId === response.id))
  }));
};

export const getUserResponses = async (userId: string, directorate?: Directorate): Promise<ResponseWithAnswers[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  // Reload from storage
  forms = loadFromStorage<Form>(STORAGE_KEYS.FORMS);
  formResponses = loadFromStorage<FormResponse>(STORAGE_KEYS.RESPONSES);
  formAnswers = loadFromStorage<FormAnswer>(STORAGE_KEYS.ANSWERS);

  let responses = formResponses.filter(r => r.userId === userId);

  if (directorate) {
    const directorateForms = forms.filter(f => f.directorate === directorate).map(f => f.id);
    responses = responses.filter(r => directorateForms.includes(r.formId));
  }

  return responses.map(response => ({
    ...deepClone(response),
    answers: deepClone(formAnswers.filter(a => a.responseId === response.id))
  }));
};

export const createResponse = async (data: Omit<FormResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<FormResponse> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const newResponse: FormResponse = {
    ...data,
    id: `response-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  formResponses.push(newResponse);
  saveToStorage(STORAGE_KEYS.RESPONSES, formResponses);
  return deepClone(newResponse);
};

export const updateResponse = async (id: string, data: Partial<FormResponse>): Promise<FormResponse> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const index = formResponses.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Response not found');

  formResponses[index] = {
    ...formResponses[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  saveToStorage(STORAGE_KEYS.RESPONSES, formResponses);
  return deepClone(formResponses[index]);
};

// Answers
export const saveAnswers = async (responseId: string, answers: Omit<FormAnswer, 'id'>[]): Promise<FormAnswer[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));

  // Remove existing answers for this response
  formAnswers = formAnswers.filter(a => a.responseId !== responseId);

  // Add new answers with deep cloning
  const newAnswers = answers.map(answer => ({
    ...deepClone(answer),
    id: `answer-${Date.now()}-${Math.random()}`
  }));

  formAnswers.push(...newAnswers);
  saveToStorage(STORAGE_KEYS.ANSWERS, formAnswers);
  return deepClone(newAnswers);
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