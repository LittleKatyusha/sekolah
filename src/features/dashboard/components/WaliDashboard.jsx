import React from 'react'
import { Users, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react'
import Card from '../../../components/ui/Card'
import QuickActions from './QuickActions'

const WaliDashboard = ({ data }) => {
  const { profile, children } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Selamat Datang, {profile?.nama || 'Wali'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Dashboard Orang Tua / Wali
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!children || children.length === 0) ? (
          <Card>
            <p className="text-gray-500 text-sm">Tidak ada data anak ditemukan.</p>
          </Card>
        ) : (
          children.map((child) => (
            <Card key={child.id}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{child.nama}</h3>
                    <p className="text-sm text-gray-500">Kelas: {child.kelas || '-'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Kehadiran Hari Ini</span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${
                      child.absensi_hari_ini === 'Hadir' ? 'text-green-600' :
                      child.absensi_hari_ini === 'Belum Absen' ? 'text-gray-500' : 'text-red-600'
                    }`}>
                      {child.absensi_hari_ini === 'Hadir' ? <CheckCircle size={14} /> : 
                       child.absensi_hari_ini === 'Belum Absen' ? null : <AlertTriangle size={14} />}
                      {child.absensi_hari_ini}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tunggakan SPP</span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${
                      child.tunggakan_spp_count === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <DollarSign size={14} />
                      {child.tunggakan_spp_count === 0 ? 'Lunas' : `${child.tunggakan_spp_count} bulan`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <QuickActions role="wali" />
    </div>
  )
}

export default WaliDashboard