import { Loader2, MapPin, Plus, Trash2, User } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Asset, assetService } from '@/services/assetService'
import { CreateAssetDialog } from './CreateAssetDialog'

export function AssetList() {
  const { id: projectId } = useParams<{ id: string }>()
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadAssets = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const data = await assetService.getAssets(projectId)
      setAssets(data)
    } catch (error) {
      console.error('Failed to load assets:', error)
      toast.error('Failed to load assets')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    try {
      await assetService.deleteAsset(id)
      setAssets(assets.filter((a) => a.id !== id))
      toast.success('Asset deleted')
    } catch (error) {
      console.error('Failed to delete asset:', error)
      toast.error('Failed to delete asset')
    }
  }

  const renderAssetGrid = (type: 'character' | 'location') => {
    const filteredAssets = assets.filter((a) => a.type === type)

    if (filteredAssets.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
          <p className="text-white/40 mb-4">No {type}s found.</p>
          <CreateAssetDialog
            onAssetCreated={loadAssets}
            defaultType={type}
            trigger={
              <Button
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-950"
              >
                Create First {type === 'character' ? 'Character' : 'Location'}
              </Button>
            }
          />
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => (
          <Card
            key={asset.id}
            className="bg-black/40 border-white/10 overflow-hidden group hover:border-cyan-500/50 transition-colors"
          >
            <div className="aspect-square bg-gray-900 relative">
              {asset.image_url ? (
                <img
                  src={asset.image_url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  {asset.type === 'character' ? (
                    <User className="w-16 h-16" />
                  ) : (
                    <MapPin className="w-16 h-16" />
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="destructive" size="icon" onClick={() => handleDelete(asset.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                {asset.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/60 line-clamp-3">
                {asset.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <CreateAssetDialog
          onAssetCreated={loadAssets}
          defaultType={type}
          trigger={
            <div className="border border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-cyan-500/50 transition-all min-h-[300px]">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-white font-medium">
                Add New {type === 'character' ? 'Character' : 'Location'}
              </p>
            </div>
          }
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="character" className="w-full">
      <div className="flex items-center justify-between mb-8">
        <TabsList className="bg-black/40 border border-white/10">
          <TabsTrigger
            value="character"
            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
          >
            Characters
          </TabsTrigger>
          <TabsTrigger
            value="location"
            className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
          >
            Locations
          </TabsTrigger>
        </TabsList>
        <CreateAssetDialog onAssetCreated={loadAssets} />
      </div>

      <TabsContent value="character" className="mt-0">
        {renderAssetGrid('character')}
      </TabsContent>

      <TabsContent value="location" className="mt-0">
        {renderAssetGrid('location')}
      </TabsContent>
    </Tabs>
  )
}
