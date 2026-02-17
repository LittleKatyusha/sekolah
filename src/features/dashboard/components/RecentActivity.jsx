import React from 'react'
import Card from '../../../components/ui/Card'
import { Clock } from 'lucide-react'

const RecentActivity = ({ activities = [] }) => {
  return (
    <Card title="Recent Activity">
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent activity.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 dark:border-gray-700">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-full dark:bg-blue-900/30">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  <span className="font-bold">{activity.user}</span> {activity.action}
                </p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

export default RecentActivity