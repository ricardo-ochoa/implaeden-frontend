// src/components/BasicInfoCard.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInYears } from 'date-fns';
import { Edit, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import EditPatientModal from './EditPatientModal';
import ImageDetailModal from './ImageDetailModal';
import { useRandomAvatar } from '../../lib/hooks/useRandomAvatar';

function InfoRow({ label, value, onCopy }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-sm font-medium text-foreground/80">{label}:</span>

      {onCopy ? (
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          aria-label={`Copiar ${label}`}
        >
          <Copy className="h-4 w-4" />
          <span className="max-w-[220px] truncate">{value}</span>
        </button>
      ) : (
        <span className="text-sm font-semibold text-foreground">{value}</span>
      )}
    </div>
  );
}

export default function BasicInfoCard({ patient: initialPatient, onPatientUpdate }) {
  const router = useRouter();

  const [patient, setPatient] = useState(initialPatient || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialPatient);

  const defaultAvatar = useRandomAvatar();

  useEffect(() => {
    if (initialPatient) {
      setPatient(initialPatient);
      setIsLoading(false);
    }
  }, [initialPatient]);

  const fechaNacimiento = patient?.fecha_nacimiento ? parseISO(patient.fecha_nacimiento) : null;
  const edad = fechaNacimiento ? differenceInYears(new Date(), fechaNacimiento) : null;
  const fechaFormateada = fechaNacimiento ? format(fechaNacimiento, 'dd/MM/yyyy') : 'N/A';

  const avatarUrl = patient?.foto_perfil_url ? `${patient.foto_perfil_url}` : defaultAvatar;

  const copyToClipboard = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copiado', {
        description: `${label}: ${value}`,
      });
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const details = useMemo(
    () => [
      { label: 'Fecha de nacimiento', value: fechaFormateada },
      { label: 'Edad', value: edad != null ? `${edad} años` : 'N/A' },
      {
        label: 'Teléfono',
        value: patient?.telefono || 'N/A',
        copy: patient?.telefono,
      },
      {
        label: 'Email',
        value: patient?.email || 'N/A',
        copy: patient?.email,
      },
      { label: 'Dirección', value: patient?.direccion || 'N/A' },
    ],
    [fechaFormateada, edad, patient]
  );

  const handleUpdateSuccess = (updatedPatient) => {
    setPatient((prev) => ({ ...(prev || {}), ...updatedPatient }));
    setIsModalOpen(false);

    toast.success('Paciente actualizado', {
      description: 'La información se guardó correctamente.',
    });

    router.refresh();
    if (onPatientUpdate) onPatientUpdate(updatedPatient);
  };

  const fullName = `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim();

  return (
    <>
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {isLoading ? (
                <div className="h-[100px] w-[100px] rounded-full bg-muted animate-pulse" />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="relative h-[100px] w-[100px] overflow-hidden rounded-full ring-2 ring-background ring-offset-4 ring-offset-primary/25"
                  aria-label="Ver foto de perfil"
                >
                  <Image
                    src={avatarUrl}
                    alt={fullName || 'Foto de perfil'}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </button>
              )}

              <div className="min-w-0">
                {isLoading ? (
                  <>
                    <div className="h-6 w-40 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 w-56 bg-muted rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-primary truncate">
                      {fullName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Información básica del paciente
                    </p>
                  </>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>

          {/* Details */}
          <div className="mt-5 space-y-1">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              details.map((d, idx) => (
                <InfoRow
                  key={`${d.label}-${idx}`}
                  label={d.label}
                  value={d.value}
                  onCopy={
                    d.copy
                      ? () => copyToClipboard(d.copy, d.label)
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <EditPatientModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
        onSuccess={handleUpdateSuccess}
      />

      <ImageDetailModal
        open={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={avatarUrl}
        altText={fullName}
      />
    </>
  );
}
