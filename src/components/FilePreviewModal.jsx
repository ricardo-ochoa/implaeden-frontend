'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Keyboard } from 'swiper/modules'

const isVideo = (m) => {
  const mime = String(m?.mime_type || '')
  if (mime.startsWith('video/')) return true
  const url = String(m?.file_url || m?.url || '')
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url)
}

const getName = (m) => m?.original_name || m?.file?.name || 'Evidencia'
const getUrl = (m) => m?.file_url || m?.url || ''

export default function FilePreviewModal({
  open,
  onOpenChange,
  items = [],
  startIndex = 0,
  onIndexChange,
}) {
  const media = Array.isArray(items) ? items : []
  const safeStart = Math.max(0, Math.min(Number(startIndex) || 0, Math.max(0, media.length - 1)))

  const active = media[safeStart]
  const titleText = active ? getName(active) : 'Vista previa'

  const containerRef = React.useRef(null)
  const swiperRef = React.useRef(null)

  const pauseAllVideos = React.useCallback(() => {
    const root = containerRef.current
    if (!root) return
    root.querySelectorAll('video').forEach((v) => {
      try { v.pause() } catch {}
    })
  }, [])

  React.useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      try {
        swiperRef.current?.update?.()
        if (media.length > 1) swiperRef.current?.slideToLoop?.(safeStart, 0)
      } catch {}
    }, 0)
    return () => window.clearTimeout(t)
  }, [open, media.length, safeStart])

  const handleClose = (nextOpen) => {
    if (!nextOpen) pauseAllVideos()
    onOpenChange?.(nextOpen)
  }

  const handleSlideChange = (swiper) => {
    pauseAllVideos()
    const idx = typeof swiper?.realIndex === 'number' ? swiper.realIndex : swiper?.activeIndex
    if (typeof idx === 'number') onIndexChange?.(idx)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-viewer-modal
        className="
          p-0 bg-black border-none overflow-hidden
          w-[96vw] max-w-[96vw]
          h-[90vh] max-h-[90vh]
          flex flex-col
        "
      >
        {/* requerido por Radix */}
        <DialogHeader className="sr-only">
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>

        <div ref={containerRef} className="relative flex-1 min-h-0 w-full">
          {/* top bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 p-3 bg-black/55 backdrop-blur">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{titleText}</div>
              <div className="truncate text-xs text-white/75">
                {media.length ? `${safeStart + 1} / ${media.length}` : '—'}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => handleClose(false)}
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* ✅ Área real (resta topbar) */}
          <div className="h-full w-full pt-14">
            {media.length ? (
              <Swiper
                onSwiper={(s) => (swiperRef.current = s)}
                initialSlide={safeStart}
                modules={[Navigation, Pagination, Keyboard]}
                navigation
                pagination={{ clickable: true }}
                keyboard={{ enabled: true }}
                loop={media.length > 1}
                onSlideChange={handleSlideChange}
                className="h-full w-full"
                observer
                observeParents
              >
                {media.map((m, idx) => {
                  const url = getUrl(m)
                  const video = isVideo(m)

                  return (
                    <SwiperSlide key={m?.id ?? `${url}-${idx}`}>
                      <div className="h-full w-full flex items-center justify-center">
                        {video ? (
                          <video
                            src={url}
                            controls
                            playsInline
                            className="max-w-full max-h-full object-contain"
                            onLoadedMetadata={() => swiperRef.current?.update?.()}
                          />
                        ) : (
                          <img
                            src={url}
                            alt={getName(m)}
                            className="max-w-full max-h-full object-contain"
                            loading="eager"
                            onLoad={() => swiperRef.current?.update?.()}
                          />
                        )}
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>
            ) : (
              <div className="p-6 text-sm text-white/70">No hay evidencias para mostrar.</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
