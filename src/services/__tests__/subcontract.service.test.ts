import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subcontractService } from '../subcontract.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('subcontractService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new subcontract', async () => {
      const data = {
        parentContractId: 1,
        tipo: 'Mantenimiento',
        modalidad: 'Independiente' as const,
        monto: 5000,
        fechaInicio: '2026-01-01',
      };
      const created = { id: 1, ...data, estado: 'Vigente' };
      mockApi.post.mockResolvedValue({ data: created });

      const result = await subcontractService.create(data);

      expect(mockApi.post).toHaveBeenCalledWith('/subcontracts', data);
      expect(result).toEqual(created);
    });
  });

  describe('getByContract', () => {
    it('should fetch subcontracts by parent contract', async () => {
      const subs = [{ id: 1, parentContractId: 5 }];
      mockApi.get.mockResolvedValue({ data: subs });

      const result = await subcontractService.getByContract(5);

      expect(mockApi.get).toHaveBeenCalledWith('/subcontracts/contract/5');
      expect(result).toEqual(subs);
    });
  });

  describe('getById', () => {
    it('should fetch subcontract by id', async () => {
      const sub = { id: 3, parentContractId: 1 };
      mockApi.get.mockResolvedValue({ data: sub });

      const result = await subcontractService.getById(3);

      expect(mockApi.get).toHaveBeenCalledWith('/subcontracts/3');
      expect(result).toEqual(sub);
    });
  });

  describe('annul', () => {
    it('should annul a subcontract', async () => {
      const annulled = { id: 1, estado: 'Anulado' };
      mockApi.delete.mockResolvedValue({ data: annulled });

      const result = await subcontractService.annul(1);

      expect(mockApi.delete).toHaveBeenCalledWith('/subcontracts/1');
      expect(result).toEqual(annulled);
    });
  });

  describe('getPendingBalance', () => {
    it('should fetch pending balance', async () => {
      mockApi.get.mockResolvedValue({ data: 3500 });

      const result = await subcontractService.getPendingBalance(1);

      expect(mockApi.get).toHaveBeenCalledWith('/subcontracts/1/balance');
      expect(result).toBe(3500);
    });
  });

  describe('getAll', () => {
    it('should fetch all subcontracts paginated', async () => {
      const response = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      mockApi.get.mockResolvedValue({ data: response });

      const result = await subcontractService.getAll({ page: 1, limit: 10 });

      expect(mockApi.get).toHaveBeenCalledWith('/subcontracts', { params: { page: 1, limit: 10 } });
      expect(result).toEqual(response);
    });
  });

  describe('paySchedule', () => {
    it('should pay a schedule item', async () => {
      const payData = {
        monto: 1000,
        fechaPago: '2026-02-15',
        medioPago: 'Efectivo',
      };
      const result_data = { id: 1, ...payData };
      mockApi.post.mockResolvedValue({ data: result_data });

      const result = await subcontractService.paySchedule(10, payData);

      expect(mockApi.post).toHaveBeenCalledWith('/subcontracts/schedule/10/pay', payData);
      expect(result).toEqual(result_data);
    });
  });
});
