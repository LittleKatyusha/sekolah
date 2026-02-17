import React from 'react'
import Card from '../../../components/ui/Card'

const StatCard = ({ title, value, icon: Icon, color, description }) => {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-700 ${color}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </Card>
  )
}

export default StatCard