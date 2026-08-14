// src/components/BasicInfoCard.jsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInYears } from 'date-fns';
import {
  MoreVertical,
  Phone,
  Mail,
  ShieldPlus,
  ChevronRight,
  ReceiptText,
  Folder,
  Calendar,
  Copy,
  Download,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import EditPatientModal from './EditPatientModal';
import ImageDetailModal from './ImageDetailModal';
import { useRandomAvatar } from '../../lib/hooks/useRandomAvatar';
import { useDescargarHistorial } from '../../lib/hooks/useDescargarHistorial';

const cx = (...classes) => classes.filter(Boolean).join(' ');

function InfoRow({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>

      {onCopy ? (
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          aria-label={`Copiar ${label}`}
          title={`Copiar ${label}`}
        >
          <span className="max-w-[240px] truncate">{value}</span>
          <Copy className="h-4 w-4" />
        </button>
      ) : (
        <span className="text-sm font-semibold text-foreground max-w-[240px] truncate text-right">
          {value}
        </span>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'w-full flex items-center justify-between gap-3 rounded-full px-4 py-3 transition',
        active
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-transparent hover:bg-muted/60 text-foreground'
      )}
      aria-label={label}
      title={label}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cx(
            'grid place-items-center h-9 w-9 rounded-full border',
            active
              ? 'border-primary-foreground/20 bg-primary-foreground/10'
              : 'border-border'
          )}
        >
          <Icon className={cx('h-5 w-5', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
        </span>

        <span className={cx('font-medium truncate', active ? 'text-primary-foreground' : 'text-foreground/80')}>
          {label}
        </span>
      </div>

      <ChevronRight className={cx('h-5 w-5', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
    </button>
  );
}

const iconByTitle = (title) => {
  const t = String(title || '').toLowerCase();
  if (t.includes('trat')) return ShieldPlus;
  if (t.includes('pago') || t.includes('compra')) return ReceiptText;
  if (t.includes('historial')) return Folder;
  if (t.includes('cita')) return Calendar;
  return ChevronRight;
};

export default function BasicInfoCard({
  patient: initialPatient,
  patientId,
  onPatientUpdate,
  menuCards = [],
  activeMenu = 'Tratamientos',
  onMenuSelect
}) {
  const router = useRouter();

  const [patient, setPatient] = useState(initialPatient || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialPatient);

  const defaultAvatar = useRandomAvatar();

  // Historial completo en PDF sin entrar a la sección: mismo endpoint y mismos
  // mensajes que el botón "Descargar todo" del historial.
  const idPaciente = patientId || patient?.id;
  const { descargando, descargar: descargarHistorial } = useDescargarHistorial(idPaciente);

  useEffect(() => {
    if (initialPatient) {
      setPatient(initialPatient);
      setIsLoading(false);
    }
  }, [initialPatient]);

  const fullName = `${patient?.nombre || ''} ${patient?.apellidos || ''}`.trim();

  const fechaNacimiento = patient?.fecha_nacimiento ? parseISO(patient.fecha_nacimiento) : null;
  const edad = fechaNacimiento ? differenceInYears(new Date(), fechaNacimiento) : null;

  // Screenshot: YYYY-MM-DD
  const fechaFormateada = fechaNacimiento ? format(fechaNacimiento, 'yyyy-MM-dd') : 'N/A';

  const avatarUrl = patient?.foto_perfil_url ? `${patient.foto_perfil_url}` : defaultAvatar;

  const copyToClipboard = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      toast.success('Copiado', { description: `${label}: ${value}` });
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const detailsGeneral = useMemo(
    () => [
      { label: 'Fecha de nacimiento', value: fechaFormateada },
    ],
    [fechaFormateada]
  );

  const detailsContact = useMemo(
    () => [
      { label: 'Teléfono', value: patient?.telefono || 'N/A', copy: patient?.telefono },
      { label: 'Email', value: patient?.email || 'N/A', copy: patient?.email },
      { label: 'Dirección', value: patient?.direccion || 'N/A' },
    ],
    [patient]
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

  const phoneCopy = patient?.telefono ? String(patient.telefono).trim() : null
  const emailCopy = patient?.email ? String(patient.email).trim() : null

  const telHref = phoneCopy
  const mailHref = emailCopy

  const canCall = Boolean(telHref) && !isLoading
  const canMail = Boolean(mailHref) && !isLoading

  const menu = useMemo(() => {
    // usa lo que te mandan desde page.js
    const fromProps = Array.isArray(menuCards) ? menuCards : [];

    return fromProps.map((c) => {
      const Icon = iconByTitle(c?.title);
        const am = String(activeMenu || '').trim().toLowerCase();
        const isActive = am
          ? String(c?.title || '').toLowerCase() === am
        : false;

      return {
        label: c?.title || 'Opción',
        icon: Icon,
        active: isActive,
        onClick: () => {
          if (typeof onMenuSelect === "function") return onMenuSelect(c?.title || "Tratamientos");
          if (c?.redirect) return router.push(c.redirect);
        },
      };
    });
  }, [menuCards, activeMenu, router, onMenuSelect]);

  return (
    <>
      <Card className="border-border bg-card">
        <CardContent className="p-5">
          {/* Top row: avatar + 3 dots */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              {isLoading ? (
                <div className="h-[90px] w-[90px] rounded-full bg-muted animate-pulse" />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="relative h-[88px] w-[88px] overflow-hidden rounded-full ring-2 ring-background ring-offset-4 ring-offset-indigo-50"
                  aria-label="Ver foto de perfil"
                  title="Ver foto de perfil"
                >
                  <Image
                    src={avatarUrl}
                    alt={fullName || 'Foto de perfil'}
                    fill
                    className="object-cover"
                    sizes="88px"
                  />
                </button>
              )}
            </div>

            {/* 3 dots = editar */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading}
              aria-label="Más opciones"
              title="Editar"
            >
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          {/* Call / Mail buttons */}
          <div className="mt-1 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0 pt-1">
                {isLoading ? (
                  <>
                    <div className="h-5 w-24 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-10 w-56 bg-muted rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="text-md sm:text-md font-medium text-muted-foreground">
                      {edad != null ? `${edad} años` : '—'}
                    </p>
                    <h2 className="text-2xl sm:text-xl tracking-tight text-foreground truncate">
                      {fullName || 'Paciente'}
                    </h2>
                  </>
                )}
              </div>
            <div className='flex items-center justify-end gap-2'>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full cursor-pointer"
              disabled={!canCall}
              asChild={canCall}
              aria-label="Llamar"
              title="Llamar"
              onClick={phoneCopy ? () => copyToClipboard(phoneCopy, 'Teléfono') : undefined}
            >
              {canCall ? (
                <span>
                  <Phone className="h-6 w-6" />
                </span>
              ) : (
                <span>
                  <Phone className="h-6 w-6" />
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full cursor-pointer"
              disabled={!canMail}
              asChild={canMail}
              aria-label="Enviar correo"
              title="Enviar correo"
              onClick={emailCopy ? () => copyToClipboard(emailCopy, 'Email') : undefined}
            >
              {canMail ? (
                <span>
                  <Mail className="h-6 w-6" />
                </span>
              ) : (
                <span>
                  <Mail className="h-6 w-6" />
                </span>
              )}
            </Button>

            {/* Historial clínico completo en PDF. No se sabe desde aquí si el
                paciente tiene algo capturado, así que el botón siempre está
                disponible y el backend responde si no hay nada. */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full cursor-pointer"
              disabled={isLoading || descargando || !idPaciente}
              aria-label="Descargar historial clínico"
              title="Descargar historial clínico en PDF"
              onClick={() => descargarHistorial()}
            >
              {descargando ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Download className="h-6 w-6" />
              )}
            </Button>
            </div>
          </div>

          {/* dashed separator */}
          <div className="my-2 border-t border-dashed border-border" />

          {/* MAIN MENU */}
          <div>
            <p className="text-sm font-semibold tracking-widest text-muted-foreground my-3">
              MAIN MENU
            </p>

            {isLoading ? (
              <div className="space-y-1">
                <div className="h-12 w-full rounded-full bg-muted animate-pulse" />
                <div className="h-12 w-full rounded-full bg-muted/60 animate-pulse" />
                <div className="h-12 w-full rounded-full bg-muted/60 animate-pulse" />
                <div className="h-12 w-full rounded-full bg-muted/60 animate-pulse" />
              </div>
            ) : (
              <div className="space-y-1">
                {menu.map((m) => (
                  <MenuItem
                    key={m.label}
                    icon={m.icon}
                    label={m.label}
                    active={m.active}
                    onClick={m.onClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* dashed separator */}
{/* dashed separator */}
<div className="my-2 border-t border-dashed border-border" />

{/* ✅ SECCIONES DESPLEGABLES */}
<Accordion type="multiple" className="w-full">
  {/* INFORMACIÓN GENERAL */}
  <AccordionItem value="general" className="border-0">
    <AccordionTrigger className="py-2 hover:no-underline">
      <div className="flex w-full items-center justify-between">
        <p className="text-sm font-semibold tracking-widest text-muted-foreground">
          INFORMACIÓN GENERAL DEL PACIENTE
        </p>
      </div>
    </AccordionTrigger>

    <AccordionContent className="pt-1">
      {isLoading ? (
        <div className="mt-2 space-y-1">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {detailsGeneral.map((d, idx) => (
            <InfoRow key={`${d.label}-${idx}`} label={d.label} value={d.value} />
          ))}
        </div>
      )}
    </AccordionContent>
  </AccordionItem>

  {/* dashed separator entre accordions */}
  <div className="my-1 border-t border-dashed border-border" />

  {/* INFORMACIÓN DE CONTACTO */}
  <AccordionItem value="contacto" className="border-0">
    <AccordionTrigger className="py-2 hover:no-underline">
      <div className="flex w-full items-center justify-between">
        <p className="text-sm font-semibold tracking-widest text-muted-foreground">
          INFORMACIÓN DE CONTACTO
        </p>
      </div>
    </AccordionTrigger>

    <AccordionContent className="pt-2">
      {isLoading ? (
        <div className="mt-2 space-y-3">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {detailsContact.map((d, idx) => (
            <InfoRow
              key={`${d.label}-${idx}`}
              label={d.label}
              value={d.value}
              onCopy={d.copy ? () => copyToClipboard(d.copy, d.label) : undefined}
            />
          ))}
        </div>
      )}
    </AccordionContent>
  </AccordionItem>
</Accordion>

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
