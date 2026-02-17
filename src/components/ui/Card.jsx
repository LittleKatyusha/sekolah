import { clsx } from 'clsx'
import { memo } from 'react'

const Card = memo(({ children, className = '', title, actions, ...props }) => {
  return (
    <div className={clsx('card p-6', className)} {...props}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card
