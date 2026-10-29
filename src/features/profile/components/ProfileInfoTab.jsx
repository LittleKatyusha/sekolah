import { useState, useEffect } from 'react'
import { User, Save, Loader2, IdCard } from 'lucide-react'
import { profileService } from '../../../services/profileService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import useAuthStore from '../../../store/useAuthStore'

const normalizeGenderCode = (val) => {
  if (val === null || val === undefined || val === '') return ''
  const s = String(val).toUpperCase()
  if (s === '1' || s === 'L' || s.startsWith('LAKI')) return '1'
  if (s === '2' || s === 'P' || s.startsWith('PEREM')) return '2'
  return String(val)
}

const getGenderLabel = (val) => {
  const code = normalizeGenderCode(val)
  if (code === '1') return 'Laki-laki'
  if (code === '2') return 'Perempuan'
  return '-'
}

export default function ProfileInfoTab({ profileData, onRefresh }) {
  const updateUser = useAuthStore((s) => s.updateUser)
  const user = profileData?.user || {}
  const siswa = profileData?.siswa
  const guru = profileData?.guru

  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    no_hp: siswa?.no_hp || guru?.no_hp || '',
    alamat: siswa?.alamat || '',
    tempat_lahir: siswa?.tempat_lahir || '',
    tanggal_lahir: siswa?.tanggal_lahir || '',
    jenis_kelamin: normalizeGenderCode(siswa?.jenis_kelamin ?? guru?.jenis_kelamin),
    agama: siswa?.agama || '',
    golongan_darah: siswa?.golongan_darah || '',
    tinggi_badan: siswa?.tinggi_badan || '',
    berat_badan: siswa?.berat_badan || '',
    anak_ke: siswa?.anak_ke || '',
  })

  useEffect(() => {
    setFormData({
      name: user.name || '',
      no_hp: siswa?.no_hp || guru?.no_hp || '',
      alamat: siswa?.alamat || '',
      tempat_lahir: siswa?.tempat_lahir || '',
      tanggal_lahir: siswa?.tanggal_lahir || '',
      jenis_kelamin: normalizeGenderCode(siswa?.jenis_kelamin ?? guru?.jenis_kelamin),
      agama: siswa?.agama || '',
      golongan_darah: siswa?.golongan_darah || '',
      tinggi_badan: siswa?.tinggi_badan || '',
      berat_badan: siswa?.berat_badan || '',
      anak_ke: siswa?.anak_ke || '',
    })
  }, [profileData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showError('Nama lengkap wajib diisi.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        jenis_kelamin: formData.jenis_kelamin ? Number(formData.jenis_kelamin) : null,
      }
      const res = await profileService.updateProfile(payload)
      if (res?.user) {
        updateUser({ name: res.user.name })
      }
      showSuccess('Profil berhasil diperbarui!')
      onRefresh?.()
    } catch (err) {
      showError(err?.response?.data?.message || 'Gagal memperbarui profil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-gray-100 dark:border-gray-700 space-y-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <User size={18} className="text-primary-600" />
          Informasi Akun
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={user.username || ''}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
              No. Telepon / WhatsApp
            </label>
            <input
              type="tel"
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              placeholder="08..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {siswa && (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 pt-2">
              <IdCard size={18} className="text-primary-600" />
              Data Siswa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  NIS / NISN
                </label>
                <input
                  type="text"
                  value={`${siswa.nis || '-'} / ${siswa.nisn || '-'}`}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Kelas
                </label>
                <input
                  type="text"
                  value={siswa.kelas?.nama_kelas || '-'}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="jenis_kelamin"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5"
                >
                  Jenis Kelamin
                </label>
                <select
                  id="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Pilih</option>
                  <option value="1">Laki-laki</option>
                  <option value="2">Perempuan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Alamat
              </label>
              <textarea
                rows={2}
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {guru && (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 pt-2">
              <IdCard size={18} className="text-primary-600" />
              Data Guru
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  NIP
                </label>
                <input
                  type="text"
                  value={guru.nip || '-'}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Jenis Kelamin
                </label>
                <input
                  type="text"
                  value={getGenderLabel(guru.jenis_kelamin)}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </form>
  )
}
