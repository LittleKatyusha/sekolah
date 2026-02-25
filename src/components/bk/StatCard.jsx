import { colorStyles } from '../../constants/colors'

const StatCard = ({ icon: Icon, label, value, color, loadingStats }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${colorStyles[color].bg} flex items-center justify-center`}>
        <Icon size={24} className={colorStyles[color].text} />
      </div>
      <div>
        {loadingStats ? (
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  </div>
)

export default StatCard