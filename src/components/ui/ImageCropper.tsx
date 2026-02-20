import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import getCroppedImg from '@/lib/canvasUtils'
import { Loader2 } from 'lucide-react'

interface ImageCropperProps {
    imageSrc: string | null
    open: boolean
    onClose: () => void
    onCropComplete: (croppedBlob: Blob) => void
    aspectRatio?: number
}

export function ImageCropper({ imageSrc, open, onClose, onCropComplete, aspectRatio = 1 }: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return

        try {
            setLoading(true)
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (croppedImage) {
                onCropComplete(croppedImage)
                onClose()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                </DialogHeader>
                <div className="relative h-64 w-full bg-slate-900 rounded-md overflow-hidden">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteCallback}
                            onZoomChange={onZoomChange}
                        />
                    )}
                </div>
                <div className="py-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Zoom</span>
                        <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(vals) => setZoom(vals[0])}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Crop
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
