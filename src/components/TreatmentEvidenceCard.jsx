'use client'

import * as React from 'react'
import Image from 'next/image'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import TeethMultiSelect from './TeethMultiSelect'
import CommentInput from './CommentInput'
import TreatmentHeader from './tratamientos/TreatmentHeader'
import EvidencePicker from './tratamientos/EvidencePicker'

const cx = (...c) => c.filter(Boolean).join(' ')

export default function TreatmentEvidenceCard({
  title,
  relatedTeeth = [],
  cost = 0,

  teeth = [],
  teethOptions,
  selectedTeeth,
  onSelectedTeethChange,

  comment,
  onCommentChange,

  files,
  onFilesChange,

  avatarUrl,
  avatarInitials = 'RG',
  costUpdating = false,
  onSaveCost,
  onSubmit,
  submitting = false,
  disabled = false,
  className,
}) {
  const [localTeeth, setLocalTeeth] = React.useState([])
  const [localComment, setLocalComment] = React.useState('')
  const [localFiles, setLocalFiles] = React.useState([])

  const teethValue = selectedTeeth ?? localTeeth
  const commentValue = comment ?? localComment
  const filesValue = files ?? localFiles

  const setTeeth = (v) =>
    onSelectedTeethChange ? onSelectedTeethChange(v) : setLocalTeeth(v)
  const setComment = (v) =>
    onCommentChange ? onCommentChange(v) : setLocalComment(v)
  const setFiles = (v) =>
    onFilesChange ? onFilesChange(v) : setLocalFiles(v)

  const canSubmit =
    !disabled &&
    !submitting &&
    (String(commentValue || '').trim().length > 0 || (filesValue?.length ?? 0) > 0)

  const handleSubmit = async () => {
    if (!canSubmit) return
    await onSubmit?.({
      selectedTeeth: teethValue,
      comment: commentValue,
      files: filesValue,
    })
  }

  return (
    <Card className={cx('rounded-t-2xl rounded-b-none shadow-none', className)}>
      <CardContent className="p-5">
       <TreatmentHeader
          title={title}
          relatedTeeth={relatedTeeth}
          cost={cost}

          // ✅ NUEVO
          editable={true}
          isUpdating={costUpdating}
          onSaveCost={onSaveCost}
        />

        {/* Dientes seleccionados */}
        <div className="flex items-start gap-3 mb-2">
          <div className="mt-0.5 mx-1 flex flex-shrink-0 items-center justify-center bg-white rounded-full h-6 w-6">
            <Image
              src="/tratamientos/diente.svg"
              alt="Diente"
              width={32}
              height={32}
              className="h-5 w-5"
              priority={false}
            />
          </div>

          <div className="w-full space-y-2">
            <p className="text-lg font-semibold">Dientes seleccionados:</p>
            <TeethMultiSelect
              teeth={teeth}
              teethOptions={teethOptions}
              value={teethValue}
              onChange={setTeeth}
              disabled={disabled || submitting}
              placeholder="Selecciona dientes"
            />
          </div>
        </div>

        {/* Comentario */}
        <CommentInput
          value={commentValue}
          onChange={setComment}
          avatarUrl={avatarUrl}
          initials={avatarInitials}
          disabled={disabled || submitting}
        />

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 mt-3">
          <EvidencePicker
            value={filesValue}
            onChange={setFiles}
            disabled={disabled || submitting}
          />

          <Button
            type="button"
            className="rounded-full px-8 h-12"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? 'Guardando…' : 'Comentar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
