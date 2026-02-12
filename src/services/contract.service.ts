import api from './api';
import type { Contract, PaymentSchedule, PaginatedResponse } from '../types';

export const contractService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    placa?: string;
    estado?: string;
    clienteNombre?: string;
  }): Promise<PaginatedResponse<Contract>> {
    const { data } = await api.get('/contracts', { params });
    return data;
  },

  async getById(id: number): Promise<Contract> {
    const { data } = await api.get(`/contracts/${id}`);
    return data;
  },

  async getByVehicle(vehicleId: number): Promise<Contract[]> {
    const { data } = await api.get(`/contracts/vehicle/${vehicleId}`);
    return data;
  },

  async create(contract: {
    vehicleId: number;
    fechaInicio: string;
    precio: number;
    pagoInicial: number;
    numeroCuotas: number;
    frecuencia: string;
    comisionPorcentaje?: number;
    moraPorcentaje?: number;
    clienteNombre?: string;
    clienteDni?: string;
    clienteTelefono?: string;
    clienteDireccion?: string;
    observaciones?: string;
  }): Promise<Contract> {
    const { data } = await api.post('/contracts', contract);
    return data;
  },

  async update(id: number, contract: Partial<Contract>): Promise<Contract> {
    const { data } = await api.put(`/contracts/${id}`, contract);
    return data;
  },

  async activate(id: number): Promise<Contract> {
    const { data } = await api.patch(`/contracts/${id}/activate`);
    return data;
  },

  async cancel(id: number): Promise<Contract> {
    const { data } = await api.patch(`/contracts/${id}/cancel`);
    return data;
  },

  async annul(id: number): Promise<Contract> {
    const { data } = await api.patch(`/contracts/${id}/annul`);
    return data;
  },

  async getSchedule(contractId: number): Promise<PaymentSchedule[]> {
    const { data } = await api.get(`/payment-schedules/contract/${contractId}`);
    return data;
  },
};
