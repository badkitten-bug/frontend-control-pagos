import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportService } from '../report.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getArrearsReport', () => {
    it('should fetch arrears report', async () => {
      const items = [{ placa: 'ABC-123', contractId: 1, cuotasVencidas: 2 }];
      mockApi.get.mockResolvedValue({ data: items });

      const result = await reportService.getArrearsReport({ placa: 'ABC-123' });

      expect(mockApi.get).toHaveBeenCalledWith('/reports/arrears', { params: { placa: 'ABC-123' } });
      expect(result).toEqual(items);
    });
  });

  describe('exportArrearsExcel', () => {
    it('should fetch excel blob', async () => {
      const blob = new Blob(['data']);
      mockApi.get.mockResolvedValue({ data: blob });

      const result = await reportService.exportArrearsExcel();

      expect(mockApi.get).toHaveBeenCalledWith('/reports/arrears/export/excel', {
        params: undefined,
        responseType: 'blob',
      });
      expect(result).toEqual(blob);
    });
  });

  describe('exportArrearsPdf', () => {
    it('should fetch pdf blob', async () => {
      const blob = new Blob(['pdf-data']);
      mockApi.get.mockResolvedValue({ data: blob });

      const result = await reportService.exportArrearsPdf();

      expect(mockApi.get).toHaveBeenCalledWith('/reports/arrears/export/pdf', {
        params: undefined,
        responseType: 'blob',
      });
      expect(result).toEqual(blob);
    });
  });

  describe('quickSearch', () => {
    it('should fetch quick search results by placa', async () => {
      const results = [{ placa: 'ABC-123', estado: 'Vendido' }];
      mockApi.get.mockResolvedValue({ data: results });

      const result = await reportService.quickSearch('ABC-123');

      expect(mockApi.get).toHaveBeenCalledWith('/reports/quick-search/ABC-123');
      expect(result).toEqual(results);
    });
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard stats', async () => {
      const stats = { totalVehiculos: 10, vehiculosDisponibles: 5 };
      mockApi.get.mockResolvedValue({ data: stats });

      const result = await reportService.getDashboardStats();

      expect(mockApi.get).toHaveBeenCalledWith('/reports/dashboard-stats');
      expect(result).toEqual(stats);
    });
  });

  describe('getTrafficLightReport', () => {
    it('should fetch traffic light report with filters', async () => {
      const items = [{ placa: 'XYZ-789', semaforo: 'rojo', diasAtraso: 30 }];
      mockApi.get.mockResolvedValue({ data: items });

      const result = await reportService.getTrafficLightReport({ semaforo: 'rojo' });

      expect(mockApi.get).toHaveBeenCalledWith('/reports/traffic-light', { params: { semaforo: 'rojo' } });
      expect(result).toEqual(items);
    });
  });
});
