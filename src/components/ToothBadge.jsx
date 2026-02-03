'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function ToothBadge({
  tooth,
  onClick,
  stopPropagation = true,
  selected = false,
  className,
  variant = 'primary',
}) {
  const isClickable = typeof onClick === 'function'

  const handleClick = (e) => {
    if (stopPropagation) e.stopPropagation()
    if (!isClickable) return
    onClick(tooth, e)
  }

  const handleKeyDown = (e) => {
    if (!isClickable) return
    if (e.key === 'Enter' || e.key === ' ') {
      if (stopPropagation) e.stopPropagation()
      e.preventDefault()
      onClick(tooth, e)
    }
  }

  return (
    <Badge
      variant={variant}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cx(
        'rounded-full px-1 py-0.5  bg-[#947CFF] text-white border-[#e0e4e9] border-2',
        isClickable ? 'cursor-pointer hover:bg-[#947CFF] hover:text-white' : 'cursor-default',
        className
      )}
      aria-pressed={isClickable ? selected : undefined}
    >
      {tooth}
    </Badge>
  )
}
