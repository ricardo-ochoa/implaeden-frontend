// Página PÚBLICA: el paciente llega aquí con el link privado que le comparte
// la clínica y sube su Constancia de Situación Fiscal.
//
// No pasa por el middleware de sesión (su matcher no incluye /constancia), y a
// propósito no muestra ningún dato clínico: solo el nombre de pila que devuelve
// el backend para que el paciente reconozca que el link es suyo.
import SubirConstanciaClient from './SubirConstanciaClient'

export const metadata = {
  title: 'Enviar constancia de situación fiscal · Implaedén',
  // El link se comparte por WhatsApp; no queremos que quede indexado.
  robots: { index: false, follow: false },
}

export default function ConstanciaPage({ params }) {
  return <SubirConstanciaClient token={params.token} />
}
