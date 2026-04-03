import api from './api';
import type { Cuenta } from '../types';

export const cuentaService = {
  async getAll(soloActivas = false): Promise<Cuenta[]> {
    const { data } = await api.get('/cuentas', {
      params: soloActivas ? { soloActivas: 'true' } : {},
    });
    return data;
  },

  async create(nombre: string): Promise<Cuenta> {
    const { data } = await api.post('/cuentas', { nombre });
    return data;
  },

  async update(id: number, payload: { nombre?: string; activa?: boolean }): Promise<Cuenta> {
    const { data } = await api.patch(`/cuentas/${id}`, payload);
    return data;
  },
};
