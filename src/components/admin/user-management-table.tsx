'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, AlertTriangle, CheckCircle, Trash2, Shield, Edit, Eye } from 'lucide-react';
import { User, UserRole, UserRoles } from '@/lib/types';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { EditProfileModal } from '../profile/edit-profile-modal';

interface UserManagementTableProps {
  users: User[];
}

const ViewChangesModal = ({ user, isOpen, onOpenChange }: { user: User; isOpen: boolean; onOpenChange: (open: boolean) => void; }) => {
    if (!user.hasPendingChanges) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cambios Pendientes para {user.name}</DialogTitle>
                    <DialogDescription>Revisa los cambios solicitados a continuación.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {user.pendingName && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-lg">"{user.name}" {'->'} "{user.pendingName}"</p>
                        </div>
                    )}
                    {user.pendingEmail && (
                         <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-lg">"{user.email}" {'->'} "{user.pendingEmail}"</p>
                        </div>
                    )}
                     {user.pendingAvatarColor && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Avatar Color</p>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full" style={{backgroundColor: user.avatarColor}}></div>
                                <p>{'->'}</p>
                                <div className="w-6 h-6 rounded-full" style={{backgroundColor: user.pendingAvatarColor}}></div>
                                <p className="text-lg">{user.pendingAvatarColor}</p>
                            </div>
                        </div>
                    )}
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="secondary">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export function UserManagementTable({ users }: UserManagementTableProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [viewingChangesUser, setViewingChangesUser] = useState<User | null>(null);

    const handleApprove = (userId: string, pendingData: Partial<User>) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        
        const updateData: any = {
            hasPendingChanges: false,
            pendingName: null,
            pendingEmail: null,
            pendingAvatarColor: null,
        };
        if (pendingData.pendingName) updateData.name = pendingData.pendingName;
        if (pendingData.pendingEmail) updateData.email = pendingData.pendingEmail;
        if (pendingData.pendingAvatarColor) updateData.avatarColor = pendingData.pendingAvatarColor;
        
        if (pendingData.pendingEmail) {
             toast({
                title: 'Email Change Approved',
                description: "Email changes must be done by an admin manually in the Firebase console to ensure account security.",
            });
        }
        
        updateDocumentNonBlocking(userRef, updateData);
        
        toast({
            title: 'Changes Approved',
            description: `User's Firestore record has been updated.`,
        });
    };

    const handleRoleChange = (userId: string, newRoles: UserRole[]) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        updateDocumentNonBlocking(userRef, { role: newRoles[0], roles: newRoles });
         toast({
            title: 'Roles Updated',
            description: `User's roles have been updated.`,
        });
    };

    const handleDelete = (userId: string) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        // Note: This only deletes the Firestore user document, not the Firebase Auth user.
        // A Cloud Function is needed to delete the auth user.
        deleteDoc(userRef).then(() => {
            toast({
                title: 'User Document Deleted',
                description: `Firestore record for user has been deleted. Auth user must be deleted manually.`,
            });
        }).catch(err => {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: err.message,
            });
        })
    };


  return (
    <>
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Cambios Pendientes</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(user.roles || (user.role ? [user.role] : [])).map((r) => (
                    <Badge key={r} variant="secondary" className="capitalize">{r}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                  <Badge variant="outline" className="inline-flex items-center gap-1 text-green-600 border-green-600 self-start">
                     <CheckCircle className="h-3 w-3" />
                     Activo
                  </Badge>
              </TableCell>
               <TableCell>
                {user.hasPendingChanges ? (
                   <Button variant="destructive" size="sm" onClick={() => setViewingChangesUser(user)}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Revisar Solicitud
                  </Button>
                ) : (
                   <span className="text-sm text-muted-foreground">Ninguno</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <Dialog>
                        <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                 <Edit className="mr-2 h-4 w-4" />
                                Editar Perfil
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <EditProfileModal user={user} />
                     </Dialog>
                    {user.hasPendingChanges && (
                        <>
                        <DropdownMenuItem onClick={() => setViewingChangesUser(user)} onSelect={(e) => e.preventDefault()}>
                             <Eye className="mr-2 h-4 w-4" />
                            Ver Solicitudes de Cambio
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleApprove(user.id, user)}>
                             <CheckCircle className="mr-2 h-4 w-4" />
                            Aprobar Cambios
                        </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                             <Shield className="mr-2 h-4 w-4" />
                            Cambiar Rol
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <div className="p-2 space-y-2">
                                {UserRoles.map(role => {
                                    const currentRoles = user.roles || (user.role ? [user.role] : []);
                                    const isChecked = currentRoles.includes(role);
                                    return (
                                      <div key={role} className="flex items-center space-x-2">
                                          <input 
                                              type="checkbox" 
                                              id={`role-${user.id}-${role}`}
                                              checked={isChecked}
                                              onChange={(e) => {
                                                  const newRoles = e.target.checked 
                                                      ? [...currentRoles, role]
                                                      : currentRoles.filter(r => r !== role);
                                                  if (newRoles.length > 0) {
                                                      handleRoleChange(user.id, newRoles);
                                                  } else {
                                                      toast({ title: 'Error', description: 'A user must have at least one role.', variant: 'destructive' });
                                                  }
                                              }}
                                          />
                                          <label htmlFor={`role-${user.id}-${role}`} className="capitalize text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                              {role}
                                          </label>
                                      </div>
                                    );
                                })}
                            </div>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                 <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar Usuario
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                             <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el documento del usuario de Firestore. El registro de autenticación debe eliminarse por separado desde la Consola de Firebase.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                             <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    {viewingChangesUser && (
        <ViewChangesModal
            user={viewingChangesUser}
            isOpen={!!viewingChangesUser}
            onOpenChange={(open) => !open && setViewingChangesUser(null)}
        />
    )}
    </>
  );
}
