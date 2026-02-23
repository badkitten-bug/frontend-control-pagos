import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientService } from '../client.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('clientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all clients', async () => {
      const clients = [{ id: 1, dni: '12345678', nombres: 'Juan', apellidos: 'Pérez', activo: true }];
      mockApi.get.mockResolvedValue({ data: clients });

      const result = await clientService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/clients', { params: {} });
      expect(result).toEqual(clients);
    });

    it('should pass search param when provided', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      await clientService.getAll('Juan');

      expect(mockApi.get).toHaveBeenCalledWith('/clients', { params: { search: 'Juan' } });
    });
  });

  describe('getActive', () => {
    it('should fetch active clients', async () => {
      const clients = [{ id: 1, activo: true }];
      mockApi.get.mockResolvedValue({ data: clients });

      const result = await clientService.getActive();

      expect(mockApi.get).toHaveBeenCalledWith('/clients/active');
      expect(result).toEqual(clients);
    });
  });

  describe('getById', () => {
    it('should fetch client by id', async () => {
      const client = { id: 5, dni: '11111111', nombres: 'Ana' };
      mockApi.get.mockResolvedValue({ data: client });

      const result = await clientService.getById(5);

      expect(mockApi.get).toHaveBeenCalledWith('/clients/5');
      expect(result).toEqual(client);
    });
  });

  describe('getByDni', () => {
    it('should fetch client by DNI', async () => {
      const client = { id: 1, dni: '12345678' };
      mockApi.get.mockResolvedValue({ data: client });

      const result = await clientService.getByDni('12345678');

      expect(mockApi.get).toHaveBeenCalledWith('/clients/dni/12345678');
      expect(result).toEqual(client);
    });
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const newClient = { dni: '99999999', nombres: 'Nuevo', apellidos: 'Cliente' };
      const created = { id: 10, ...newClient, activo: true };
      mockApi.post.mockResolvedValue({ data: created });

      const result = await clientService.create(newClient);

      expect(mockApi.post).toHaveBeenCalledWith('/clients', newClient);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      const updates = { nombres: 'Updated' };
      const updated = { id: 1, nombres: 'Updated' };
      mockApi.put.mockResolvedValue({ data: updated });

      const result = await clientService.update(1, updates);

      expect(mockApi.put).toHaveBeenCalledWith('/clients/1', updates);
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a client', async () => {
      mockApi.delete.mockResolvedValue({});

      await clientService.delete(1);

      expect(mockApi.delete).toHaveBeenCalledWith('/clients/1');
    });
  });
});
