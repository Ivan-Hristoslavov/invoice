"use client";

import { useState } from "react";
import { Paperclip, File, Image, FileText, X, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // In a real implementation, you would upload files to a storage service
      // and then save the references in your database
      
      // Mock implementation for demo purposes
      const newDocuments = Array.from(files).map((file, index) => ({
        id: `doc-${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // This would be a cloud storage URL in production
        createdAt: new Date().toISOString(),
      }));

      setDocuments([...documents, ...newDocuments]);
      toast.success(`${files.length} document(s) uploaded successfully`);
      
      // In a real implementation, you would make an API call here to save
      // the document references to the invoice record

    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset the file input
      e.target.value = "";
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // In a real implementation, you would make an API call to delete the document
      
      // Mock implementation for demo purposes
      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast.success("Document removed successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document. Please try again.");
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
        <h3 className="text-sm font-medium">Attached Documents</h3>
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            multiple
            disabled={isUploading}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="relative"
            disabled={isUploading}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Attach Files"}
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Paperclip className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">No documents attached</p>
          <p className="text-xs text-muted-foreground">
            Attach receipts, contracts, or other documents related to this invoice
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