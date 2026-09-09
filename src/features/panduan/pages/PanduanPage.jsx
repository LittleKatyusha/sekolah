import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, LifeBuoy, ExternalLink } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PanduanHeader from '../components/PanduanHeader'
import MobileInstallGuide from '../components/MobileInstallGuide'
import PanduanFilter from '../components/PanduanFilter'
import ModuleCard from '../components/ModuleCard'
import ManualBookPrintView from '../components/ManualBookPrintView'
import { PANDUAN_MODULES } from '../data/panduanData'

export default function PanduanPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')

  const filteredModules = useMemo(() => {
    return PANDUAN_MODULES.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (selectedPlatform !== 'all' && !item.platforms.includes(selectedPlatform)) return false
      if (selectedRole !== 'all' && !item.roles.includes(selectedRole)) return false

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const mTitle = item.title.toLowerCase().includes(q)
        const mDesc = item.description.toLowerCase().includes(q)
        const mWeb = item.webGuide?.some((g) => g.toLowerCase().includes(q))
        const mMobile = item.mobileGuide?.some((g) => g.toLowerCase().includes(q))
        const mTrouble = item.troubleshooting?.some(
          (t) => t.issue.toLowerCase().includes(q) || t.solution.toLowerCase().includes(q)
        )
        return mTitle || mDesc || mWeb || mMobile || mTrouble
      }
      return true
    })
  }, [searchTerm, selectedCategory, selectedPlatform, selectedRole])

  const handleReset = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedPlatform('all')
    setSelectedRole('all')
  }

  return (
    <>
      {/* Screen Interactive View */}
      <div className="space-y-6 pb-12 print:hidden">
        <PanduanHeader />
        <MobileInstallGuide />

        <PanduanFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />

        <div className="space-y-6">
          {filteredModules.length === 0 ? (
            <Card className="text-center py-12">
              <HelpCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Tidak ada petunjuk yang sesuai
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Tidak ditemukan petunjuk untuk "{searchTerm}". Coba kata kunci lain atau reset filter.
              </p>
              <Button variant="secondary" onClick={handleReset} className="mt-4 text-xs font-medium">
                Reset Semua Filter
              </Button>
            </Card>
          ) : (
            filteredModules.map((item) => (
              <ModuleCard key={item.id} item={item} />
            ))
          )}
        </div>

        <div className="mt-10 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold flex items-center justify-center sm:justify-start gap-2">
              <LifeBuoy className="w-5 h-5 text-amber-400" />
              Masih Menemukan Kendala atau Butuh Bantuan Lanjutan?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
              Asisten AI AkademiHub dan Tim Dukungan Teknis Sekolah siap mendampingi Anda 24/7.
              Kirim tiket kendala dengan screenshot untuk penyelesaian cepat.
            </p>
          </div>

          <Link to="/support/tickets" className="shrink-0">
            <Button className="bg-primary-600 hover:bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg inline-flex items-center gap-2 text-sm">
              <span>Buka Tiket Kendala</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Printable Manual Book View */}
      <ManualBookPrintView modules={PANDUAN_MODULES} />
    </>
  )
}

