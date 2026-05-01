import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { nilaiRaporService, pendaftarService } from '../services/ppdbService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const emptyRow = () => ({ kode_mapel: '', nilai: '' })

const NilaiRaporBulkForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pendaftaranId = searchParams.get('pendaftaran_id')

  const [saving, setSaving] = useState(false)
  const [pendaftar, setPendaftar] = useState(null)
  const [rows, setRows] = useState([emptyRow()])
  const [rowErrors, setRowErrors] = useState([])

  useEffect(() => {
    if (pendaftaranId) {
      pendaftarService.getById(pendaftaranId).then(({ data }) => {
        if (data) setPendaftar(data.data ?? data)
      })
    }
  }, [pendaftaranId])

  const goBack = () => {
    navigate(pendaftaranId ? `/ppdb/nilai-rapor?pendaftaran_id=${pendaftaranId}` : '/ppdb/nilai-rapor')
  }

  const handleRowChange = (index, field, value) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
    setRowErrors((prev) => prev.map((e, i) => i === index ? { ...e, [field]: '' } : e))
  }

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()])
    setRowErrors((prev) => [...prev, {}])
  }

  const removeRow = (index) => {
    if (rows.length === 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
    setRowErrors((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const errors = rows.map((row) => {
      const e = {}
      if (!row.kode_mapel.trim()) e.kode_mapel = 'Wajib diisi'
      const n = parseFloat(row.nilai)
      if (row.nilai === '' || isNaN(n)) e.nilai = 'Wajib diisi'
      else if (n < 0 || n > 100) e.nilai = '0–100'
      return e
    })
    setRowErrors(errors)
    return errors.every((e) => Object.keys(e).length === 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pendaftaranId) {
      showError('ID Pendaftar tidak ditemukan')
      return
    }
    if (!validate()) return

    setSaving(true)
    const items = rows.map((r) => ({
      kode_mapel: r.kode_mapel.trim(),
      nilai: parseFloat(r.nilai),
    }))
    const { error } = await nilaiRaporService.bulkStore(pendaftaranId, items)
    if (!error) {
      showSuccess('Nilai rapor berhasil disimpan')
      goBack()
    } else {
      showError(error?.message ?? 'Gagal menyimpan nilai rapor')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Input Massal Nilai Rapor</h1>
          {pendaftar && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pendaftar: <span className="font-medium">{pendaftar.nama_lengkap}</span>
            </p>
          )}
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    value={row.kode_mapel}
                    onChange={(e) => handleRowChange(index, 'kode_mapel', e.target.value)}
                    placeholder="Kode Mapel (contoh: MTK)"
                  />
                  {rowErrors[index]?.kode_mapel && (
                    <p className="mt-1 text-xs text-red-500">{rowErrors[index].kode_mapel}</p>
                  )}
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={row.nilai}
                    onChange={(e) => handleRowChange(index, 'nilai', e.target.value)}
                    placeholder="Nilai"
                  />
                  {rowErrors[index]?.nilai && (
                    <p className="mt-1 text-xs text-red-500">{rowErrors[index].nilai}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                  className="mt-2 p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addRow} className="w-full">
            <Plus size={16} className="mr-1" /> Tambah Baris
          </Button>

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={goBack}>Batal</Button>
            <PermissionGuard permission="ppdb.pendaftaran.update">
              <Button type="submit" disabled={saving}>
                <Save size={16} className="mr-1" />
                {saving ? 'Menyimpan...' : `Simpan ${rows.length} Nilai`}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default NilaiRaporBulkForm
