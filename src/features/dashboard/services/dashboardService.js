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

  // Legacy method for backward compatibility
  getStats: async (role) => {
    // For backward compatibility with old dashboard implementation
    // This can be removed once all components use getDashboardData
    try {
      const data = await dashboardService.getDashboardData();
      
      // Transform new API response to old format for specific roles
      if (!data) {
        throw new Error('No dashboard data available');
      }

      // Return minimal compatible structure
      return {
        totalStudents: data.summary_cards?.total_siswa_aktif || 0,
        totalTeachers: data.summary_cards?.total_guru || 0,
        totalClasses: data.summary_cards?.total_kelas || 0,
        activeUsersToday: 0,
        recentActivities: [],
        attendanceTrend: []
      };
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  }
};