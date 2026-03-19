'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { User } from '@/lib/types';


interface UserContextType {
    currentUser: (User & { id: string; }) | null;
    isUserLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: authUser, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
        [authUser, firestore]
    );

    const { data: userDetails, isLoading: isDetailsLoading } = useDoc<User>(userDocRef);

    const currentUser = useMemo(() => {
        if (authUser && userDetails) {
            return { ...userDetails, id: authUser.uid };
        }
        return null;
    }, [authUser, userDetails]);

    const isUserLoading = isAuthLoading || isDetailsLoading;

    const value = {
        currentUser,
        isUserLoading
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};


export const useUserContext = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};
