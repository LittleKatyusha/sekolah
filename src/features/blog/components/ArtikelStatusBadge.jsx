import React from 'react'
import { Clock, CheckCircle2, XCircle, Archive, FileEdit } from 'lucide-react'

const STATUS_CONFIG = {
  draft: {
    label: 'Draf',
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: FileEdit,
  },
  pending: {
    label: 'Menunggu Review',
    classes: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Clock,
  },
  published: {
    label: 'Terbit',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Ditolak',
    classes: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: XCircle,
  },
  archived: {
    label: 'Diarsipkan',
    classes: 'bg-zinc-200 text-zinc-800 border-zinc-400',
    icon: Archive,
  },
}

export const ArtikelStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    classes: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: FileEdit,
  }

  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  )
}

export default ArtikelStatusBadge
