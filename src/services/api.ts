/**
 * API REFATORADA - PostgreSQL Backend
 * 
 * Este arquivo substitui o uso de localStorage por chamadas HTTP ao backend PostgreSQL
 * 
 * IMPORTANTE: Renomeie o arquivo api.ts antigo para api.old.ts
 * E renomeie este arquivo para api.ts
 */

import {
    User,
    Objective,
    KeyResult,
    Initiative,
    Program,
    ProgramInitiative,
    ExecutionControl,
    Directorate
} from '@/types';
import { apiClient } from './apiClient';

// ============================================================
// DELAY SIMULADO (para UX consistente)
// ============================================================
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// API DE USUÁRIOS
// ============================================================

export async function getUsers(): Promise<User[]> {
    await delay(200); // Delay para UX
    return apiClient.get<User[]>('/api/users');
}

export async function getUserById(id: string): Promise<User | null> {
    try {
        return await apiClient.get<User>(`/api/users/${id}`);
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
    return apiClient.post<User>('/api/users', userData);
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
    return apiClient.put<User>(`/api/users/${id}`, userData);
}

export async function deleteUser(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/users/${id}`);
}

export async function login(email: string, password: string): Promise<User | null> {
    try {
        // Hash da senha (SHA-256) - manter compatibilidade
        const passwordHash = await hashPassword(password);

        const user = await apiClient.post<User>('/api/auth/login', {
            email,
            password: passwordHash
        });

        return user;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

// Helper para hash SHA-256 (mantém compatibilidade)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// ============================================================
// API DE OBJECTIVES
// ============================================================

export async function getObjectives(): Promise<Objective[]> {
    await delay(200);
    return apiClient.get<Objective[]>('/api/objectives');
}

export async function getObjectiveById(id: string): Promise<Objective | null> {
    try {
        const objectives = await getObjectives();
        return objectives.find(obj => obj.id === id) || null;
    } catch (error) {
        console.error('Error fetching objective:', error);
        return null;
    }
}

export async function createObjective(objectiveData: Omit<Objective, 'id'>): Promise<Objective> {
    return apiClient.post<Objective>('/api/objectives', objectiveData);
}

export async function updateObjective(id: string, objectiveData: Partial<Objective>): Promise<Objective> {
    return apiClient.put<Objective>(`/api/objectives/${id}`, objectiveData);
}

export async function deleteObjective(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/objectives/${id}`);
}

// ============================================================
// API DE KEY RESULTS
// ============================================================

export async function getKeyResults(): Promise<KeyResult[]> {
    await delay(200);
    return apiClient.get<KeyResult[]>('/api/key-results');
}

export async function getKeyResultById(id: string): Promise<KeyResult | null> {
    try {
        const krs = await getKeyResults();
        return krs.find(kr => kr.id === id) || null;
    } catch (error) {
        console.error('Error fetching key result:', error);
        return null;
    }
}

export async function createKeyResult(krData: Omit<KeyResult, 'id' | 'situation'>): Promise<KeyResult> {
    return apiClient.post<KeyResult>('/api/key-results', krData);
}

export async function updateKeyResult(id: string, krData: Partial<KeyResult>): Promise<KeyResult> {
    return apiClient.put<KeyResult>(`/api/key-results/${id}`, krData);
}

export async function deleteKeyResult(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/key-results/${id}`);
}

// ============================================================
// API DE INITIATIVES
// ============================================================

export async function getInitiatives(): Promise<Initiative[]> {
    await delay(200);
    return apiClient.get<Initiative[]>('/api/initiatives');
}

export async function getInitiativeById(id: string): Promise<Initiative | null> {
    try {
        const initiatives = await getInitiatives();
        return initiatives.find(init => init.id === id) || null;
    } catch (error) {
        console.error('Error fetching initiative:', error);
        return null;
    }
}

export async function createInitiative(initiativeData: Omit<Initiative, 'id'>): Promise<Initiative> {
    return apiClient.post<Initiative>('/api/initiatives', initiativeData);
}

export async function updateInitiative(id: string, initiativeData: Partial<Initiative>): Promise<Initiative> {
    return apiClient.put<Initiative>(`/api/initiatives/${id}`, initiativeData);
}

export async function deleteInitiative(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/initiatives/${id}`);
}

// ============================================================
// API DE PROGRAMS
// ============================================================

export async function getPrograms(): Promise<Program[]> {
    await delay(200);
    return apiClient.get<Program[]>('/api/programs');
}

export async function getProgramById(id: string): Promise<Program | null> {
    try {
        const programs = await getPrograms();
        return programs.find(prog => prog.id === id) || null;
    } catch (error) {
        console.error('Error fetching program:', error);
        return null;
    }
}

export async function createProgram(programData: Omit<Program, 'id'>): Promise<Program> {
    return apiClient.post<Program>('/api/programs', programData);
}

export async function updateProgram(id: string, programData: Partial<Program>): Promise<Program> {
    return apiClient.put<Program>(`/api/programs/${id}`, programData);
}

export async function deleteProgram(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/programs/${id}`);
}

// ============================================================
// API DE DIRECTORATES
// ============================================================

export async function getDirectorates(): Promise<Directorate[]> {
    return apiClient.get<Directorate[]>('/api/directorates');
}

// ============================================================
// EXPORTAÇÃO DEFAULT (compatibilidade)
// ============================================================

export const api = {
    // Users
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    login,

    // Objectives
    getObjectives,
    getObjectiveById,
    createObjective,
    updateObjective,
    deleteObjective,

    // Key Results
    getKeyResults,
    getKeyResultById,
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,

    // Initiatives
    getInitiatives,
    getInitiativeById,
    createInitiative,
    updateInitiative,
    deleteInitiative,

    // Programs
    getPrograms,
    getProgramById,
    createProgram,
    updateProgram,
    deleteProgram,

    // Directorates
    getDirectorates,
};

export default api;
