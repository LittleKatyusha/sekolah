import { useEffect } from 'react'
import useNavigationProgressStore from '../../store/useNavigationProgressStore'

const NavigationProgress = () => {
  const isVisible = useNavigationProgressStore((state) => state.isVisible)
  const progress = useNavigationProgressStore((state) => state.progress)
  const setProgress = useNavigationProgressStore((state) => state.setProgress)

  useEffect(() => {
    if (!isVisible || progress >= 90) return undefined

    const delay = progress < 50 ? 140 : 280
    const increment = progress < 50 ? 10 : progress < 80 ? 4 : 2

    const timer = window.setTimeout(() => {
      setProgress(progress + increment)
    }, delay)

    return () => window.clearTimeout(timer)
  }, [isVisible, progress, setProgress])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-1">
      <div
        className="h-full bg-primary-600 shadow-[0_0_14px_rgba(79,70,229,0.45)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  )
}

export default NavigationProgress