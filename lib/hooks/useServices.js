import { useState } from 'react';

const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicios`);
      if (!response.ok) throw new Error('Error fetching services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    loading,
    error,
    fetchServices,
  };
};

export default useServices;
