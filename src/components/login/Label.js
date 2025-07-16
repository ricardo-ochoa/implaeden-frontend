// Label.js
'use client'
import React from 'react'

const Label = React.forwardRef(({ htmlFor, className = '', children, ...props }, ref) => (
  <label
    ref={ref}
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 ${className}`}
    {...props}
  >
    {children}
  </label>
));
Label.displayName = 'Label'

export { Label }
