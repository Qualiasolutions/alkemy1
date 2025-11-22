import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { assetService } from '@/services/assetService'

interface CreateAssetDialogProps {
  trigger?: React.ReactNode
  onAssetCreated?: () => void
  defaultType?: 'character' | 'location'
}

export function CreateAssetDialog({
  trigger,
  onAssetCreated,
  defaultType = 'character',
}: CreateAssetDialogProps) {
  const { id: projectId } = useParams<{ id: string }>()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'character' | 'location'>(defaultType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !projectId) return

    setIsLoading(true)
    try {
      await assetService.createAsset({
        name,
        description,
        type,
        project_id: projectId,
        image_url: null,
      })
      toast.success('Asset created successfully')
      setOpen(false)
      setName('')
      setDescription('')
      if (onAssetCreated) {
        onAssetCreated()
      }
    } catch (error) {
      console.error('Failed to create asset:', error)
      toast.error('Failed to create asset')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
            <Plus className="w-4 h-4" />
            New Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
          <DialogDescription className="text-white/60">
            Define a character or location for your project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type" className="text-white">
                Type
              </Label>
              <Select value={type} onValueChange={(v: 'character' | 'location') => setType(v)}>
                <SelectTrigger className="bg-black/50 border-white/10 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="character">Character</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Neo, The Matrix"
                className="bg-black/50 border-white/10 text-white focus:border-[var(--color-accent-primary)]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Physical appearance, key traits, or atmosphere..."
                className="bg-black/50 border-white/10 text-white focus:border-[var(--color-accent-primary)] min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-black font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Asset'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
