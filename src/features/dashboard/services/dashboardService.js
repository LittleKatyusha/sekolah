import { apiService } from '../../../utils/api';

const dashboardQuery = (filters) => {
  const params = new URLSearchParams();
  if (filters.tahun_ajaran_id) params.set('tahun_ajaran_id', filters.tahun_ajaran_id);
  if (filters.mst_kelas_id) params.set('mst_kelas_id', filters.mst_kelas_id);
  return params.toString();
};

const getDashboardResource = async (path, filters, fallbackMessage) => {
  const query = dashboardQuery(filters);
  const { data, error } = await apiService.get(`${path}${query ? `?${query}` : ''}`);
  if (error) throw new Error(error.message || fallbackMessage);
  if (data?.success) return data.data;
  throw new Error(data?.message || fallbackMessage);
};

export const dashboardService = {
  getDashboardData: async (filters = {}) => {
    return getDashboardResource('/dashboard/', filters, 'Dashboard tidak dapat dimuat.');
  },

  getSummaryCards: async (filters = {}) => {
    return getDashboardResource('/dashboard/summary-cards', filters, 'Ringkasan dashboard tidak dapat dimuat.');
  },

  getFinancialAnalytics: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran_id) params.append('tahun_ajaran_id', filters.tahun_ajaran_id);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/financial-analytics${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch financial analytics');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch financial analytics');
    } catch (error) {
      throw error;
    }
  },

  getAcademicAttendance: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran_id) params.append('tahun_ajaran_id', filters.tahun_ajaran_id);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/academic-attendance${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch academic attendance');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch academic attendance');
    } catch (error) {
      throw error;
    }
  },

  getCounselingInsights: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran_id) params.append('tahun_ajaran_id', filters.tahun_ajaran_id);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/counseling-insights${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch counseling insights');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch counseling insights');
    } catch (error) {
      throw error;
    }
  },

  getPpdbInsights: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran_id) params.append('tahun_ajaran_id', filters.tahun_ajaran_id);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/ppdb-insights${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch PPDB insights');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch PPDB insights');
    } catch (error) {
      throw error;
    }
  },
};
