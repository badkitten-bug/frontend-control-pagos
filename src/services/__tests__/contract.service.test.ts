import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contractService } from '../contract.service';
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

describe('contractService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch paginated contracts', async () => {
      const response = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      mockApi.get.mockResolvedValue({ data: response });

      const result = await contractService.getAll({ page: 1, limit: 10 });

      expect(mockApi.get).toHaveBeenCalledWith('/contracts', { params: { page: 1, limit: 10 } });
      expect(result).toEqual(response);
    });
  });

  describe('getById', () => {
    it('should fetch contract by id', async () => {
      const contract = { id: 1, vehicleId: 1, estado: 'Vigente' };
      mockApi.get.mockResolvedValue({ data: contract });

      const result = await contractService.getById(1);

      expect(mockApi.get).toHaveBeenCalledWith('/contracts/1');
      expect(result).toEqual(contract);
    });
  });

  describe('getByVehicle', () => {
    it('should fetch contracts by vehicle id', async () => {
      const contracts = [{ id: 1, vehicleId: 5 }];
      mockApi.get.mockResolvedValue({ data: contracts });

      const result = await contractService.getByVehicle(5);

      expect(mockApi.get).toHaveBeenCalledWith('/contracts/vehicle/5');
      expect(result).toEqual(contracts);
    });
  });

  describe('create', () => {
    it('should create a new contract', async () => {
      const contractData = {
        vehicleId: 1,
        fechaInicio: '2026-01-01',
        precio: 50000,
        pagoInicial: 10000,
        numeroCuotas: 12,
        frecuencia: 'Mensual',
      };
      const created = { id: 1, ...contractData, estado: 'Borrador' };
      mockApi.post.mockResolvedValue({ data: created });

      const result = await contractService.create(contractData);

      expect(mockApi.post).toHaveBeenCalledWith('/contracts', contractData);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update a contract', async () => {
      const updates = { observaciones: 'Updated' };
      mockApi.put.mockResolvedValue({ data: { id: 1, ...updates } });

      const result = await contractService.update(1, updates);

      expect(mockApi.put).toHaveBeenCalledWith('/contracts/1', updates);
      expect(result).toEqual({ id: 1, ...updates });
    });
  });

  describe('activate', () => {
    it('should activate a contract', async () => {
      const activated = { id: 1, estado: 'Vigente' };
      mockApi.patch.mockResolvedValue({ data: activated });

      const result = await contractService.activate(1);

      expect(mockApi.patch).toHaveBeenCalledWith('/contracts/1/activate');
      expect(result).toEqual(activated);
    });
  });

  describe('cancel', () => {
    it('should cancel a contract', async () => {
      const cancelled = { id: 1, estado: 'Cancelado' };
      mockApi.patch.mockResolvedValue({ data: cancelled });

      const result = await contractService.cancel(1);

      expect(mockApi.patch).toHaveBeenCalledWith('/contracts/1/cancel');
      expect(result).toEqual(cancelled);
    });
  });

  describe('annul', () => {
    it('should annul a contract', async () => {
      const annulled = { id: 1, estado: 'Anulado' };
      mockApi.patch.mockResolvedValue({ data: annulled });

      const result = await contractService.annul(1);

      expect(mockApi.patch).toHaveBeenCalledWith('/contracts/1/annul');
      expect(result).toEqual(annulled);
    });
  });

  describe('getSchedule', () => {
    it('should fetch payment schedule for a contract', async () => {
      const schedule = [{ id: 1, contractId: 1, numeroCuota: 1, total: 5000 }];
      mockApi.get.mockResolvedValue({ data: schedule });

      const result = await contractService.getSchedule(1);

      expect(mockApi.get).toHaveBeenCalledWith('/payment-schedules/contract/1');
      expect(result).toEqual(schedule);
    });
  });
});
