import { useState, useEffect } from 'react';

const defaultAvatars = [
  '/avatars/Avatars-1.png',
  '/avatars/Avatars-2.png',
  '/avatars/Avatars-3.png',
  '/avatars/Avatars-4.png',
  '/avatars/Avatars-5.png',
];

/**
 * Hook para obtener una imagen de avatar, usando una por defecto si no se proporciona.
 * @param {string|null} currentImage - URL de la imagen actual del avatar.
 * @returns {string} - URL de la imagen a mostrar.
 */
export const useRandomAvatar = (currentImage = null) => {
  const [avatar, setAvatar] = useState(currentImage);

  useEffect(() => {
    if (!currentImage) {
      // const randomImage = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
      const randomImage = "https://res.cloudinary.com/dnxxkvpiz/image/upload/v1753515008/Implaeden/profile_xhzdt3.png"
      setAvatar(randomImage);
    } else {
      setAvatar(currentImage);
    }
  }, [currentImage]);

  return avatar;
};
