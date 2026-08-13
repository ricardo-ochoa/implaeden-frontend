// lib/utils/descargarArchivo.js
// Descarga un endpoint protegido como archivo.
//
// No se puede usar un <a href> directo: el token va en una cookie del dominio
// del front, no del API, así que la petición tiene que pasar por la instancia
// de axios (que agrega el Authorization) y el blob resultante se baja con un
// enlace temporal.

import api from '../api'

// "attachment; filename="expediente-valar-completo.pdf"" -> el nombre
const nombreDesdeCabecera = (contentDisposition) => {
  if (!contentDisposition) return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(contentDisposition)
  return match ? decodeURIComponent(match[1]).trim() : null
}

/**
 * @param {string} url            ruta relativa al baseURL del API
 * @param {string} nombrePorDefecto nombre si el servidor no manda uno
 * @returns {Promise<{ headers: object }>} cabeceras de la respuesta
 */
export async function descargarArchivo(url, nombrePorDefecto = 'descarga') {
  const respuesta = await api.get(url, { responseType: 'blob' })

  const nombre =
    nombreDesdeCabecera(respuesta.headers?.['content-disposition']) || nombrePorDefecto

  const objectUrl = URL.createObjectURL(respuesta.data)
  const enlace = document.createElement('a')
  enlace.href = objectUrl
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()

  // Safari necesita que el object URL siga vivo un instante tras el click.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)

  return { headers: respuesta.headers || {} }
}

// Cuando el servidor responde un error a una petición con responseType 'blob',
// el cuerpo llega como Blob y no como JSON: hay que leerlo para el mensaje.
export async function mensajeDeErrorBlob(err, porDefecto = 'No se pudo descargar el archivo') {
  const data = err?.response?.data

  if (data instanceof Blob) {
    try {
      const texto = await data.text()
      return JSON.parse(texto)?.error || porDefecto
    } catch {
      return porDefecto
    }
  }

  return data?.error || porDefecto
}
