import { useState, useRef, useEffect } from 'react'
import { Upload, X, File, Image as ImageIcon } from 'lucide-react'
import Button from './Button'
import { fileUploadService } from '../../services/fileUploadService'

const isImageFile = (url, f) => {
  if (f?.type?.startsWith('image/')) return true
  if (!url || typeof url !== 'string') return false
  if (url.startsWith('data:image/')) return true
  return /\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(url)
}

const FileUpload = ({
  label,
  onUpload,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = '',
  previewUrl: initialPreviewUrl = null,
  folder = '',
  error: propError = null,
}) => {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setPreviewUrl(initialPreviewUrl)
  }, [initialPreviewUrl])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validate size
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
      return
    }

    // Validate type
    if (accept && accept !== '*' && accept !== '*/*') {
      const types = accept.split(',').map((t) => t.trim().toLowerCase())
      const fileName = selectedFile.name.toLowerCase()
      const fileType = (selectedFile.type || '').toLowerCase()

      const isMatch = types.some((type) => {
        if (type === '*' || type === '*/*') return true
        if (type.startsWith('.')) return fileName.endsWith(type)
        if (type.endsWith('/*')) return fileType.startsWith(type.slice(0, -1))
        return fileType === type
      })

      if (!isMatch) {
        setError('Invalid file type')
        return
      }
    }

    setFile(selectedFile)
    setError(null)

    // Create preview if it's an image
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreviewUrl(null)
    }

    // Auto upload
    handleUpload(selectedFile)
  }

  const handleUpload = async (fileToUpload) => {
    setUploading(true)
    setProgress(0)
    setError(null)

    // Simulate progress since axios interceptors might hide actual upload progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const { data, error: uploadError } = await fileUploadService.uploadFile(fileToUpload, folder)
      
      clearInterval(progressInterval)
      
      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed')
      }

      setProgress(100)
      const filePath = data?.data?.file_path || data?.data?.url || data?.data?.path || data?.file_path || data?.path || data?.url
      if (onUpload) {
        onUpload(filePath)
      }
      if (!fileToUpload.type.startsWith('image/')) {
        setPreviewUrl(filePath)
      }
    } catch (err) {
      clearInterval(progressInterval)
      setError(err.message)
      setPreviewUrl(initialPreviewUrl)
      setFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onUpload) {
      onUpload(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const displayError = error || propError
  const hasPreview = Boolean(previewUrl || file)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={accept}
          className="hidden"
        />

        {!hasPreview ? (
          <div
            onClick={triggerFileInput}
            className={`
              border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
              ${displayError ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 hover:border-primary-500 dark:border-gray-600 dark:hover:border-primary-500'}
            `}
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Klik untuk mengunggah atau seret file ke sini
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Maksimal: {maxSize / 1024 / 1024}MB
            </p>
          </div>
        ) : (
          <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {previewUrl && isImageFile(previewUrl, file) ? (
              <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 object-contain"
                />
              </div>
            ) : (
              <div className="p-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-800">
                <File className="w-8 h-8 text-primary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file?.name || (typeof previewUrl === 'string' ? previewUrl.split('/').pop() : 'Berkas')}
                  </p>
                  {file?.size ? (
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  ) : previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-block truncate max-w-full"
                    >
                      Lihat berkas terunggah
                    </a>
                  ) : null}
                </div>
              </div>
            )}

            {/* Overlay actions */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Hapus file"
                className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {displayError && (
          <p className="mt-1 text-sm text-red-500">
            {displayError}
          </p>
        )}
      </div>
    </div>
  )
}

export default FileUpload