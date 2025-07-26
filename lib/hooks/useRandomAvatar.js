// src/lib/utils/avatarUtils.js

const defaultAvatars = [
  '/avatars/Avatars-1.png',
  '/avatars/Avatars-2.png',
  '/avatars/Avatars-3.png',
  '/avatars/Avatars-4.png',
  '/avatars/Avatars-5.png',
];

const defaultStaticAvatar = "https://res.cloudinary.com/dnxxkvpiz/image/upload/v1753515008/Implaeden/profile_xhzdt3.png";

/**
 * Obtiene la URL del avatar para un paciente.
 * Si el paciente no tiene una imagen, le asigna una por defecto de forma consistente.
 * @param {string|null|undefined} imageUrl - La URL de la foto de perfil del paciente.
 * @param {number} patientId - El ID del paciente, para asignarle un avatar por defecto consistente.
 * @returns {string} - La URL del avatar a usar.
 */
export const useRandomAvatar = (imageUrl, patientId) => {
  // Si imageUrl existe y no está vacío, úsalo.
  if (imageUrl) {
    return imageUrl;
  }

  // Si no, asigna uno por defecto basado en el ID del paciente.
  // El operador de módulo (%) asegura que siempre se elija una imagen válida del array.
  // const index = patientId % defaultAvatars.length;
  // return defaultAvatars[index];

  // O si prefieres usar siempre la misma imagen por defecto para todos:
  return defaultStaticAvatar;
};