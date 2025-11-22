import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

export type Asset = Database['public']['Tables']['assets']['Row']
export type NewAsset = Database['public']['Tables']['assets']['Insert']

export const assetService = {
  async getAssets(projectId: string) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async createAsset(asset: Omit<NewAsset, 'user_id'>) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('assets')
      .insert({ ...asset, user_id: userData.user.id })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteAsset(id: string) {
    const { error } = await supabase.from('assets').delete().eq('id', id)

    if (error) throw error
  },
}
