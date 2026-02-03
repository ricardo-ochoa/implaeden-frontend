'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ShieldPlus } from 'lucide-react'

const cn = (...classes) => classes.filter(Boolean).join(' ')

export default function TreatmentsMenu({
  treatments = [],
  value = null,
  onChange,
  showMeta = true,
  className,
}) {
  return (
    <section className={cn('w-full', className)}>
      <div className="px-1 pb-2">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">
          TRATAMIENTOS
        </p>
      </div>

      <ScrollArea className="">
        <div className="flex flex-col gap-2">
          {treatments?.length ? (
            treatments.map((t) => {
              const isActive = t?.treatment_id === value
              const teethCount = Array.isArray(t?.teeth_ids) ? t.teeth_ids.length : 0

              return (
                <Button
                  key={t.treatment_id}
                  type="button"
                  variant="ghost"
                  onClick={() => onChange?.(t)}
                  className={cn(
                    'h-auto w-full justify-between rounded-full px-3 py-2',
                    'border transition-colors',
                    isActive
                      ? 'border-transparent bg-[#0062FF] text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-muted'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                    >
                      <ShieldPlus className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-semibold">
                        {t?.service_name || 'Tratamiento'}
                      </p>
{/* 
                      
                      {showMeta && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {t?.status ? (
                            <Badge
                              variant={isActive ? 'secondary' : 'outline'}
                              className={cn(
                                'h-5 px-2 text-[11px]',
                                isActive && 'bg-white/15 text-white border-white/20'
                              )}
                            >
                              {t.status}
                            </Badge>
                          ) : null}

                          {teethCount > 0 ? (
                            <Badge
                              variant={isActive ? 'secondary' : 'outline'}
                              className={cn(
                                'h-5 px-2 text-[11px]',
                                isActive && 'bg-white/15 text-white border-white/20'
                              )}
                            >
                              {teethCount} diente{teethCount === 1 ? '' : 's'}
                            </Badge>
                          ) : null}
                        </div>
                      )} */}
                      
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      'ml-3 h-5 w-5 shrink-0',
                      isActive ? 'text-white/90' : 'text-muted-foreground'
                    )}
                  />
                </Button>
              )
            })
          ) : (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
              No hay tratamientos para mostrar.
            </div>
          )}
        </div>
      </ScrollArea>
    </section>
  )
}
