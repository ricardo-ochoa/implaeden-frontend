const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Obtener todos los pacientes
export const fetchPacientes = async (searchTerm) => {
  const res = await fetch(`${API_URL}/pacientes?search=${searchTerm}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Error al obtener los pacientes');
  }

  return res.json();
};

// Obtener un paciente por ID
export const fetchPacienteById = async (id) => {
  const res = await fetch(`${API_URL}/pacientes/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Paciente no encontrado');
  }

  return res.json();
};

// Crear un nuevo paciente
export const createPaciente = async (pacienteData) => {
  const res = await fetch(`${API_URL}/pacientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pacienteData),
  });

  if (!res.ok) {
    throw new Error('Error al crear paciente');
  }

  return res.json();
};

// Actualizar un paciente
export const updatePaciente = async (id, pacienteData) => {
  const res = await fetch(`${API_URL}/pacientes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pacienteData),
  });

  if (!res.ok) {
    throw new Error('Error al actualizar paciente');
  }

  return res.json();
};

// Eliminar un paciente
export const deletePaciente = async (id) => {
  const res = await fetch(`${API_URL}/pacientes/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Error al eliminar paciente');
  }

  return res.json();
};
