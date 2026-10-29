import { useState, useRef } from 'react'
import { User, Upload, Save, Loader2 } from 'lucide-react'
import { profileService } from '../../../services/profileService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import useAuthStore from '../../../store/useAuthStore'

export default function ProfileAvatarTab({ profileData, onRefresh }) {
  const authUser = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const currentAvatar = previewUrl || profileData?.user?.avatar || authUser?.avatar

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('File harus berupa gambar (JPG, PNG, WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Ukuran file maksimal 5MB.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const res = await profileService.uploadAvatar(selectedFile)
      if (res?.avatar) {
        updateUser({ avatar: res.avatar })
      }
      showSuccess('Foto profil berhasil diperbarui!')
      setSelectedFile(null)
      onRefresh?.()
    } catch (err) {
      showError(err?.response?.data?.message || 'Gagal mengunggah foto profil.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-gray-100 dark:border-gray-700 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Perbarui Foto Profil
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pilih foto berformat JPEG, PNG, atau WEBP dengan ukuran maksimal 5MB.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-primary-500/20 flex items-center justify-center shrink-0 shadow-inner">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={48} className="text-gray-400" />
          )}
        </div>

        <div className="space-y-3 text-center sm:text-left flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Upload size={16} />
              <span>Pilih Gambar</span>
            </button>

            {selectedFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Simpan Foto</span>
                  </>
                )}
              </button>
            )}
          </div>

          {selectedFile ? (
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              File terpilih: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              Belum ada file baru yang dipilih.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
