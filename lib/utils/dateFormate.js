const formatearFechaHora = (isoString) => {
    if (!isoString) return 'Fecha no disponible'
    const fecha = new Date(isoString)
    if (isNaN(fecha.getTime())) return 'Fecha inválida'
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
export default formatearFechaHora;