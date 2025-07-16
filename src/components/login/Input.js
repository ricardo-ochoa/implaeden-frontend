// Input.js
import React from 'react'

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={className}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }