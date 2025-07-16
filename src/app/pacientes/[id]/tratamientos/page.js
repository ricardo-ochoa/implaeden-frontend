// src/app/pacientes/[id]/tratamientos/page.js
'use client';

import { use } from 'react';
import TratamientosClient from './TratamientosClient';

export default function Page({ params: paramsPromise }) {
  // Await params before using
  const params = use(paramsPromise);
  const { id } = params;

  return <TratamientosClient patientId={id} />;
}
