import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Monitor, Smartphone, Tv, Zap, ArrowRight,
  Sparkles, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'
import Card from '../../../components/ui/Card'

const PLATFORM_ICONS = { web: Monitor, mobile: Smartphone, tv: Tv, iot: Zap }

const ROLE_STYLES = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  guru: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  siswa: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  wali: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
}

export default function ModuleCard({ item }) {
  const [openTroubleshoot, setOpenTroubleshoot] = useState(false)

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700/80 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
            {item.route && (
              <Link
                to={item.route}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline shrink-0 ml-1"
              >
                <span>Buka Modul</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
        </div>

        <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            {item.platforms.map((p) => {
              const IconComp = PLATFORM_ICONS[p] || Monitor
              return (
                <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                  <IconComp className="w-3 h-3" />
                  <span className="capitalize">{p}</span>
                </span>
              )
            })}
          </div>
          <div className="flex items-center gap-1">
            {item.roles.map((r) => (
              <span key={r} className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${ROLE_STYLES[r] || 'bg-gray-100 text-gray-700'}`}>
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="space-y-3 bg-gray-50/50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Monitor className="w-4 h-4 text-primary-600" />
            <span>Alur Penggunaan Web Dashboard</span>
          </div>
          <ol className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            {item.webGuide.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-3 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Alur Penggunaan Mobile Apps</span>
          </div>
          <ol className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            {item.mobileGuide.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {item.proTips?.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            {item.proTips.map((tip, idx) => (
              <p key={idx} className="leading-relaxed"><strong>Tips:</strong> {tip}</p>
            ))}
          </div>
        </div>
      )}

      {item.troubleshooting?.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setOpenTroubleshoot(!openTroubleshoot)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 py-1"
          >
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Solusi Cepat Kendala Umum ({item.troubleshooting.length})
            </span>
            {openTroubleshoot ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {openTroubleshoot && (
            <div className="mt-3 space-y-2.5">
              {item.troubleshooting.map((t, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs border border-gray-200 dark:border-gray-700">
                  <p className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <span className="text-red-500">Q:</span> {t.issue}
                  </p>
                  <p className="mt-1 text-gray-600 dark:text-gray-300 pl-4 border-l-2 border-primary-500 leading-relaxed">
                    <strong className="text-primary-700 dark:text-primary-400 font-semibold">Solusi:</strong> {t.solution}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
