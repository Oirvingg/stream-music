import { apiFetch } from './api';

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export const fetchCategories = (): Promise<Category[]> => apiFetch('/api/categories');
