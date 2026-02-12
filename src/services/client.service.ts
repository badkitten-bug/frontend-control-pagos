import api from './api';

export interface Client {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  telefonoSecundario?: string;
  email?: string;
  direccion?: string;
  fechaNacimiento?: string;
  ocupacion?: string;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  telefonoSecundario?: string;
  email?: string;
  direccion?: string;
  fechaNacimiento?: string;
  ocupacion?: string;
  observaciones?: string;
}

export const clientService = {
  getAll: async (search?: string): Promise<Client[]> => {
    const params = search ? { search } : {};
    const response = await api.get('/clients', { params });
    return response.data;
  },

  getActive: async (): Promise<Client[]> => {
    const response = await api.get('/clients/active');
    return response.data;
  },

  getById: async (id: number): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  getByDni: async (dni: string): Promise<Client | null> => {
    const response = await api.get(`/clients/dni/${dni}`);
    return response.data;
  },

  create: async (data: CreateClientDto): Promise<Client> => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateClientDto>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};
