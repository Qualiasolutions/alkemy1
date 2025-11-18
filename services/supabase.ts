import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Supabase configuration with fallback values for development
// Trim all keys to remove any accidental whitespace or newlines
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '').trim();

// Create a single supabase client for interacting with your database
// Only create the client if we have valid configuration
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
    })
    : null as any;

// Create a service role client for server-side operations (bypasses RLS)
export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
    ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null as any;

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey);
};

// Auth helper functions
export const auth = {
    // Sign up with email and password
    signUp: async (email: string, password: string, metadata?: { name?: string }) => {
        if (!supabase) {
            return { user: null, session: null, error: new Error('Supabase is not configured') };
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        return { user: data?.user, session: data?.session, error };
    },

    // Sign in with email and password
    signIn: async (email: string, password: string) => {
        if (!supabase) {
            return { user: null, session: null, error: new Error('Supabase is not configured') };
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { user: data?.user, session: data?.session, error };
    },

    // Sign in with OAuth provider
    signInWithProvider: async (provider: 'google' | 'github' | 'gitlab' | 'bitbucket') => {
        if (!supabase) {
            return { data: null, error: new Error('Supabase is not configured') };
        }
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { data, error };
    },

    // Sign out
    signOut: async () => {
        if (!supabase) {
            return { error: new Error('Supabase is not configured') };
        }
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Get current user
    getUser: async () => {
        if (!supabase) {
            return { user: null, error: new Error('Supabase is not configured') };
        }
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Get current session
    getSession: async () => {
        if (!supabase) {
            return { session: null, error: new Error('Supabase is not configured') };
        }
        const { data: { session }, error } = await supabase.auth.getSession();
        return { session, error };
    },

    // Reset password
    resetPassword: async (email: string) => {
        if (!supabase) {
            return { data: null, error: new Error('Supabase is not configured') };
        }
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { data, error };
    },

    // Update password
    updatePassword: async (newPassword: string) => {
        if (!supabase) {
            return { data: null, error: new Error('Supabase is not configured') };
        }
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        return { data, error };
    },

    // Update user metadata
    updateUser: async (updates: { email?: string; password?: string; data?: Record<string, any> }) => {
        if (!supabase) {
            return { data: null, error: new Error('Supabase is not configured') };
        }
        const { data, error } = await supabase.auth.updateUser(updates);
        return { data, error };
    },

    // Listen to auth state changes
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        if (!supabase) {
            return { data: null, error: new Error('Supabase is not configured') } as any;
        }
        return supabase.auth.onAuthStateChange(callback);
    },
};

// Database helper functions for projects
export const db = {
    projects: {
        // Create a new project
        create: async (project: any) => {
            const { data, error } = await supabase
                .from('projects')
                .insert([project])
                .select()
                .single();
            return { data, error };
        },

        // Get all projects for current user
        list: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('updated_at', { ascending: false });
            return { data, error };
        },

        // Get a single project
        get: async (id: string) => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();
            return { data, error };
        },

        // Update a project
        update: async (id: string, updates: any) => {
            const { data, error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        },

        // Delete a project
        delete: async (id: string) => {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);
            return { error };
        },

        // Subscribe to project changes
        subscribe: (projectId: string, callback: (payload: any) => void) => {
            return supabase
                .channel(`project-${projectId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'projects',
                    filter: `id=eq.${projectId}`,
                }, callback)
                .subscribe();
        },
    },

    // Storage helper for media files
    storage: {
        // Upload a file
        upload: async (bucket: string, path: string, file: File) => {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false,
                });
            return { data, error };
        },

        // Get public URL for a file
        getPublicUrl: (bucket: string, path: string) => {
            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(path);
            return data.publicUrl;
        },

        // Delete a file
        delete: async (bucket: string, paths: string[]) => {
            const { data, error } = await supabase.storage
                .from(bucket)
                .remove(paths);
            return { data, error };
        },

        // List files in a folder
        list: async (bucket: string, path: string) => {
            const { data, error } = await supabase.storage
                .from(bucket)
                .list(path);
            return { data, error };
        },
    },
};

/**
 * Get the current authenticated user's ID
 *
 * Epic 2 - Character Identity System
 * Used by characterIdentityService.ts for uploading reference images to user-scoped storage paths
 *
 * @returns User ID (UUID) or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
    if (!supabase) {
        console.warn('Supabase is not configured - cannot get current user ID');
        return null;
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Failed to get current user:', error);
            return null;
        }

        return user?.id || null;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        return null;
    }
}