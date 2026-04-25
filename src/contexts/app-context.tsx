
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { User, Ticket, TicketStatus, Customer, BlockedDate, Project, ProjectStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useUser,
  useFirestore,
  useMemoFirebase,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { collection, doc, serverTimestamp, query, where, Timestamp, setDoc, FieldValue } from 'firebase/firestore';
import { useSettingsContext }from '@/contexts/settings-context';
import { parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

interface AppContextType {
  users: User[];
  tickets: Ticket[];
  customers: Customer[];
  blockedDates: BlockedDate[];
  isLoading: boolean;
  addTicket: (newTicketData: Omit<Ticket, 'id' | 'ticketId' | 'createdAt' | 'updatedAt' | 'ownerId' | 'status' | 'priority'>, ticketId: string) => void;
  updateTicket: (ticketId: string, updatedData: Partial<Omit<Ticket, 'deliveryDate'> & { deliveryDate?: FieldValue }>) => void;
  updateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  updateTicketPriority: (ticketId: string, newPriority: number) => void;
  updateTicketValidation: (ticketId: string, validationData: { [key: string]: any }) => void;
  deleteTicket: (ticketId: string) => void;
  reverseTicketConfirmation: (ticketId: string) => void;
  getTicketById: (ticketId: string) => Ticket | undefined;
  getDriverTickets: (driverId: string) => Ticket[];
  ticketsByDay: { [key: string]: Ticket[] };
  addBlockedDate: (date: string, reason: string) => void;
  removeBlockedDate: (date: string) => void;
  moveTicketToPosition: (ticketId: string, newPosition: number) => void;

  // Projects
  projects: Project[];
  isProjectsLoading: boolean;
  addProject: (newProjectData: Omit<Project, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'ownerId' | 'status'>, projectId: string) => void;
  updateProject: (projectId: string, updatedData: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  getProjectById: (projectId: string) => Project | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { currentUser } = useAuth();
  const firestore = useFirestore();
  const { config: settingsConfig } = useSettingsContext();
  const { toast } = useToast();

  const usersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: usersData, isLoading: isUsersLoading } = useCollection<User>(usersCollection);
  const users = usersData || [];

  const customersCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'customers') : null),
    [firestore]
  );
  const { data: customersData, isLoading: isCustomersLoading } = useCollection<Customer>(customersCollection);
  const customers = customersData || [];
  
  const blockedDatesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'blockedDates') : null),
    [firestore]
  );
  const { data: blockedDatesData, isLoading: isBlockedDatesLoading } = useCollection<BlockedDate>(blockedDatesCollection);
  const blockedDates = blockedDatesData || [];

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    const ticketsCollectionRef = collection(firestore, 'tickets');
    const userRoles = currentUser.roles || (currentUser.role ? [currentUser.role] : []);
    const isOnlyDriver = userRoles.includes('chofer') && !userRoles.some(r => ['admin', 'vendedor', 'bodeguero'].includes(r));
    if (isOnlyDriver) {
        return query(ticketsCollectionRef, where('driverId', '==', currentUser.id));
    }
    return ticketsCollectionRef;
  }, [firestore, currentUser]);

  const { data: ticketsData, isLoading: isTicketsLoading } = useCollection<Ticket>(ticketsQuery);
  const tickets = ticketsData || [];

  // Projects Query
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    const projectsCollectionRef = collection(firestore, 'projects');
    const userRoles = currentUser.roles || (currentUser.role ? [currentUser.role] : []);
    
    // Check if user is ONLY an instalador
    const isOnlyInstaller = userRoles.includes('instalador') && userRoles.length === 1;
    
    if (isOnlyInstaller) {
        return query(projectsCollectionRef, where('installerIds', 'array-contains', currentUser.id));
    }
    
    return projectsCollectionRef; // Admin and Vendedor can see all projects
  }, [firestore, currentUser]);

  const { data: projectsData, isLoading: isProjectsLoading } = useCollection<Project>(projectsQuery);
  const projects = projectsData || [];

  const ticketsByDay = useMemo(() => {
    const grouped: { [key: string]: Ticket[] } = {};
    tickets.forEach((ticket) => {
        let date: Date | null = null;
        if (ticket.deliveryDate) {
            if (ticket.deliveryDate instanceof Timestamp) {
                date = ticket.deliveryDate.toDate();
            } else if (typeof ticket.deliveryDate === 'string') {
                date = parseISO(ticket.deliveryDate);
            }
        } else if (ticket.createdAt) {
             if (ticket.createdAt instanceof Timestamp) {
                date = ticket.createdAt.toDate();
            } else if (typeof ticket.createdAt === 'string') {
                date = parseISO(ticket.createdAt);
            }
        }
        
        if (date) {
            const dayKey = formatDate(date);
            if (!grouped[dayKey]) {
                grouped[dayKey] = [];
            }
            grouped[dayKey].push(ticket);
        }
    });
    return grouped;
  }, [tickets]);

  const addTicket = (newTicketData: Omit<Ticket, 'id' | 'ticketId' | 'createdAt' | 'updatedAt' | 'ownerId' | 'status' | 'priority'>, ticketId: string) => {
    if (!user || !firestore) return;
    const ticketsCollectionRef = collection(firestore, 'tickets');
    
    const nextTicketNumber = (tickets?.length || 0) + 1;

    const newTicket = {
      ...newTicketData,
      deliveryDate: newTicketData.deliveryDate || new Date(), // Set today's date if not provided
      ticketId: ticketId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerId: user.uid,
      status: 'Pendiente' as TicketStatus,
      priority: nextTicketNumber,
    };
    
    addDocumentNonBlocking(ticketsCollectionRef, newTicket);
    toast({ title: "Ticket Created", description: `A new ticket ${ticketId} has been successfully created.` });
  };
  
  const updateTicket = (ticketId: string, updatedData: Partial<Omit<Ticket, 'deliveryDate'> & { deliveryDate?: FieldValue }>) => {
    if (!firestore) return;
    const ticketRef = doc(firestore, 'tickets', ticketId);
    updateDocumentNonBlocking(ticketRef, { ...updatedData, updatedAt: serverTimestamp() });
    toast({ title: 'Ticket Updated', description: 'The ticket has been successfully updated.' });
  };

  const updateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    if (!firestore) return;
    const ticketRef = doc(firestore, 'tickets', ticketId);
    updateDocumentNonBlocking(ticketRef, { status: newStatus, updatedAt: serverTimestamp() });
  };

  const updateTicketPriority = (ticketId: string, newPriority: number) => {
    if (!firestore) return;
    const ticketRef = doc(firestore, 'tickets', ticketId);
    updateDocumentNonBlocking(ticketRef, { priority: newPriority, updatedAt: serverTimestamp() });
  }
  
  const updateTicketValidation = (ticketId: string, validationData: { [key: string]: any }) => {
    if (!firestore) return;
    const ticketRef = doc(firestore, 'tickets', ticketId);
    
    const updateData = {
      ...validationData,
      status: 'Entregado',
      updatedAt: serverTimestamp()
    };
    
    updateDocumentNonBlocking(ticketRef, updateData);
    toast({ title: "Ticket Validated", description: `Ticket has been updated.` });
  };

  const deleteTicket = (ticketId: string) => {
    if (!firestore) return;
    const ticketRef = doc(firestore, 'tickets', ticketId);
    deleteDocumentNonBlocking(ticketRef);
    toast({ variant: 'destructive', title: "Ticket Deleted", description: "The ticket has been permanently removed."});
  };

  const reverseTicketConfirmation = (ticketId: string) => {
    if (!firestore || !settingsConfig) return;
    const ticketRef = doc(firestore, 'tickets', ticketId);

    // Create an object to clear all dynamic validation fields
    const fieldsToClear = settingsConfig.validationForm.reduce((acc, question) => {
        acc[question.id] = null;
        return acc;
    }, {} as {[key: string]: any});


    const updateData = {
        ...fieldsToClear,
        status: 'En Ruta',
        updatedAt: serverTimestamp()
    };
    
    updateDocumentNonBlocking(ticketRef, updateData);
    toast({ title: "Confirmation Reversed", description: "Ticket status has been set back to 'En Ruta'." });
  };

  const getTicketById = (ticketId: string): Ticket | undefined => {
    return tickets?.find(t => t.id === ticketId);
  };
  
  const getDriverTickets = (driverId: string) => {
    return tickets?.filter(t => t.driverId === driverId && t.status === 'En Ruta').sort((a, b) => a.priority - b.priority) || [];
  }
  
  const addBlockedDate = (date: string, reason: string) => {
      if (!firestore) return;
      const blockedDateRef = doc(firestore, 'blockedDates', date);
      // Using setDoc with the date as the ID is idempotent
      setDoc(blockedDateRef, { date, reason });
      const toastMessage = reason === 'Unblocked by User' ? 'Date Unblocked' : 'Date Blocked';
      const toastDescription = reason === 'Unblocked by User' ? `Date ${date} is now available.` : `Date ${date} has been blocked.`;
      toast({ title: toastMessage, description: toastDescription });
  };

  const removeBlockedDate = (date: string) => {
      if (!firestore) return;
      const blockedDateRef = doc(firestore, 'blockedDates', date);
      deleteDocumentNonBlocking(blockedDateRef);
      toast({ title: 'Date Unblocked', description: `Date ${date} is now available for deliveries.` });
  };
  
  const moveTicketToPosition = (ticketId: string, newPosition: number) => {
    if (!firestore) return;

    // Get all tickets currently in the 'En Ruta' column and sort them by priority
    const ticketsInRuta = tickets.filter(t => t.status === 'En Ruta').sort((a, b) => a.priority - b.priority);
    const ticketToMove = ticketsInRuta.find(t => t.id === ticketId);

    if (!ticketToMove) return;

    // Find the ticket's current position in the sorted list
    const originalIndex = ticketsInRuta.findIndex(t => t.id === ticketId);
    
    // Remove the ticket from its original position
    ticketsInRuta.splice(originalIndex, 1);
    
    // Insert the ticket into its new position (adjusting for 0-based index from 1-based UI)
    ticketsInRuta.splice(newPosition - 1, 0, ticketToMove);

    // Re-assign priorities to the entire list to maintain order and update in Firestore
    ticketsInRuta.forEach((ticket, index) => {
        const newPriority = (index + 1) * 10; // Use increments of 10 to allow for drag-and-drop later
        // Only write to the database if the priority has actually changed
        if (ticket.priority !== newPriority) {
            const ticketRef = doc(firestore, 'tickets', ticket.id);
            updateDocumentNonBlocking(ticketRef, { priority: newPriority, updatedAt: serverTimestamp() });
        }
    });

    toast({ title: 'Prioridad Actualizada', description: `Tiquete ${ticketToMove.ticketId} movido a la posición ${newPosition}.` });
  };

  // --- Project CRUD ---
  const addProject = (newProjectData: Omit<Project, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'ownerId' | 'status'>, projectId: string) => {
    if (!user || !firestore) return;
    const projectsCollectionRef = collection(firestore, 'projects');

    const newProject = {
      ...newProjectData,
      projectId: projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerId: user.uid,
      status: 'Pendiente' as ProjectStatus,
    };
    
    addDocumentNonBlocking(projectsCollectionRef, newProject);
    toast({ title: "Proyecto Creadado", description: `Un nuevo proyecto ${projectId} ha sido creado exitosamente.` });
  };

  const updateProject = (projectId: string, updatedData: Partial<Project>) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    updateDocumentNonBlocking(projectRef, { ...updatedData, updatedAt: serverTimestamp() });
    toast({ title: 'Proyecto Actualizado', description: 'El proyecto ha sido actualizado exitosamente.' });
  };

  const deleteProject = (projectId: string) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    deleteDocumentNonBlocking(projectRef);
    toast({ variant: 'destructive', title: "Proyecto Eliminado", description: "El proyecto ha sido eliminado permanentemente."});
  };

  const getProjectById = (projectId: string): Project | undefined => {
    return projects?.find(p => p.id === projectId);
  };

  const value = {
    users,
    tickets,
    customers,
    blockedDates,
    isLoading: isUsersLoading || isTicketsLoading || isCustomersLoading || isBlockedDatesLoading,
    addTicket,
    updateTicket,
    updateTicketStatus,
    updateTicketPriority,
    updateTicketValidation,
    deleteTicket,
    reverseTicketConfirmation,
    getTicketById,
    getDriverTickets,
    ticketsByDay,
    addBlockedDate,
    removeBlockedDate,
    moveTicketToPosition,
    
    // Projects
    projects,
    isProjectsLoading,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
