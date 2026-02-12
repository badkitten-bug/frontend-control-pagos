import api from './api';
import type { Subcontract, CreateSubcontractDto, PaginatedResponse } from '../types';

export const subcontractService = {
  async create(data: CreateSubcontractDto): Promise<Subcontract> {
    const response = await api.post<Subcontract>('/subcontracts', data);
    return response.data;
  },

  async getByContract(contractId: number): Promise<Subcontract[]> {
    const response = await api.get<Subcontract[]>(`/subcontracts/contract/${contractId}`);
    return response.data;
  },

  async getById(id: number): Promise<Subcontract> {
    const response = await api.get<Subcontract>(`/subcontracts/${id}`);
    return response.data;
  },

  async annul(id: number): Promise<Subcontract> {
    const response = await api.delete<Subcontract>(`/subcontracts/${id}`);
    return response.data;
  },

  async getPendingBalance(id: number): Promise<number> {
    const response = await api.get<number>(`/subcontracts/${id}/balance`);
    return response.data;
  },

  async getAll(params?: { 
    page?: number; 
    limit?: number; 
    parentContractId?: number 
  }): Promise<PaginatedResponse<Subcontract>> {
    const response = await api.get<PaginatedResponse<Subcontract>>('/subcontracts', { params });
    return response.data;
  },

  async paySchedule(scheduleId: number, data: {
    monto: number;
    fechaPago: string;
    medioPago: string;
    numeroOperacion?: string;
    notas?: string;
  }): Promise<any> {
    const response = await api.post(`/subcontracts/schedule/${scheduleId}/pay`, data);
    return response.data;
  },
};
