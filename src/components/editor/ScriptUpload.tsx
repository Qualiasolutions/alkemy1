import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

// We need to import pdfjs-dist dynamically or use the global window object if loaded via CDN
// For this MVP, we'll assume the CDN link in index.html makes `pdfjsLib` available globally
// or we can try to use a simpler text extraction for now.
// Let's try to use the global variable since we added the script tag in index.html

declare global {
  interface Window {
    pdfjsLib: any
  }
}

interface ScriptUploadProps {
  onUpload: (content: string) => void
}

export function ScriptUpload({ onUpload }: ScriptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      let text = ''
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file)
      } else if (file.type === 'text/plain') {
        text = await file.text()
      } else {
        toast.error('Unsupported file type. Please upload PDF or TXT.')
        setIsUploading(false)
        return
      }

      onUpload(text)
      toast.success('Script uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to read file.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const extractTextFromPdf = async (file: File): Promise<string> => {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded')
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += `${pageText}\n\n`
    }

    return fullText
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.pdf"
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="border-white/10 hover:bg-white/5 text-white"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? 'Uploading...' : 'Upload Script'}
      </Button>
    </>
  )
}
