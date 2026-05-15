import type { EstadoOKR, EstadoSesion, Modalidad } from '../types';

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
};

export const getEstadoOKRColor = (estado: EstadoOKR): string => {
  const colors: Record<EstadoOKR, string> = {
    Pendiente: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
    EnProgreso: 'bg-nexus-600/20 text-nexus-300 border-nexus-500/30',
    Completado: 'bg-success-600/20 text-success-400 border-success-500/30',
    Cancelado: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  };
  return colors[estado];
};

export const getEstadoSesionColor = (estado: EstadoSesion): string => {
  const colors: Record<EstadoSesion, string> = {
    Programada: 'bg-nexus-600/20 text-nexus-300 border-nexus-500/30',
    Realizada: 'bg-success-600/20 text-success-400 border-success-500/30',
    Cancelada: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  };
  return colors[estado];
};

export const getModalidadColor = (modalidad: Modalidad): string => {
  const colors: Record<Modalidad, string> = {
    Presencial: 'bg-nexus-600/20 text-nexus-300 border-nexus-500/30',
    Remoto: 'bg-success-600/20 text-success-400 border-success-500/30',
    Hibrido: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  };
  return colors[modalidad];
};

export const getProgressPercentage = (actual: number, meta: number): number => {
  if (meta <= 0) return 0;
  return Math.min(100, Math.round((actual / meta) * 100));
};
