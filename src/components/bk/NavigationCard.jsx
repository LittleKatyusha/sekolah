import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { colorStyles } from '../../constants/colors'

const NavigationCard = ({ icon: Icon, title, description, path, color }) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(path)}
      className={`group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg ${colorStyles[color].hover} transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${colorStyles[color].bg} flex items-center justify-center`}>
            <Icon size={24} className={colorStyles[color].text} />
          </div>
          <div>
            <h3 className={`font-semibold text-gray-900 dark:text-white ${colorStyles[color].groupHover} transition-colors`}>{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <ArrowRight size={20} className={`text-gray-400 ${colorStyles[color].groupHover} group-hover:translate-x-1 transition-all`} />
      </div>
    </div>
  )
}

export default NavigationCard