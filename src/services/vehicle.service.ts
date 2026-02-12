import api from './api';
import type { Vehicle, VehicleMileage, PaginatedResponse } from '../types';

export const vehicleService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    placa?: string;
    marca?: string;
    modelo?: string;
    anio?: number;
    estado?: string;
  }): Promise<PaginatedResponse<Vehicle>> {
    const { data } = await api.get('/vehicles', { params });
    return data;
  },

  async getById(id: number): Promise<Vehicle> {
    const { data } = await api.get(`/vehicles/${id}`);
    return data;
  },

  async getByPlaca(placa: string): Promise<Vehicle> {
    const { data } = await api.get(`/vehicles/placa/${placa}`);
    return data;
  },

  async getAvailable(): Promise<Vehicle[]> {
    const { data } = await api.get('/vehicles/available');
    return data;
  },

  async create(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const { data } = await api.post('/vehicles', vehicle);
    return data;
  },

  async update(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const { data } = await api.put(`/vehicles/${id}`, vehicle);
    return data;
  },

  async updateMileage(id: number, kilometraje: number, observacion?: string): Promise<Vehicle> {
    const { data } = await api.patch(`/vehicles/${id}/mileage`, { kilometraje, observacion });
    return data;
  },

  async getMileageHistory(id: number): Promise<VehicleMileage[]> {
    const { data } = await api.get(`/vehicles/${id}/mileage-history`);
    return data;
  },
};
