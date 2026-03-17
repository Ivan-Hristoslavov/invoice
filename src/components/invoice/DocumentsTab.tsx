"use client";

import { useState } from "react";
import { Paperclip, File, Image, FileText, X, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getDocuments, uploadDocument, deleteDocument } from "@/lib/services/document-service";
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENTS_PER_INVOICE,
} from "@/config/constants";

type Document = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
};

type DocumentsTabProps = {
  invoiceId: string;
  documents: Document[];
};

export default function DocumentsTab({ invoiceId, documents: initialDocuments = [] }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);

  const allowedAccept = ALLOWED_ATTACHMENT_MIME_TYPES.join(",");
  const maxSizeMb = MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedSet = new Set(ALLOWED_ATTACHMENT_MIME_TYPES);
    const toUpload: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedSet.has(file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf")) {
        toast.error(`Невалиден тип: ${file.name}. Позволени: PDF, JPG, PNG, WebP, GIF.`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        toast.error(`${file.name} надвишава ${maxSizeMb}MB`);
        continue;
      }
      toUpload.push(file);
    }

    const remaining = MAX_ATTACHMENTS_PER_INVOICE - documents.length;
    if (toUpload.length > remaining) {
      toast.error(`Максимум ${MAX_ATTACHMENTS_PER_INVOICE} прикачени файла. Остават ${remaining} места.`);
      toUpload.splice(remaining);
    }
    if (toUpload.length === 0) {
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const created: Document[] = [];
      for (const file of toUpload) {
        const doc = await uploadDocument(invoiceId, file);
        created.push({
          id: doc.id,
          name: doc.name,
          size: doc.size,
          type: doc.type,
          url: doc.url,
          createdAt: doc.createdAt,
        });
      }
      setDocuments([...documents, ...created]);
      toast.success(
        created.length === 1
          ? "Файлът е прикачен"
          : `${created.length} файла са прикачени`
      );
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(
        error instanceof Error ? error.message : "Неуспешно качване. Опитайте отново."
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(invoiceId, documentId);
      setDocuments(documents.filter((doc) => doc.id !== documentId));
      toast.success("Прикаченият файл е премахнат");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Неуспешно премахване на файла.");
    }
  };

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    else return (bytes / 1073741824).toFixed(1) + " GB";
  }

  function getFileIcon(type: string) {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Прикачени документи</h3>
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={allowedAccept}
            onChange={handleFileUpload}
            multiple
            disabled={isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            className="relative"
            disabled={isUploading || documents.length >= MAX_ATTACHMENTS_PER_INVOICE}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            {isUploading ? "Качване..." : "Прикачи файлове"}
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Paperclip className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Няма прикачени файлове</p>
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG, WebP или GIF. Макс. {maxSizeMb}MB на файл, до {MAX_ATTACHMENTS_PER_INVOICE} файла.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-foreground">
                    {getFileIcon(doc.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => window.open(doc.url, "_blank")}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteDocument(doc.id)}
                    title="Delete"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 