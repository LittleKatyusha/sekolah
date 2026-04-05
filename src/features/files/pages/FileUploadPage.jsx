import { useState, useRef } from 'react'
import { Upload, Trash2, Download, File, Image, FileText, Film, Music, Archive, X, CheckCircle, AlertCircle } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { fileUploadService } from '../../../services/fileUploadService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const getFileIcon = (type) => {
  if (!type) return File
  if (type.startsWith('image/')) return Image
  if (type.startsWith('video/')) return Film
  if (type.startsWith('audio/')) return Music
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive
  return File
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const FileUploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [presignedPath, setPresignedPath] = useState('')
  const [presignedUrl, setPresignedUrl] = useState('')
  const [deletePath, setDeletePath] = useState('')
  const fileInputRef = useRef(null)

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const entry = { id: Date.now() + Math.random(), name: file.name, size: file.size, type: file.type, status: 'uploading', path: null, error: null }
      setUploadedFiles(prev => [...prev, entry])
      try {
        const { data, error } = await fileUploadService.uploadFile(file)
        if (data?.data) {
          setUploadedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'success', path: data.data.path || data.data.file_path } : f))
        } else {
          setUploadedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'error', error: error?.message || 'Upload gagal' } : f))
        }
      } catch (err) {
        setUploadedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'error', error: 'Upload gagal' } : f))
      }
    }
    setUploading(false)
  }

  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files) }
  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true) }
  const handleDragLeave = () => setDragActive(false)

  const handleDeleteFile = async (file) => {
    if (!file.path) { setUploadedFiles(prev => prev.filter(f => f.id !== file.id)); return }
    const result = await showDeleteConfirm(file.name)
    if (result.isConfirmed) {
      const { error } = await fileUploadService.deleteFile(file.path)
      if (!error) { showSuccess('File berhasil dihapus!'); setUploadedFiles(prev => prev.filter(f => f.id !== file.id)) }
      else showError('Gagal menghapus file')
    }
  }

  const handleGetPresignedUrl = async () => {
    if (!presignedPath.trim()) return
    const { data, error } = await fileUploadService.getPresignedUrl(presignedPath.trim())
    if (data?.data?.url) { setPresignedUrl(data.data.url); showSuccess('URL berhasil dibuat!') }
    else showError(error?.message || 'Gagal membuat presigned URL')
  }

  const handleDeleteByPath = async () => {
    if (!deletePath.trim()) return
    const result = await showDeleteConfirm(deletePath)
    if (result.isConfirmed) {
      const { error } = await fileUploadService.deleteFile(deletePath.trim())
      if (!error) { showSuccess('File berhasil dihapus!'); setDeletePath('') }
      else showError('Gagal menghapus file')
    }
  }

  const removeFromList = (id) => setUploadedFiles(prev => prev.filter(f => f.id !== id))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File Upload</h1>

      {/* Upload Area */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload File</h2>
          <PermissionGuard permission="files.create">
            <div
              onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Drag & drop file di sini</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">atau klik untuk memilih file</p>
              <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
            </div>
          </PermissionGuard>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">File yang diupload</h3>
              {uploadedFiles.map(file => {
                const Icon = getFileIcon(file.type)
                return (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Icon size={20} className="text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                      {file.path && <p className="text-xs text-gray-400 truncate mt-0.5">Path: {file.path}</p>}
                      {file.error && <p className="text-xs text-red-500 mt-0.5">{file.error}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {file.status === 'uploading' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>}
                      {file.status === 'success' && <CheckCircle size={20} className="text-green-500" />}
                      {file.status === 'error' && <AlertCircle size={20} className="text-red-500" />}
                      {file.status === 'success' ? (
                        <PermissionGuard permission="files.delete">
                          <button onClick={() => handleDeleteFile(file)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </PermissionGuard>
                      ) : (
                        <button onClick={() => removeFromList(file.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                          <X size={16} className="text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presigned URL */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Presigned URL</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Buat URL sementara untuk mengakses file</p>
            <div className="space-y-3">
              <input type="text" value={presignedPath} onChange={(e) => setPresignedPath(e.target.value)}
                placeholder="Path file (contoh: uploads/file.pdf)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              <Button onClick={handleGetPresignedUrl} disabled={!presignedPath.trim()}><Download size={18} className="mr-2" /> Generate URL</Button>
              {presignedUrl && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Presigned URL:</p>
                  <a href={presignedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 break-all hover:underline">{presignedUrl}</a>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Delete by Path */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hapus File</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hapus file berdasarkan path</p>
            <div className="space-y-3">
              <input type="text" value={deletePath} onChange={(e) => setDeletePath(e.target.value)}
                placeholder="Path file yang akan dihapus"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              <PermissionGuard permission="files.delete">
                <Button onClick={handleDeleteByPath} disabled={!deletePath.trim()} variant="danger"><Trash2 size={18} className="mr-2" /> Hapus File</Button>
              </PermissionGuard>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default FileUploadPage