import * as React from "react"

const Badge = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-md border border-transparent bg-primary px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
