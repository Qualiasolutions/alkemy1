import { supabase, isSupabaseConfigured } from './supabase';

export interface UsageLog {
  id: string;
  user_id: string;
  project_id?: string | null;
  action: string;
  tokens_used?: number | null;
  cost_usd?: number | null;
  metadata?: any;
  created_at: string;
}

export interface UsageService {
  logUsage: (userId: string, action: string, data?: {
    projectId?: string;
    tokensUsed?: number;
    costUsd?: number;
    metadata?: any;
  }) => Promise<{ error: any }>;
  getUserUsage: (userId: string, startDate?: Date, endDate?: Date) => Promise<{ logs: UsageLog[] | null; error: any }>;
  getUserTotalUsage: (userId: string) => Promise<{
    totalTokens: number;
    totalCost: number;
    logs: UsageLog[] | null;
    error: any
  }>;
  getProjectUsage: (projectId: string) => Promise<{ logs: UsageLog[] | null; error: any }>;
  deleteUsageLogs: (userId: string, olderThanDays?: number) => Promise<{ error: any }>;
}

class UsageServiceImpl implements UsageService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = isSupabaseConfigured();
  }

  async logUsage(userId: string, action: string, data?: {
    projectId?: string;
    tokensUsed?: number;
    costUsd?: number;
    metadata?: any;
  }): Promise<{ error: any }> {
    if (!this.isConfigured) {
      // Fallback: just log to console
      console.log('Usage:', { userId, action, data });
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('usage_logs')
        .insert([{
          user_id: userId,
          project_id: data?.projectId || null,
          action,
          tokens_used: data?.tokensUsed || null,
          cost_usd: data?.costUsd || null,
          metadata: data?.metadata || {},
        }]);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error logging usage:', error);
      return { error };
    }
  }

  async getUserUsage(userId: string, startDate?: Date, endDate?: Date): Promise<{ logs: UsageLog[] | null; error: any }> {
    if (!this.isConfigured) {
      return { logs: null, error: new Error('Supabase is not configured') };
    }

    try {
      let query = supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Add date filters if provided
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return { logs: data, error: null };
    } catch (error) {
      console.error('Error getting user usage:', error);
      return { logs: null, error };
    }
  }

  async getUserTotalUsage(userId: string): Promise<{
    totalTokens: number;
    totalCost: number;
    logs: UsageLog[] | null;
    error: any
  }> {
    if (!this.isConfigured) {
      return { totalTokens: 0, totalCost: 0, logs: null, error: new Error('Supabase is not configured') };
    }

    try {
      // Get all logs for the user
      const { logs, error } = await this.getUserUsage(userId);

      if (error || !logs) {
        return { totalTokens: 0, totalCost: 0, logs: null, error };
      }

      // Calculate totals
      const totalTokens = logs.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
      const totalCost = logs.reduce((sum, log) => sum + (log.cost_usd || 0), 0);

      return { totalTokens, totalCost, logs, error: null };
    } catch (error) {
      console.error('Error getting user total usage:', error);
      return { totalTokens: 0, totalCost: 0, logs: null, error };
    }
  }

  async getProjectUsage(projectId: string): Promise<{ logs: UsageLog[] | null; error: any }> {
    if (!this.isConfigured) {
      return { logs: null, error: new Error('Supabase is not configured') };
    }

    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { logs: data, error: null };
    } catch (error) {
      console.error('Error getting project usage:', error);
      return { logs: null, error };
    }
  }

  async deleteUsageLogs(userId: string, olderThanDays: number = 90): Promise<{ error: any }> {
    if (!this.isConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from('usage_logs')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting usage logs:', error);
      return { error };
    }
  }
}

// Export singleton instance
export const usageService: UsageService = new UsageServiceImpl();

// Predefined action types for consistency
export const USAGE_ACTIONS = {
  // AI Generation actions
  SCRIPT_ANALYSIS: 'script_analysis',
  FRAME_GENERATION: 'frame_generation',
  IMAGE_GENERATION: 'image_generation',
  VIDEO_GENERATION: 'video_generation',
  VIDEO_ANALYSIS: 'video_analysis',
  IMAGE_UPSCALING: 'image_upscaling',
  VIDEO_UPSCALING: 'video_upscaling',
  MOTION_TRANSFER: 'motion_transfer',
  IMAGE_REFINEMENT: 'image_refinement',

  // Project actions
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_SHARED: 'project_shared',

  // Media actions
  MEDIA_UPLOADED: 'media_uploaded',
  MEDIA_DELETED: 'media_deleted',

  // Authentication actions
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_UPDATED_PROFILE: 'user_updated_profile',
} as const;

// Helper function to log AI usage with cost estimation
export const logAIUsage = async (
  userId: string,
  action: keyof typeof USAGE_ACTIONS,
  tokensUsed?: number,
  projectId?: string,
  metadata?: any
): Promise<{ error: any }> => {
  // Simple cost estimation (you can adjust these rates)
  const TOKEN_COSTS = {
    [USAGE_ACTIONS.SCRIPT_ANALYSIS]: 0.000001, // $0.001 per 1K tokens
    [USAGE_ACTIONS.FRAME_GENERATION]: 0.000002,
    [USAGE_ACTIONS.IMAGE_GENERATION]: 0.000003,
    [USAGE_ACTIONS.VIDEO_GENERATION]: 0.00001,
    [USAGE_ACTIONS.IMAGE_UPSCALING]: 0.000001,
    [USAGE_ACTIONS.VIDEO_UPSCALING]: 0.000002,
    [USAGE_ACTIONS.MOTION_TRANSFER]: 0.000008,
    [USAGE_ACTIONS.IMAGE_REFINEMENT]: 0.000002,
  };

  const costUsd = tokensUsed ? (tokensUsed * (TOKEN_COSTS[action] || 0.000001)) : undefined;

  return usageService.logUsage(userId, action, {
    projectId,
    tokensUsed,
    costUsd,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  });
};

// Export the appropriate service based on configuration
export const getUsageService = (): UsageService => {
  return isSupabaseConfigured() ? usageService : null;
};