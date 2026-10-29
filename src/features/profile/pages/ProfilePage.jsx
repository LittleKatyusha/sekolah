import { useState, useEffect } from 'react'
import {
  User,
  Camera,
  KeyRound,
  History,
  Loader2,
  Mail,
  School,
} from 'lucide-react'
import useAuthStore from '../../../store/useAuthStore'
import { profileService } from '../../../services/profileService'
import { showError } from '../../../utils/sweetalert'
import ProfileInfoTab from '../components/ProfileInfoTab'
import ProfileAvatarTab from '../components/ProfileAvatarTab'
import ProfilePasswordTab from '../components/ProfilePasswordTab'
import ProfileLogsTab from '../components/ProfileLogsTab'

const TABS = [
  { id: 'info', label: 'Informasi Umum', icon: User },
  { id: 'avatar', label: 'Foto Profil', icon: Camera },
  { id: 'password', label: 'Kata Sandi', icon: KeyRound },
  { id: 'logs', label: 'Riwayat Aktivitas', icon: History },
]

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile()
      setProfileData(data)
    } catch (err) {
      showError(err?.response?.data?.message || 'Gagal memuat profil.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const user = profileData?.user || authUser || {}

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-sm text-gray-500">Memuat data profil...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-primary-500/30 flex items-center justify-center shadow-md">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTab('avatar')}
              title="Ubah Foto Profil"
              className="absolute -bottom-2 -right-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-transform transform active:scale-95"
            >
              <Camera size={16} />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.name || 'Pengguna'}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 self-center sm:self-auto">
                {user.role || 'Member'}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail size={14} className="shrink-0" />
              <span>{user.email || '-'}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>@{user.username || 'username'}</span>
            </p>

            {user.tenant?.name && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                <School size={14} className="text-gray-400" />
                <span>{user.tenant.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'info' && (
        <ProfileInfoTab profileData={profileData} onRefresh={fetchProfile} />
      )}
      {activeTab === 'avatar' && (
        <ProfileAvatarTab profileData={profileData} onRefresh={fetchProfile} />
      )}
      {activeTab === 'password' && <ProfilePasswordTab />}
      {activeTab === 'logs' && <ProfileLogsTab />}
    </div>
  )
}
