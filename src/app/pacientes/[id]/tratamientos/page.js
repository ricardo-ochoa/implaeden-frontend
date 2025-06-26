// app/pacientes/[id]/tratamientos/page.js
import React from 'react'
import TratamientosClient from './TratamientosClient'

export default function Page({ params }) {
  return <TratamientosClient patientId={params.id} />
}
