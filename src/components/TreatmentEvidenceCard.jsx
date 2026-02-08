'use client'

import * as React from 'react'
import Image from 'next/image'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import TeethMultiSelect from './TeethMultiSelect'
import CommentInput from './CommentInput'
import TreatmentHeader from './tratamientos/TreatmentHeader'
import EvidencePicker from './tratamientos/EvidencePicker'
import ModalServicio from '@/components/ModalServicio'
import api from '../../lib/api'
import EvidencePreviewGrid from './EvidencePreviewGrid'
import useTreatmentComments from '../../lib/hooks/useTreatmentComments'


const cx = (...c) => c.filter(Boolean).join(' ')

export default function TreatmentEvidenceCard({
   patientId,
   treatment,
   date,
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

  const [editOpen, setEditOpen] = React.useState(false)
  const [editDate, setEditDate] = React.useState('')
  const [selectedService, setSelectedService] = React.useState('')
  const [initialCost, setInitialCost] = React.useState('')
  const [unionTeethIds, setUnionTeethIds] = React.useState([])

  const teethValue = selectedTeeth ?? localTeeth
  const commentValue = comment ?? localComment
  const filesValue = files ?? localFiles
  // console.log("treatment", treatment)
  const treatmentId = treatment?.treatment_id
  const { createComment, saving } = useTreatmentComments(patientId, treatmentId)

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
    await createComment({
      commentHtml: commentValue,
      teethIds: teethValue,
      files: filesValue,
    })
    
    setComment('')
    setFiles([])
    setTeeth([])
  }

const ymdToIsoLocalMidnight = (ymd) => {
  if (!ymd) return ymd
  if (String(ymd).includes('T')) return ymd
  const d = new Date(`${ymd}T00:00:00`)
  return Number.isNaN(d.getTime()) ? ymd : d.toISOString()
}

const handleUpdateRecord = async (payload) => {
  try {
    if (!patientId) throw new Error('patientId requerido')

    const isGroup = Boolean(payload?.isGroup) || Boolean(payload?.group_id)
    const ymd = payload?.group_start_date ?? payload?.start_date ?? payload?.service_date
    const groupStartIso = ymdToIsoLocalMidnight(ymd)

    if (isGroup) {
      const updates = (payload.items || [])
        .filter((it) => it?.treatment_id)
        .map((it) =>
          api.patch(`/pacientes/${patientId}/tratamientos/${it.treatment_id}`, {
            group_start_date: groupStartIso,     // ✅ correcto
            total_cost: it.total_cost,
            quantity: it.quantity,
            teeth_ids: it.teeth_ids,
          })
        )

      await Promise.all(updates)
    } else {
      const tid = payload?.single_treatment_id || payload?.items?.[0]?.treatment_id
      if (!tid) throw new Error('treatment_id requerido')

      const it = payload.items?.[0] || {}
      await api.patch(`/pacientes/${patientId}/tratamientos/${tid}`, {
        service_date: payload.service_date ?? payload.start_date, // ✅ single
        total_cost: it.total_cost,
        quantity: it.quantity,
        teeth_ids: it.teeth_ids,
      })
    }

    setEditOpen(false)
  } catch (e) {
    console.error(e)
  }
}

const handlePickFiles = (picked) => {
  // ✅ append + dedupe opcional
  const all = [...(filesValue || []), ...(picked || [])]

  // dedupe por name+size+lastModified (opcional pero recomendado)
  const seen = new Set()
  const deduped = all.filter((f) => {
    const key = `${f.name}-${f.size}-${f.lastModified}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  setFiles(deduped)
}

const removeFileAt = (index) => {
  setFiles((filesValue || []).filter((_, i) => i !== index))
}


  return (
    <>
    <Card className={cx('rounded-t-2xl rounded-b-none shadow-none', className)}>
      <CardContent className="p-5">
       <TreatmentHeader
          title={title}
          relatedTeeth={relatedTeeth}
          cost={cost}
          editable={true}
          isUpdating={costUpdating}
          onSaveCost={onSaveCost}
          onEdit={() => setEditOpen(true)}
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

        <EvidencePreviewGrid
          files={filesValue}
          onRemove={removeFileAt}
          disabled={disabled || submitting}
        />

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 mt-3">
            <EvidencePicker
              value={filesValue}
              onChange={handlePickFiles}
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
      <ModalServicio
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar tratamiento"
        newRecordDate={editDate}
        setNewRecordDate={setEditDate}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
        initialCost={initialCost}
        setInitialCost={setInitialCost}
        savedDate={date}
        teethIds={unionTeethIds}
        setTeethIds={setUnionTeethIds}
        mode="edit"
        initialTreatment={treatment}
        handleUpdateRecord={handleUpdateRecord}
      />
    </>
  )
}
