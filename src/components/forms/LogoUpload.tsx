"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { Upload, X, Check, Lock, Crown, Loader2, Info, FileText, Mail } from "lucide-react";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { MAX_LOGO_SIZE_BYTES, MAX_LOGO_DIMENSION_PX } from "@/config/constants";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  companyId: string;
  /** Whether PDFs should embed the logo (User.invoicePreferences.showCompanyLogo) */
  showCompanyLogoInPdf: boolean;
  onLogoUploaded: (logoUrl: string) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function LogoUpload({
  currentLogoUrl,
  companyId,
  showCompanyLogoInPdf,
  onLogoUploaded,
}: LogoUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkLimit, isFree } = useSubscriptionLimit();

  useEffect(() => {
    setPreviewBroken(false);
  }, [currentLogoUrl]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const postLogoFormData = async (file: File | Blob, filename: string) => {
    const formData = new FormData();
    formData.append("logo", file, filename);
    formData.append("companyId", companyId);

    const response = await fetch("/api/companies/upload-logo", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(errBody.error || "Грешка при качване на лого");
    }

    return (await response.json()) as { logoUrl: string };
  };

  const uploadLogoFileDirect = async (file: File) => {
    if (!companyId?.trim()) {
      toast.error("Липсва компания", {
        description: "Уверете се, че сте запазили компанията, преди да качите лого.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const data = await postLogoFormData(file, file.name || "logo");
      toast.success("Логото е качено успешно");
      onLogoUploaded(data.logoUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: unknown) {
      console.error("Error uploading logo:", error);
      toast.error("Грешка", {
        description:
          error instanceof Error
            ? error.message
            : "Възникна грешка при качване на лого. Моля, опитайте отново.",
      });
    } finally {
      setIsUploading(false);
    }
  };

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

    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

    // SVG: качване без изрязване — canvas често не работи надеждно с векторни файлове
    if (isSvg) {
      await uploadLogoFileDirect(file);
      return;
    }

    // Raster: отваряне на диалога за изрязване
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
    if (!companyId?.trim()) {
      toast.error("Липсва компания", {
        description: "Уверете се, че сте запазили компанията, преди да качите лого.",
      });
      return;
    }

    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Моля, изберете и обработете изображението");
      return;
    }

    setIsUploading(true);

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const data = await postLogoFormData(croppedBlob, "logo.jpg");

      toast.success("Логото е качено успешно");
      onLogoUploaded(data.logoUrl);
      setIsDialogOpen(false);
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      console.error('Error uploading logo:', error);
      toast.error("Грешка", {
        description: error instanceof Error ? error.message : "Възникна грешка при качване на лого. Моля, опитайте отново."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const runDeleteLogo = async () => {
    setIsDeletingLogo(true);
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: unknown) {
      console.error("Error deleting logo:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при изтриване на лого. Моля, опитайте отново.",
      });
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const showPreview = Boolean(currentLogoUrl) && !previewBroken;

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

      {!showCompanyLogoInPdf && !isFree && (
        <Alert variant="default" className="border-primary/35 bg-primary/5">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <AlertTitle className="text-sm">Логото е скрито в PDF файловете</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            В &quot;Настройки → Фактури&quot; е изключено показването на логото в PDF. Можете да го включите по всяко време.
            <Link
              href="/settings/invoice-preferences"
              className="ml-1 font-medium text-primary underline underline-offset-2 hover:no-underline"
            >
              Отвори настройките за фактури
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 sm:p-5 dark:bg-muted/10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-inner sm:mx-0">
            {showPreview ? (
              <img
                src={currentLogoUrl!}
                alt="Лого на компанията"
                className="h-full w-full object-contain p-1"
                onError={() => setPreviewBroken(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted/40 px-2 text-center text-xs text-muted-foreground">
                {previewBroken ? (
                  <>
                    <span className="font-medium text-foreground">Неуспешно зареждане</span>
                    <span>Проверете дали файлът е публично достъпен или качете отново.</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-semibold uppercase text-muted-foreground">Л</span>
                    <span>Няма лого</span>
                  </>
                )}
              </div>
            )}
            {isFree && !currentLogoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
                disabled={isFree || isUploading}
              >
                {isFree ? (
                  <Lock className="h-4 w-4 shrink-0" />
                ) : (
                  <Upload className="h-4 w-4 shrink-0" />
                )}
                {currentLogoUrl ? "Смени лого" : "Качи лого"}
                {isFree && (
                  <Badge
                    variant="outline"
                    className="ml-1 border-amber-500/30 px-1 py-0 text-[10px] text-amber-600"
                  >
                    PRO
                  </Badge>
                )}
              </Button>
              {currentLogoUrl && !isFree && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isUploading}
                  className="flex w-full items-center justify-center gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 sm:w-auto dark:hover:bg-destructive/20"
                >
                  <X className="h-4 w-4 shrink-0" />
                  Премахни лого
                </Button>
              )}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">Формати:</strong> JPG, PNG или SVG (за екран).
              За най-надежден печат в PDF използвайте PNG или JPEG — SVG не се вгражда в PDF.
              Макс. {MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB. Препоръчително до {MAX_LOGO_DIMENSION_PX}×
              {MAX_LOGO_DIMENSION_PX}px.
            </p>

            <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 dark:bg-background/40">
              <p className="mb-1.5 text-xs font-medium text-foreground">Къде се използва</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span>
                    PDF: фактури, кредитни и дебитни известия — само ако е включено в настройките за фактури.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <span>Имейли при изпращане на фактури (ако клиентът зареди изображенията).</span>
                </li>
              </ul>
            </div>
          </div>
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
            <AlertDialogTitle>Премахване на лого</AlertDialogTitle>
            <AlertDialogDescription>
              Логото ще изчезне от прегледа и от новите PDF/имейли. Можете да качите ново по всяко време.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isDeletingLogo}>Отказ</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingLogo}
              className="flex w-full items-center justify-center gap-2 sm:w-auto"
              onClick={() => void runDeleteLogo()}
            >
              {isDeletingLogo ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Изтриване...
                </>
              ) : (
                "Премахни логото"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setImageSrc(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-4 overflow-y-auto overflow-x-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактиране на лого</DialogTitle>
            <DialogDescription>
              Преместете и мащабирайте изображението, след което натиснете &quot;Запази&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="relative isolate h-[min(400px,50vh)] w-full min-h-[240px] overflow-hidden rounded-lg bg-black">
            {imageSrc ? (
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
            ) : null}
          </div>
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo-crop-zoom" className="text-sm font-medium">
                Мащаб
              </Label>
              <input
                id="logo-crop-zoom"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUploading}
              >
                Отказ
              </Button>
              <Button
                type="button"
                onClick={() => void handleUpload()}
                disabled={isUploading}
                className="flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                    Качване...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
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
