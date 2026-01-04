'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function SectionTitle({ breadcrumbs = [], title, isHome }) {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="mb-4">
      {/* Botón regresar */}
      {!isHome && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="mb-2 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Regresar
        </Button>
      )}

      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1
            const hasHref = !!breadcrumb.href

            return (
              <li key={`${breadcrumb.label}-${index}`} className="flex items-center gap-1">
                {hasHref && !isLast ? (
                  <Link
                    href={breadcrumb.href}
                    className="hover:underline"
                  >
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground/80 font-semibold">{breadcrumb.label}</span>
                )}

                {!isLast && <span className="px-1 text-muted-foreground">/</span>}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Título */}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {title}
      </h1>
    </div>
  )
}
