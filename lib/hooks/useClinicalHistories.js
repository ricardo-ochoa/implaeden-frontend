import { useState } from 'react';

const useClinicalHistories = (patientId) => {
  const [clinicalRecords, setClinicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClinicalHistories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clinical-histories/${patientId}`);
      if (!response.ok) throw new Error('Error fetching clinical histories');
      const data = await response.json();
      setClinicalRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addClinicalHistory = async (recordDate, files) => {
    if (!recordDate || files.length === 0) {
      throw new Error('Record date and files are required');
    }

    const formData = new FormData();
    formData.append('record_date', recordDate);
    files.forEach((file) => formData.append('file', file));

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clinical-histories/${patientId}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Error adding clinical history');
      const newRecord = await response.json();
      setClinicalRecords((prevRecords) => [...prevRecords, newRecord]);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    clinicalRecords,
    loading,
    error,
    fetchClinicalHistories,
    addClinicalHistory,
  };
};

export default useClinicalHistories;
