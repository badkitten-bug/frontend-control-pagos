import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService } from '../payment.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch paginated payments', async () => {
      const response = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      mockApi.get.mockResolvedValue({ data: response });

      const result = await paymentService.getAll({ page: 1, limit: 10 });

      expect(mockApi.get).toHaveBeenCalledWith('/payments', { params: { page: 1, limit: 10 } });
      expect(result).toEqual(response);
    });

    it('should filter by contractId and date range', async () => {
      mockApi.get.mockResolvedValue({ data: { items: [] } });

      await paymentService.getAll({ contractId: 5, fechaDesde: '2026-01-01', fechaHasta: '2026-12-31' });

      expect(mockApi.get).toHaveBeenCalledWith('/payments', {
        params: { contractId: 5, fechaDesde: '2026-01-01', fechaHasta: '2026-12-31' },
      });
    });
  });

  describe('getByContract', () => {
    it('should fetch payments by contract id', async () => {
      const payments = [{ id: 1, contractId: 3, importe: 1000 }];
      mockApi.get.mockResolvedValue({ data: payments });

      const result = await paymentService.getByContract(3);

      expect(mockApi.get).toHaveBeenCalledWith('/payments/contract/3');
      expect(result).toEqual(payments);
    });
  });

  describe('getTotalByContract', () => {
    it('should fetch total paid for a contract', async () => {
      mockApi.get.mockResolvedValue({ data: 25000 });

      const result = await paymentService.getTotalByContract(3);

      expect(mockApi.get).toHaveBeenCalledWith('/payments/contract/3/total');
      expect(result).toBe(25000);
    });
  });

  describe('getLastPayment', () => {
    it('should fetch the last payment for a contract', async () => {
      const lastPayment = { id: 10, contractId: 3, importe: 500 };
      mockApi.get.mockResolvedValue({ data: lastPayment });

      const result = await paymentService.getLastPayment(3);

      expect(mockApi.get).toHaveBeenCalledWith('/payments/contract/3/last');
      expect(result).toEqual(lastPayment);
    });

    it('should return null when no payments exist', async () => {
      mockApi.get.mockResolvedValue({ data: null });

      const result = await paymentService.getLastPayment(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const paymentData = {
        contractId: 1,
        tipo: 'Cuota',
        importe: 5000,
        fechaPago: '2026-02-01',
        medioPago: 'Efectivo',
      };
      const created = { id: 1, ...paymentData };
      mockApi.post.mockResolvedValue({ data: created });

      const result = await paymentService.create(paymentData);

      expect(mockApi.post).toHaveBeenCalledWith('/payments', paymentData);
      expect(result).toEqual(created);
    });
  });
});
