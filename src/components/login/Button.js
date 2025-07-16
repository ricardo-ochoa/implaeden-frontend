// Button.js
import React from 'react'

const Button = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={className}
    {...props}
  />
))
Button.displayName = 'Button'

export { Button }