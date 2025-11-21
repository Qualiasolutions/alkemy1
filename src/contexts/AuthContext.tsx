import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, auth, isSupabaseConfigured } from '@/services/supabase';
import { User, AuthState } from '@/types';

interface AuthContextValue extends AuthState {
    signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signInWithProvider: (provider: 'google' | 'github') => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
    resetPassword: (email: string) => Promise<{ error: any }>;
    updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper to transform Supabase user to our User type
const transformUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;

    return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        subscription_tier: supabaseUser.user_metadata?.subscription_tier || 'free',
        created_at: supabaseUser.created_at,
        updated_at: supabaseUser.updated_at,
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    // Check if Supabase is configured (optional auth mode)
    const supabaseEnabled = isSupabaseConfigured();

    useEffect(() => {
        if (!supabaseEnabled) {
            // No Supabase configuration, operate in anonymous mode
            setState({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
            return;
        }

        let mounted = true;

        // Get initial session
        const initializeAuth = async () => {
            try {
                const { session, error } = await auth.getSession();
                if (error) throw error;

                if (mounted) {
                    setState({
                        user: transformUser(session?.user || null),
                        session,
                        isAuthenticated: !!session,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (mounted) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to initialize auth',
                    }));
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: authListener } = auth.onAuthStateChange(async (event, session) => {
            if (mounted) {
                setState(prev => ({
                    ...prev,
                    user: transformUser(session?.user || null),
                    session,
                    isAuthenticated: !!session,
                    error: null,
                }));

                // Handle specific auth events
                if (event === 'SIGNED_IN') {
                    console.log('User signed in:', session?.user?.email);
                } else if (event === 'SIGNED_OUT') {
                    console.log('User signed out');
                } else if (event === 'TOKEN_REFRESHED') {
                    console.log('Token refreshed');
                }
            }
        });

        return () => {
            mounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, [supabaseEnabled]);

    const signUp = async (email: string, password: string, name?: string) => {
        if (!supabaseEnabled) {
            return { error: { message: 'Authentication is not configured' } };
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const { user, session, error } = await auth.signUp(email, password, { name });

            if (error) throw error;

            setState(prev => ({
                ...prev,
                user: transformUser(user),
                session,
                isAuthenticated: !!session,
                isLoading: false,
                error: null,
            }));

            return { error: null };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign up failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { error: { message } };
        }
    };

    const signIn = async (email: string, password: string) => {
        if (!supabaseEnabled) {
            return { error: { message: 'Authentication is not configured' } };
        }

        // Input validation to prevent invalid requests
        if (!email || !password || email.trim() === '' || password.trim() === '') {
            return { error: { message: 'Email and password are required' } };
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return { error: { message: 'Please enter a valid email address' } };
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const { user, session, error } = await auth.signIn(email.trim(), password);

            if (error) throw error;

            setState(prev => ({
                ...prev,
                user: transformUser(user),
                session,
                isAuthenticated: !!session,
                isLoading: false,
                error: null,
            }));

            return { error: null };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign in failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { error: { message } };
        }
    };

    const signInWithProvider = async (provider: 'google' | 'github') => {
        if (!supabaseEnabled) {
            return { error: { message: 'Authentication is not configured' } };
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const { error } = await auth.signInWithProvider(provider);

            if (error) throw error;

            // Auth state will be updated by the auth listener
            setState(prev => ({ ...prev, isLoading: false }));

            return { error: null };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Provider sign in failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { error: { message } };
        }
    };

    const signOut = async () => {
        if (!supabaseEnabled) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const { error } = await auth.signOut();
            if (error) throw error;

            setState({
                user: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign out failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
        }
    };

    const updateProfile = async (updates: Partial<User>) => {
        if (!supabaseEnabled || !state.user) {
            return { error: { message: 'Not authenticated' } };
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Update auth metadata
            const { data: authData, error: authError } = await auth.updateUser({
                data: {
                    name: updates.name,
                    avatar_url: updates.avatar_url,
                    subscription_tier: updates.subscription_tier,
                },
            });

            if (authError) throw authError;

            // Update user profile in database
            const { error: dbError } = await supabase
                .from('user_profiles')
                .update({
                    name: updates.name,
                    avatar_url: updates.avatar_url,
                    subscription_tier: updates.subscription_tier,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', state.user.id);

            if (dbError) throw dbError;

            // Update local state
            setState(prev => ({
                ...prev,
                user: prev.user ? { ...prev.user, ...updates } : null,
                isLoading: false,
                error: null,
            }));

            return { error: null };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Profile update failed';
            setState(prev => ({ ...prev, isLoading: false, error: message }));
            return { error: { message } };
        }
    };

    const resetPassword = async (email: string) => {
        if (!supabaseEnabled) {
            return { error: { message: 'Authentication is not configured' } };
        }

        try {
            const { error } = await auth.resetPassword(email);
            if (error) throw error;
            return { error: null };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Password reset failed';
            return { error: { message } };
        }
    };

    const updatePassword = async (newPassword: string) => {
        if (!supabaseEnabled || !state.isAuthenticated) {
            return { error: { message: 'Not authenticated' } };
        }

        try {
            const { error } = await auth.updatePassword(newPassword);
            if (error) throw error;
            return { error: null };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Password update failed';
            return { error: { message } };
        }
    };

    const value: AuthContextValue = {
        ...state,
        signUp,
        signIn,
        signInWithProvider,
        signOut,
        updateProfile,
        resetPassword,
        updatePassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper hook to check if user has permission for certain actions
export const usePermission = (requiredTier?: 'free' | 'pro' | 'enterprise') => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated || !user) return false;
    if (!requiredTier) return true;

    const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
    const userTier = user.subscription_tier || 'free';

    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
};