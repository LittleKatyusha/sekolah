import { apiService } from '../../../utils/api';

export const dashboardService = {
  getDashboardData: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.tahun_ajaran) {
        params.append('tahun_ajaran', filters.tahun_ajaran);
      }

      if (filters.mst_kelas_id) {
        params.append('mst_kelas_id', filters.mst_kelas_id);
      }

      const queryString = params.toString();
      const url = `/dashboard/${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);

      if (error) {
        throw new Error(error.message || 'Failed to fetch dashboard data');
      }

      if (data && data.success) {
        return data.data;
      } else {
        throw new Error(data?.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  },

  getSummaryCards: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran) params.append('tahun_ajaran', filters.tahun_ajaran);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/summary-cards${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch summary cards');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch summary cards');
    } catch (error) {
      console.error('Failed to fetch summary cards:', error);
      throw error;
    }
  },

  getFinancialAnalytics: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran) params.append('tahun_ajaran', filters.tahun_ajaran);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/financial-analytics${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch financial analytics');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch financial analytics');
    } catch (error) {
      console.error('Failed to fetch financial analytics:', error);
      throw error;
    }
  },

  getAcademicAttendance: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran) params.append('tahun_ajaran', filters.tahun_ajaran);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/academic-attendance${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch academic attendance');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch academic attendance');
    } catch (error) {
      console.error('Failed to fetch academic attendance:', error);
      throw error;
    }
  },

  getCounselingInsights: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran) params.append('tahun_ajaran', filters.tahun_ajaran);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/counseling-insights${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch counseling insights');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch counseling insights');
    } catch (error) {
      console.error('Failed to fetch counseling insights:', error);
      throw error;
    }
  },

  getPpdbInsights: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.tahun_ajaran) params.append('tahun_ajaran', filters.tahun_ajaran);
      if (filters.mst_kelas_id) params.append('mst_kelas_id', filters.mst_kelas_id);
      const queryString = params.toString();
      const url = `/dashboard/ppdb-insights${queryString ? `?${queryString}` : ''}`;

      const { data, error } = await apiService.get(url);
      if (error) throw new Error(error.message || 'Failed to fetch PPDB insights');
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Failed to fetch PPDB insights');
    } catch (error) {
      console.error('Failed to fetch PPDB insights:', error);
      throw error;
    }
  },
};