export function Spinner({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div className={`${className} border-2 border-transparent border-t-primary rounded-full animate-spin`} />
  )
}
