import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AssetList } from '@/components/assets/AssetList'
import { CharacterCreator } from '@/components/assets/CharacterCreator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function AssetsPhase() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('list')

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Assets Phase</h2>
          <p className="text-white/60">Manage your characters and locations.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-black/40 border border-white/10">
          <TabsTrigger value="list" className="data-[state=active]:bg-[var(--color-accent-primary)] data-[state=active]:text-black">
            Asset Library
          </TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-[var(--color-accent-primary)] data-[state=active]:text-black">
            Character Creator (Flux/PuLID)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <AssetList />
        </TabsContent>

        <TabsContent value="create">
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            {id ? (
              <CharacterCreator 
                projectId={id} 
                onCharacterCreated={() => setActiveTab('list')} 
              />
            ) : (
              <div className="text-white/60">Project ID not found.</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
