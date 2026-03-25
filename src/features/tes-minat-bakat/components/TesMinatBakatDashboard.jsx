import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { getTotalCount, tesMinatBakatResourceOrder, tesMinatBakatResources } from '../config.jsx'

const TesMinatBakatDashboard = () => {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)

      try {
        const results = await Promise.all(
          tesMinatBakatResourceOrder.map(async (resourceKey) => {
            const resource = tesMinatBakatResources[resourceKey]
            const response = await resource.service.getAll({ per_page: 1 })
            return [resourceKey, getTotalCount(response)]
          })
        )

        setStats(Object.fromEntries(results))
      } catch (error) {
        console.error('Failed to load Tes Minat Bakat stats:', error)
        setStats({})
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tes Minat dan Bakat</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Kelola asesmen, aspek, pertanyaan, peserta, jawaban, dan hasil akhir dalam satu alur kerja.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tesMinatBakatResourceOrder.map((resourceKey) => {
          const resource = tesMinatBakatResources[resourceKey]
          const Icon = resource.icon

          return (
            <Link key={resourceKey} to={resource.segment} className="block">
              <Card className="h-full transition-shadow hover:shadow-lg">
                <div className="p-6 h-full flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center">
                      <Icon size={22} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {loading ? '-' : (stats[resourceKey] ?? 0)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{resource.navTitle}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{resource.navDescription}</p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default TesMinatBakatDashboard