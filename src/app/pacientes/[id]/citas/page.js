import CitasClient from "./CitasClient"


export default async function Page({ params }) {
  const { id } = params

  // fetch paciente y pagos en el servidor
  const [patientRes, paymentsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/pacientes/${id}/pagos`, { cache: 'no-store' }),
  ])

  if (!patientRes.ok || !paymentsRes.ok) {
    // Aquí puedes personalizar tu error UI
    throw new Error('No se pudo cargar la información de paciente o pagos')
  }

  const paciente    = await patientRes.json()
  const pagosData   = await paymentsRes.json()

  return (
    <CitasClient
      paciente={paciente}
      pagosData={pagosData}
    />
  )
}
