'use client';

import React, { useEffect } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User } from '@/lib/types';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  avatarColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Invalid color format.'),
});

interface EditProfileModalProps {
  user: User;
}

export function EditProfileModal({ user }: EditProfileModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      avatarColor: user.avatarColor || '#000000',
    },
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    if (!firestore) return;

    const userRef = doc(firestore, 'users', user.id);
    
    const updateData: any = {
      hasPendingChanges: true,
      updatedAt: serverTimestamp(),
    };

    let hasChanges = false;
    if (data.name !== user.name) {
      updateData.pendingName = data.name;
      hasChanges = true;
    }
    if (data.email !== user.email) {
      updateData.pendingEmail = data.email;
      hasChanges = true;
    }
    if (data.avatarColor !== user.avatarColor) {
        updateData.pendingAvatarColor = data.avatarColor;
        hasChanges = true;
    }

    if (!hasChanges) {
      toast({
        variant: 'destructive',
        title: 'No Changes',
        description: 'You have not made any changes to your profile.',
      });
      return;
    }

    updateDocumentNonBlocking(userRef, updateData);

    toast({
      title: 'Request Sent',
      description: 'Your profile change request has been submitted for admin approval.',
    });
    // Closing is now handled by DialogClose
  };
  
  useEffect(() => {
      reset({
        name: user.name || '',
        email: user.email || '',
        avatarColor: user.avatarColor || '#000000',
      });
  }, [user, reset]);

  return (
    <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Submit a request to change your profile information. Changes require admin approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
             {user.hasPendingChanges && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Pending Approval</AlertTitle>
                <AlertDescription>
                  You have a pending change request. Submitting a new one will overwrite the previous one.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input id="name" {...field} className="col-span-3" />
                )}
              />
              {errors.name && <p className="col-span-4 text-xs text-destructive text-right">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input id="email" {...field} className="col-span-3" />
                )}
              />
               {errors.email && <p className="col-span-4 text-xs text-destructive text-right">{errors.email.message}</p>}
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="avatarColor" className="text-right">
                Avatar Color
              </Label>
              <Controller
                name="avatarColor"
                control={control}
                render={({ field }) => (
                    <Input id="avatarColor" type="color" {...field} className="col-span-3 h-10 p-1" />
                )}
              />
               {errors.avatarColor && <p className="col-span-4 text-xs text-destructive text-right">{errors.avatarColor.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Submit for Approval</Button>
          </DialogFooter>
        </form>
      </DialogContent>
  );
}
