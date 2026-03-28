"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { Label, Slider, Spinner } from "@heroui/react";
import { Upload, X, Check, Lock, Crown } from "lucide-react";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { MAX_LOGO_SIZE_BYTES, MAX_LOGO_DIMENSION_PX } from "@/config/constants";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  companyId: string;
  onLogoUploaded: (logoUrl: string) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function LogoUpload({ currentLogoUrl, companyId, onLogoUploaded }: LogoUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkLimit, isFree } = useSubscriptionLimit();

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check subscription limit
    const hasAccess = await checkLimit('customBranding');
    if (!hasAccess) {
      toast.error("Недостатъчен план", {
        description: "Качването на лого е достъпно само за Pro и Business планове. Моля, надстройте плана си."
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Невалиден файл", {
        description: "Моля, изберете изображение (JPG, PNG или SVG)"
      });
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error("Файлът е твърде голям", {
        description: `Максималният размер е ${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB`
      });
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsDialogOpen(true);
    };
    reader.onerror = () => {
      toast.error("Грешка при четене на файла");
    };
    reader.readAsDataURL(file);
  };

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Cap dimensions for smaller file size (PDF/email)
    let w = pixelCrop.width;
    let h = pixelCrop.height;
    if (w > MAX_LOGO_DIMENSION_PX || h > MAX_LOGO_DIMENSION_PX) {
      const scale = Math.min(MAX_LOGO_DIMENSION_PX / w, MAX_LOGO_DIMENSION_PX / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      w,
      h
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.85
      );
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Моля, изберете и обработете изображението");
      return;
    }

    setIsUploading(true);

    try {
      // Get cropped image as blob
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Create FormData
      const formData = new FormData();
      formData.append('logo', croppedBlob, 'logo.jpg');
      formData.append('companyId', companyId);

      // Upload to API
      const response = await fetch('/api/companies/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Грешка при качване на лого');
      }

      const data = await response.json();
      
      toast.success("Логото е качено успешно");
      onLogoUploaded(data.logoUrl);
      setIsDialogOpen(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error("Грешка", {
        description: error.message || "Възникна грешка при качване на лого. Моля, опитайте отново."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeleteLogo = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/logo`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Грешка при изтриване на лого");
      }

      toast.success("Логото е изтрито");
      onLogoUploaded("");
      setDeleteDialogOpen(false);
    } catch (error: unknown) {
      console.error("Error deleting logo:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при изтриване на лого. Моля, опитайте отново.",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Pro feature notice */}
      {isFree && (
        <Alert variant="warning">
          <Crown className="h-4 w-4 shrink-0" />
          <AlertTitle className="text-sm">PRO функция</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              Качването на собствено лого е налично само в PRO и BUSINESS плановете.
            </span>
            <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
              <Link href="/settings/subscription">Надградете</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-6">
        <div className="relative h-24 w-24 rounded overflow-hidden border bg-muted">
          {currentLogoUrl ? (
            <img
              src={currentLogoUrl}
              alt="Company logo"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold uppercase text-muted-foreground">
              Л
            </div>
          )}
          {/* Lock overlay for free plan */}
          {isFree && !currentLogoUrl && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
              disabled={isFree}
            >
              {isFree ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {currentLogoUrl ? "Промени лого" : "Качи лого"}
              {isFree && (
                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 border-amber-500/30 text-amber-600">
                  PRO
                </Badge>
              )}
            </Button>
            {currentLogoUrl && !isFree && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
                Изтрий
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG или SVG. Макс. {MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB. Препоръчително до {MAX_LOGO_DIMENSION_PX}×{MAX_LOGO_DIMENSION_PX}px (за PDF и имейл).
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на лого</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да премахнете логото на компанията? Можете да качите ново по всяко време.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDeleteLogo()}
            >
              Изтрий логото
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактиране на лого</DialogTitle>
            <DialogDescription>
              Използвайте мишката, за да преместите и мащабирате изображението. След това натиснете "Запази".
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[400px] w-full bg-black rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={false}
              />
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Мащаб</Label>
              <Slider
                value={zoom}
                onChange={(v) => setZoom(typeof v === "number" ? v : (v[0] ?? 1))}
                minValue={1}
                maxValue={3}
                step={0.1}
                className="w-full max-w-full"
              >
                <Slider.Track>
                  <Slider.Fill />
                </Slider.Track>
                <Slider.Thumb />
              </Slider>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setImageSrc(null);
                }}
                disabled={isUploading}
              >
                Отказ
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" color="current" className="text-primary-foreground" />
                    Качване...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Запази
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
