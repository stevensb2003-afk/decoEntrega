

'use client';

import { FieldValue } from "firebase/firestore";

export type UserRole = 'admin' | 'vendedor' | 'chofer' | 'bodeguero';
export const UserRoles: UserRole[] = ['admin', 'vendedor', 'chofer', 'bodeguero'];

export type User = {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  role?: UserRole; // Legacy string role
  roles?: UserRole[]; // New array of roles
  avatarColor: string;
  // Fields for profile change requests
  pendingName?: string;
  pendingEmail?: string;
  pendingAvatarColor?: string;
  hasPendingChanges?: boolean;
};

export type TicketStatus = 'Pendiente' | 'Alistando' | 'En Ruta' | 'Entregado' | 'Cancelado';

export const TicketStatuses: TicketStatus[] = ['Pendiente', 'Alistando', 'En Ruta', 'Entregado', 'Cancelado'];

export type Ticket = {
  id: string; // Firestore document ID
  ticketId: string; // Sequential human-readable ID
  customerName: string;
  customerPhone: string;
  addressLink: string;
  status: TicketStatus;
  createdAt: FieldValue | string; 
  ownerId: string; // User ID of creator
  driverId: string; // User ID of assigned driver
  priority: number; // For route optimization
  satisfaction?: number; // 1-5
  proofOfDeliveryUrl?: string; // a URL to the image (or data URL for signature)
  updatedAt: FieldValue | string;
  quality?: 'Si' | 'No';
  timing?: 'Si' | 'No';
  ordernumber?: string;
  notes?: string;
  deliveryDate?: FieldValue | string;
  locationLat?: number;
  locationLng?: number;
  locationdetails?: string;
  [key: string]: any; // Allow dynamic properties
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
};

export type BlockedDate = {
  id: string; // YYYY-MM-DD
  reason: string;
}

export const navLinksConfig = {
    '/dashboard': { label: 'Mi Día', allowedRoles: ['admin', 'vendedor', 'bodeguero'] },
    '/driver': { label: 'Mi Ruta', allowedRoles: ['admin', 'chofer'] },
    '/calendar': { label: 'Calendario', allowedRoles: ['admin', 'vendedor'] },
    '/history': { label: 'Historial', allowedRoles: ['admin', 'vendedor'] },
    '/admin/users': { label: 'Usuarios', allowedRoles: ['admin'] },
    '/admin/settings': { label: 'Configuraciones', allowedRoles: ['admin'] },
} as const;

export type NavPath = keyof typeof navLinksConfig;


// Configuration types
export type QuestionType = 'short-text' | 'long-text' | 'tel' | 'url' | 'select' | 'rating' | 'photo' | 'date' | 'signature';

export interface FormQuestion {
    fieldId: string; // A unique, stable ID for the field itself
    id: string; // The user-facing ID/key, can be edited
    label: string;
    type: QuestionType;
    visible: boolean;
    required: boolean;
    placeholder?: string;
    optionsSource?: 'drivers' | 'customers' | '';
    options?: string[];
}

export type CSVExportColumn = {
    id: keyof Ticket | 'ownerName' | 'driverName';
    label: string;
    group: 'general' | 'ticketForm' | 'validationForm';
}

export interface AppConfig {
  id: 'main'; // Singleton document ID
  maxDeliveriesPerDay: number;
  ticketForm: FormQuestion[];
  validationForm: FormQuestion[];
  csvExportColumns: Omit<CSVExportColumn, 'enabled'>[];
}
