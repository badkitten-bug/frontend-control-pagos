import api from './api';
import type { ArrearsReportItem, QuickSearchResult, TrafficLightItem, SemaforoStatus, DashboardStats } from '../types';

export const reportService = {
  async getArrearsReport(params?: {
    fechaDesde?: string;
    fechaHasta?: string;
    frecuencia?: string;
    estado?: string;
    placa?: string;
  }): Promise<ArrearsReportItem[]> {
    const { data } = await api.get('/reports/arrears', { params });
    return data;
  },

  async exportArrearsExcel(params?: {
    fechaDesde?: string;
    fechaHasta?: string;
    frecuencia?: string;
    estado?: string;
    placa?: string;
  }): Promise<Blob> {
    const { data } = await api.get('/reports/arrears/export/excel', {
      params,
      responseType: 'blob',
    });
    return data;
  },

  async exportArrearsPdf(params?: {
    fechaDesde?: string;
    fechaHasta?: string;
    frecuencia?: string;
    estado?: string;
    placa?: string;
  }): Promise<Blob> {
    const { data } = await api.get('/reports/arrears/export/pdf', {
      params,
      responseType: 'blob',
    });
    return data;
  },

  async quickSearch(placa: string): Promise<QuickSearchResult[]> {
    const { data } = await api.get(`/reports/quick-search/${placa}`);
    return data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await api.get('/reports/dashboard-stats');
    return data;
  },

  async getTrafficLightReport(params?: {
    semaforo?: SemaforoStatus;
    placa?: string;
    frecuencia?: string;
  }): Promise<TrafficLightItem[]> {
    const { data } = await api.get('/reports/traffic-light', { params });
    return data;
  },
};
