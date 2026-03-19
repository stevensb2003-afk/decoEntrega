'use client';

import { useUserContext } from '@/contexts/user-context';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { UserRole } from '@/lib/types';


export const useAuth = () => {
    const { currentUser, isUserLoading } = useUserContext();
    const auth = useFirebaseAuth();

    const logout = () => {
        auth.signOut();
    };

    const hasRole = (role: UserRole) => {
        if (currentUser?.roles) {
            return currentUser.roles.includes(role);
        }
        return currentUser?.role === role;
    }

    return {
        currentUser,
        isUserLoading,
        logout,
        hasRole
    };
};
