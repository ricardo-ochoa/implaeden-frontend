/**
 * Función para formatear fechas en un formato legible.
 * @param {string | Date} dateInput - Fecha en formato ISO o un objeto Date.
 * @param {string} format - Formato deseado (ej: "dd/mm/yyyy", "dd de mmmm de yyyy").
 * @returns {string} Fecha formateada.
 */
export const formatDate = (dateInput, format = "dd/mm/yyyy") => {
    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
  
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date format");
    }
  
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Mes en formato numérico
    const year = date.getFullYear();
    const monthName = months[date.getMonth()]; // Mes en texto
  
    // Formatos personalizables
    const formattedDate = format
      .replace("dd", day)
      .replace("mm", month)
      .replace("mmmm", monthName)
      .replace("yyyy", year);
  
    return formattedDate;
  };
  