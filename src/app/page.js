'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import PatientTable from '@/components/PatientTable';
import PaginationControl from '@/components/PaginationControl';
import HomeActions from '@/components/HomeActions';

const mockPatients = [
  { id: 1, name: 'Luis Garrido Perera', phone: '9988776655', email: 'luisgarrido@gmail.com' },
  { id: 2, name: 'Elston Gullan', phone: '9988776655', email: 'elston@gmail.com' },
  { id: 3, name: 'Elston Gullan', phone: '9988776655', email: 'elston@gmail.com' },
  { id: 4, name: 'Elston Gullan', phone: '9988776655', email: 'elston@gmail.com' },
  { id: 5, name: 'Elston Gullan', phone: '9988776655', email: 'elston@gmail.com' },
  { id: 6, name: 'Elston Gullan', phone: '9988776655', email: 'elston@gmail.com' },
];

export default function PatientManagement() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleAddPatient = () => {
    console.log('Agregar nuevo paciente');
  };

  return (
    <div className="min-h-screen">
      <main>
        {/* Contenedor principal centrado y limitado */}
        <div className="container mx-auto max-w-screen-lg px-4 py-8">
          <HomeActions
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddPatient={handleAddPatient}
          />
          <PatientTable patients={mockPatients} />
          <PaginationControl
            page={page}
            onPageChange={handlePageChange}
            totalPages={10}
          />
        </div>
      </main>
    </div>
  );
}

