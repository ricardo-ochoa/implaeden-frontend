'use client'

import { useCallback, useEffect, useState } from 'react'
import api from '../api'

const toTeethCodes = (arr) => {
  const a = Array.isArray(arr) ? arr : []
  return a
    .map((x) => (x?.value ?? x?.code ?? x?.tooth_code ?? x))
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
    .map((v) => String(v).trim())
}

export default function useTreatmentComments(patientId, treatmentId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const base = useCallback(() => {
    if (!patientId || !treatmentId) return null
    return `/pacientes/${patientId}/tratamientos/${treatmentId}/comentarios`
  }, [patientId, treatmentId])

  const fetchComments = useCallback(async () => {
    const url = base()
    if (!url) return

    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get(url)
      setComments(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e)
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [base])

  const createComment = useCallback(
    async ({ commentHtml, teethIds, files }) => {
      const url = base()
      if (!url) throw new Error('patientId/treatmentId requeridos')

      setSaving(true)
      setError(null)
      try {
        const fd = new FormData()
        fd.append('comment_html', String(commentHtml ?? ''))
        fd.append('teeth_ids', JSON.stringify(toTeethCodes(teethIds)))

        ;(Array.isArray(files) ? files : []).forEach((f) => {
          fd.append('file', f) // 👈 backend espera upload.array("file")
        })

        const { data } = await api.post(url, fd) // axios setea boundary solo
        // prepend nuevo comentario
        setComments((prev) => [data, ...(Array.isArray(prev) ? prev : [])])
        return data
      } catch (e) {
        setError(e)
        throw e
      } finally {
        setSaving(false)
      }
    },
    [base]
  )

  const deleteComment = useCallback(
    async (commentId) => {
      const url = base()
      if (!url) throw new Error('patientId/treatmentId requeridos')
      if (!commentId) return

      setSaving(true)
      setError(null)
      try {
        await api.delete(`${url}/${commentId}`)
        setComments((prev) => (Array.isArray(prev) ? prev.filter((c) => c.id !== commentId) : []))
      } catch (e) {
        setError(e)
        throw e
      } finally {
        setSaving(false)
      }
    },
    [base]
  )

  // auto fetch
  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return {
    comments,
    loading,
    saving,
    error,
    fetchComments,
    createComment,
    deleteComment,
    setComments,
  }
}
