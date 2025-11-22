import { supabase } from '@/lib/supabase'
import { type Json } from '@/types/supabase'

export interface Scene {
  id: string
  number: number
  heading: string
  description: string
  characters: string[]
  shots: Shot[]
}

export interface Shot {
  id: string
  size: 'WIDE' | 'MEDIUM' | 'CLOSE-UP' | 'EXTREME CLOSE-UP'
  angle: 'EYE-LEVEL' | 'LOW' | 'HIGH'
  description: string
}

export const scriptAnalysisService = {
  async analyzeScript(scriptContent: string): Promise<Scene[]> {
    // Mock AI Analysis
    // In a real app, this would call an Edge Function with the script content
    console.log(`Analyzing script: ${scriptContent.substring(0, 50)}...`)
    
    await new Promise((resolve) => setTimeout(resolve, 2500)) // Simulate delay

    // Mock Response
    return [
      {
        id: '1',
        number: 1,
        heading: 'INT. CYBERPUNK APARTMENT - NIGHT',
        description: 'A neon-lit room cluttered with tech parts. Rain streaks the window.',
        characters: ['NEO'],
        shots: [
          { id: 's1', size: 'WIDE', angle: 'HIGH', description: 'Establish the messy apartment.' },
          { id: 's2', size: 'CLOSE-UP', angle: 'EYE-LEVEL', description: 'Neo sleeping at his computer.' },
        ],
      },
      {
        id: '2',
        number: 2,
        heading: 'EXT. CITY STREETS - NIGHT',
        description: 'Dark, wet streets. Steam rises from vents. Holographic ads flicker.',
        characters: ['TRINITY', 'AGENT SMITH'],
        shots: [
          { id: 's3', size: 'WIDE', angle: 'LOW', description: 'Trinity running across rooftops.' },
          { id: 's4', size: 'MEDIUM', angle: 'EYE-LEVEL', description: 'Agents pursuing in a black sedan.' },
        ],
      },
    ]
  },

  async saveAnalysis(projectId: string, scenes: Scene[]) {
    const { error } = await supabase
      .from('projects')
      .update({ script_analysis: scenes as unknown as Json })
      .eq('id', projectId)

    if (error) throw error
  },
}
