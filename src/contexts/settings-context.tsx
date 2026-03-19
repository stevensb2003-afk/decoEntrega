'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { useCollection, useFirestore, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { AppConfig, FormQuestion, CSVExportColumn, Ticket, NavPath, UserRole, navLinksConfig } from '@/lib/types';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface SettingsContextType {
  config: AppConfig | null;
  isLoading: boolean;
  updateConfig: (newConfig: AppConfig) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Base columns that are not part of dynamic forms
const baseTicketColumns: Omit<CSVExportColumn, 'enabled'>[] = [
    { id: 'id', label: 'ID Tiquete (Sistema)', group: 'general' },
    { id: 'ticketId', label: 'ID Tiquete', group: 'general' },
    { id: 'status', label: 'Estatus', group: 'general' },
    { id: 'priority', label: 'Prioridad', group: 'general' },
    { id: 'ownerName', label: 'Nombre Vendedor', group: 'general' },
    { id: 'driverName', label: 'Nombre Chofer', group: 'general' },
    { id: 'createdAt', label: 'Fecha de Creación', group: 'general' },
    { id: 'updatedAt', label: 'Última Actualización', group: 'general' },
];

const defaultConfig: AppConfig = {
  id: 'main',
  maxDeliveriesPerDay: 5,
  ticketForm: [
      { fieldId: 'ticket_customerName_static', id: 'customerName', label: 'Nombre del Cliente', type: 'short-text', visible: true, required: true, placeholder: 'Juan Pérez' },
      { fieldId: 'ticket_customerPhone_static', id: 'customerPhone', label: 'Teléfono del Cliente', type: 'tel', visible: true, required: true, placeholder: '+506 8888 8888' },
      { fieldId: 'ticket_addressLink_static', id: 'addressLink', label: 'Ubicación Exacta', type: 'url', visible: true, required: true, placeholder: '' },
      { fieldId: 'ticket_ordernumber_dynamic', id: 'ordernumber', label: 'Número de Orden (Avify)', type: 'short-text', visible: true, required: false, placeholder: 'AV-12345' },
      { fieldId: 'ticket_notes_dynamic', id: 'notes', label: 'Notas de Entrega', type: 'long-text', visible: true, required: false, placeholder: 'Ej: Llevar datáfono, entregar a Emith...' },
      { fieldId: 'ticket_driverId_static', id: 'driverId', label: 'Asignar Chofer', type: 'select', visible: true, required: true, optionsSource: 'drivers' },
      { fieldId: 'ticket_deliveryDate_dynamic', id: 'deliveryDate', label: 'Fecha de Entrega', type: 'date', visible: true, required: false, placeholder: 'Seleccionar fecha' },
  ],
  validationForm: [
    { fieldId: 'validation_satisfaction_static', id: 'satisfaction', label: 'Satisfacción del Cliente', type: 'rating', visible: true, required: true },
    { fieldId: 'validation_signature_static', id: 'proofOfDeliveryUrl', label: 'Firma del Cliente', type: 'signature', visible: true, required: true },
  ],
  csvExportColumns: [], // Will be dynamically generated
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const settingsCollection = useMemoFirebase(
      () => (firestore ? collection(firestore, 'settings') : null),
      [firestore]
  );
  
  const { data: configData, isLoading: isConfigLoading } = useCollection<AppConfig>(settingsCollection);

  const config = useMemo(() => {
    if (isConfigLoading) return null;
    const existingConfig = configData?.[0];
    
    // Start with a deep copy of the default config
    const newConfig: AppConfig = JSON.parse(JSON.stringify(defaultConfig));
    
    if (existingConfig) {
      Object.assign(newConfig, existingConfig);
      
      // Ensure placeholders are updated in existing configurations since the UI doesn't expose them
      newConfig.ticketForm = (existingConfig.ticketForm || []).map((q: FormQuestion) => {
          const defaultQ = defaultConfig.ticketForm.find(df => df.id === q.id);
          if (defaultQ && defaultQ.placeholder !== undefined) {
              return { ...q, placeholder: defaultQ.placeholder };
          }
          return q;
      });
    }
    
    // Auto-sync form questions with exportable columns
    const ticketFormColumns = newConfig.ticketForm.map((q: FormQuestion) => ({ id: q.id as keyof Ticket, label: q.label, group: 'ticketForm' as const }));
    const validationFormColumns = newConfig.validationForm.map((q: FormQuestion) => ({ id: q.id as keyof Ticket, label: q.label, group: 'validationForm' as const }));
    
    const allIds = new Set(baseTicketColumns.map(c => c.id));
    const uniqueTicketFormColumns = ticketFormColumns.filter(c => !allIds.has(c.id));
    const uniqueValidationFormColumns = validationFormColumns.filter(c => !allIds.has(c.id));
    
    const allPossibleColumns: Omit<CSVExportColumn, 'enabled'>[] = [...baseTicketColumns, ...uniqueTicketFormColumns, ...uniqueValidationFormColumns];
    
    if (existingConfig && existingConfig.csvExportColumns && existingConfig.csvExportColumns.length > 0) {
      const validSavedColumns = existingConfig.csvExportColumns.filter(savedCol => 
        allPossibleColumns.some(possibleCol => possibleCol.id === savedCol.id)
      ).map(savedCol => {
        const possibleCol = allPossibleColumns.find(p => p.id === savedCol.id)!;
        return { ...possibleCol, id: savedCol.id, label: savedCol.label, group: savedCol.group };
      });
      newConfig.csvExportColumns = validSavedColumns;
    } else if (!existingConfig?.csvExportColumns || existingConfig.csvExportColumns.length === 0) {
      const defaultExportIds: (keyof Ticket | 'ownerName' | 'driverName')[] = ['ticketId', 'status', 'customerName', 'customerPhone', 'addressLink', 'ownerName', 'driverName', 'updatedAt'];
      newConfig.csvExportColumns = defaultExportIds.map(id => {
        const found = allPossibleColumns.find(c => c.id === id);
        return found ? { ...found } : null;
      }).filter(Boolean) as Omit<CSVExportColumn, 'enabled'>[];
    }
    
    newConfig.ticketForm = newConfig.ticketForm.map((q: FormQuestion, i: number) => ({...q, fieldId: q.fieldId || `${q.id}_${Date.now()}_${i}`}));
    newConfig.validationForm = newConfig.validationForm.map((q: FormQuestion, i: number) => ({...q, fieldId: q.fieldId || `${q.id}_${Date.now()}_${i}`}));

    return newConfig;

  }, [configData, isConfigLoading]);


  const processQuestionOptions = (q: FormQuestion): FormQuestion => {
    const newQ = { ...q };
    if (q.type === 'select') {
        const source = (q.optionsSource as string) || '';
        if (source === 'drivers' || source === 'customers') {
            newQ.optionsSource = source;
            newQ.options = [];
        } else if (source) {
            newQ.options = source.split(',').map((opt: string) => opt.trim());
            newQ.optionsSource = '';
        } else {
            newQ.optionsSource = '';
            newQ.options = q.options || [];
        }
    } else {
        newQ.optionsSource = '';
        newQ.options = [];
    }
    return newQ;
  };

  const updateConfig = (newConfig: AppConfig) => {
    if (!firestore) return;
    const configRef = doc(firestore, 'settings', 'main');
    
    const columnsToSave = newConfig.csvExportColumns.map(({ id, label, group }) => ({ id, label, group }));

    const processedConfig: AppConfig = {
      ...newConfig,
      ticketForm: newConfig.ticketForm.map(processQuestionOptions),
      validationForm: newConfig.validationForm.map(processQuestionOptions),
      csvExportColumns: columnsToSave,
    };

    updateDocumentNonBlocking(configRef, processedConfig);
    toast({ title: 'Settings Saved', description: 'Your form configuration has been updated.' });
  };
  
  const value = {
    config: config, 
    isLoading: isConfigLoading, 
    updateConfig,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
