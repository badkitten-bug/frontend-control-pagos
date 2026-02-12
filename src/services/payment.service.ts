import api from './api';
import type { Payment, PaginatedResponse } from '../types';

export const paymentService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    contractId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<PaginatedResponse<Payment>> {
    const { data } = await api.get('/payments', { params });
    return data;
  },

  async getByContract(contractId: number): Promise<Payment[]> {
    const { data } = await api.get(`/payments/contract/${contractId}`);
    return data;
  },

  async getTotalByContract(contractId: number): Promise<number> {
    const { data } = await api.get(`/payments/contract/${contractId}/total`);
    return data;
  },

  async getLastPayment(contractId: number): Promise<Payment | null> {
    const { data } = await api.get(`/payments/contract/${contractId}/last`);
    return data;
  },

  async create(payment: {
    contractId: number;
    scheduleId?: number;
    tipo: string;
    importe: number;
    fechaPago: string;
    medioPago: string;
    numeroOperacion?: string;
    notas?: string;
  }): Promise<Payment> {
    const { data } = await api.post('/payments', payment);
    return data;
  },
};
