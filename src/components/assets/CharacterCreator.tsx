import { Loader2, Upload, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { assetService } from '@/services/assetService'

interface CharacterCreatorProps {
  projectId: string
  onCharacterCreated: () => void
}

export function CharacterCreator({ projectId, onCharacterCreated }: CharacterCreatorProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!description) return

    setIsGenerating(true)
    try {
      // TODO: Replace with actual API call to Flux/PuLID
      // For MVP, we simulate a generation delay and return a placeholder
      await new Promise((resolve) => setTimeout(resolve, 3000))
      
      // Mock result
      setGeneratedImage('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80')
      toast.success('Character sheet generated!')
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error('Failed to generate character')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!name || !generatedImage) return

    try {
      await assetService.createAsset({
        name,
        description,
        type: 'character',
        project_id: projectId,
        image_url: generatedImage,
      })
      toast.success('Character saved successfully')
      onCharacterCreated()
      
      // Reset form
      setName('')
      setDescription('')
      setGeneratedImage(null)
      setReferenceImage(null)
    } catch (error) {
      console.error('Failed to save character:', error)
      toast.error('Failed to save character')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="char-name" className="text-white">Character Name</Label>
          <Input
            id="char-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Neo"
            className="bg-black/50 border-white/10 text-white focus:border-[var(--color-accent-primary)]"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="char-desc" className="text-white">Physical Description</Label>
          <Textarea
            id="char-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe age, ethnicity, hair, clothing, style..."
            className="bg-black/50 border-white/10 text-white focus:border-[var(--color-accent-primary)] min-h-[120px]"
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-white">Reference Photo (Optional - for PuLID)</Label>
          <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-[var(--color-accent-primary)]/50 transition-colors cursor-pointer bg-white/5">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="ref-upload"
              onChange={(e) => setReferenceImage(e.target.files?.[0] || null)}
            />
            <label htmlFor="ref-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-white/40" />
              <span className="text-sm text-white/60">
                {referenceImage ? referenceImage.name : 'Click to upload reference face'}
              </span>
            </label>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !description}
          className="w-full bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-black font-bold py-6 text-lg shadow-[var(--shadow-glow)]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Identity...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Character Sheet
            </>
          )}
        </Button>
      </div>

      {/* Preview Section */}
      <div className="space-y-4">
        <Label className="text-white">Generated Result</Label>
        <Card className="bg-black/40 border-white/10 aspect-square flex items-center justify-center overflow-hidden relative group">
          {generatedImage ? (
            <>
              {/* biome-ignore lint/a11y/useAltText: Generated image is decorative until saved */}
              <img
                src={generatedImage}
                alt="Generated Character"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button onClick={handleSave} disabled={!name} className="bg-white text-black hover:bg-white/90">
                  Save to Assets
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40">Enter details and generate to see preview</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
