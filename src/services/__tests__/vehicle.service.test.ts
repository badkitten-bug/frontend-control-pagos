import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vehicleService } from '../vehicle.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('vehicleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch paginated vehicles', async () => {
      const response = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      mockApi.get.mockResolvedValue({ data: response });

      const result = await vehicleService.getAll({ page: 1, limit: 10 });

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles', { params: { page: 1, limit: 10 } });
      expect(result).toEqual(response);
    });

    it('should filter by placa', async () => {
      mockApi.get.mockResolvedValue({ data: { items: [] } });

      await vehicleService.getAll({ placa: 'ABC-123' });

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles', { params: { placa: 'ABC-123' } });
    });
  });

  describe('getById', () => {
    it('should fetch vehicle by id', async () => {
      const vehicle = { id: 1, placa: 'ABC-123', marca: 'Toyota' };
      mockApi.get.mockResolvedValue({ data: vehicle });

      const result = await vehicleService.getById(1);

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/1');
      expect(result).toEqual(vehicle);
    });
  });

  describe('getByPlaca', () => {
    it('should fetch vehicle by placa', async () => {
      const vehicle = { id: 1, placa: 'XYZ-789' };
      mockApi.get.mockResolvedValue({ data: vehicle });

      const result = await vehicleService.getByPlaca('XYZ-789');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/placa/XYZ-789');
      expect(result).toEqual(vehicle);
    });
  });

  describe('getAvailable', () => {
    it('should fetch available vehicles', async () => {
      const vehicles = [{ id: 1, estado: 'Disponible' }];
      mockApi.get.mockResolvedValue({ data: vehicles });

      const result = await vehicleService.getAvailable();

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/available');
      expect(result).toEqual(vehicles);
    });
  });

  describe('create', () => {
    it('should create a new vehicle', async () => {
      const vehicleData = { placa: 'NEW-001', marca: 'Honda', modelo: 'Civic', anio: 2025 };
      const created = { id: 10, ...vehicleData, estado: 'Disponible' };
      mockApi.post.mockResolvedValue({ data: created });

      const result = await vehicleService.create(vehicleData);

      expect(mockApi.post).toHaveBeenCalledWith('/vehicles', vehicleData);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update a vehicle', async () => {
      const updates = { color: 'Rojo' };
      mockApi.put.mockResolvedValue({ data: { id: 1, ...updates } });

      const result = await vehicleService.update(1, updates);

      expect(mockApi.put).toHaveBeenCalledWith('/vehicles/1', updates);
      expect(result).toEqual({ id: 1, ...updates });
    });
  });

  describe('updateMileage', () => {
    it('should update vehicle mileage', async () => {
      const updated = { id: 1, kilometraje: 50000 };
      mockApi.patch.mockResolvedValue({ data: updated });

      const result = await vehicleService.updateMileage(1, 50000, 'Revisión técnica');

      expect(mockApi.patch).toHaveBeenCalledWith('/vehicles/1/mileage', {
        kilometraje: 50000,
        observacion: 'Revisión técnica',
      });
      expect(result).toEqual(updated);
    });
  });

  describe('getMileageHistory', () => {
    it('should fetch mileage history', async () => {
      const history = [{ id: 1, vehicleId: 1, kilometrajeAnterior: 40000, kilometrajeNuevo: 50000 }];
      mockApi.get.mockResolvedValue({ data: history });

      const result = await vehicleService.getMileageHistory(1);

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/1/mileage-history');
      expect(result).toEqual(history);
    });
  });
});
