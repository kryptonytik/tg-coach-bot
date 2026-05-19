import axios from 'axios';
import type { BodyMeasurement, Client, ClientStats, CurrentUser, Exercise, TrainerStats, WorkoutSession, WorkoutSet } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// In production, attach Telegram initData as Bearer token
// In dev mode, backend auto-creates trainer, no auth needed
if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
  api.defaults.headers.common['Authorization'] =
    `Bearer ${(window as any).Telegram.WebApp.initData}`;
}

export const meApi = {
  getMe: () => api.get<CurrentUser>('/api/me').then(r => r.data),
  register: (data: any) => api.post<Client>('/api/me/register', data).then(r => r.data),
  getStats: () => api.get<ClientStats>('/api/me/stats').then(r => r.data),
  addMeasurement: (data: any) => api.post<BodyMeasurement>('/api/me/measurements', data).then(r => r.data),
  getMeasurements: () => api.get<BodyMeasurement[]>('/api/me/measurements').then(r => r.data),
  getWorkoutHistory: (params?: {limit?: number; offset?: number}) =>
    api.get<any[]>('/api/me/workout-history', { params }).then(r => r.data),
  updateProfile: (data: any) => api.patch('/api/me/profile', data).then(r => r.data),
  updateQuestionnaire: (data: any) => api.patch('/api/me/questionnaire', data).then(r => r.data),
};

export const trainerApi = {
  getStats: () => api.get<TrainerStats>('/api/trainer/stats').then(r => r.data),
  getActiveSession: (clientId: number) =>
    api.get<{ session: WorkoutSession | null }>(`/api/trainer/active-session/${clientId}`).then(r => r.data),
  getMyClientProfile: () => api.get('/api/trainer/my-client-profile').then(r => r.data),
  getMyWorkoutHistory: (params?: { limit?: number; offset?: number }) =>
    api.get<any[]>('/api/trainer/my-workout-history', { params }).then(r => r.data),
};

export const clientsApi = {
  list: (active?: boolean) => {
    const params = active !== undefined ? { active } : {};
    return api.get<Client[]>('/api/clients', { params }).then(r => r.data);
  },
  get: (id: number) => api.get<Client>(`/api/clients/${id}`).then(r => r.data),
  create: (data: any) => api.post<Client>('/api/clients', data).then(r => r.data),
  update: (id: number, data: any) => api.patch<Client>(`/api/clients/${id}`, data).then(r => r.data),
  deactivate: (id: number) => api.delete(`/api/clients/${id}`).then(r => r.data),
  deletePermanent: (id: number) => api.delete(`/api/clients/${id}/permanent`).then(r => r.data),
  getWorkoutHistory: (id: number) => api.get<any[]>(`/api/clients/${id}/workout-history`).then(r => r.data),
  getMeasurements: (id: number) => api.get<any[]>(`/api/clients/${id}/measurements`).then(r => r.data),
};

export const workoutsApi = {
  createSession: (data: any) => api.post<WorkoutSession>('/api/workouts/sessions', data).then(r => r.data),
  getSession: (id: number) => api.get<WorkoutSession>(`/api/workouts/sessions/${id}`).then(r => r.data),
  getSessionDetail: (id: number) => api.get<any>(`/api/workouts/sessions/${id}/detail`).then(r => r.data),
  updateSession: (id: number, data: any) => api.patch<WorkoutSession>(`/api/workouts/sessions/${id}`, data).then(r => r.data),
  addSet: (sessionId: number, data: any) => api.post<WorkoutSet>(`/api/workouts/sessions/${sessionId}/sets`, data).then(r => r.data),
  deleteSet: (sessionId: number, setId: number) => api.delete(`/api/workouts/sessions/${sessionId}/sets/${setId}`),
  deleteSession: (id: number) => api.delete(`/api/workouts/sessions/${id}`).then(r => r.data),
  getExerciseHistory: (clientId: number, exerciseId: number) =>
    api.get<any[]>('/api/workouts/exercise-history', { params: { client_id: clientId, exercise_id: exerciseId, limit: 3 } }).then(r => r.data),
  getSessionProgress: (id: number) => api.get<any>(`/api/workouts/sessions/${id}/progress`).then(r => r.data),
};

export const exercisesApi = {
  list: (params?: { category?: string; type?: string }) =>
    api.get<Exercise[]>('/api/exercises', { params }).then(r => r.data),
  create: (data: { name: string; workout_type: string; category: string; muscle_group?: string }) =>
    api.post('/api/exercises', data).then(r => r.data),
  update: (id: number, data: any) => api.patch(`/api/exercises/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/api/exercises/${id}`).then(r => r.data),
};
