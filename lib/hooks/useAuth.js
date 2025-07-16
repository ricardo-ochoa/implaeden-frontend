import { useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';

export function useAuth() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const { sub: id, role, permission } = jwt_decode(token);
      setUser({ id, role, permission });
    }
  }, []);
  return user;
}
