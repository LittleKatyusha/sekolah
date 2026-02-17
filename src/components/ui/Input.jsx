import { clsx } from 'clsx'
import { forwardRef } from 'react'

const Input = forwardRef(({ 
  label, 
  error, 
  className = '',
  type = 'text',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={clsx(
          'input-field',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
