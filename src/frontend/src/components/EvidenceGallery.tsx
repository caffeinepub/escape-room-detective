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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, X, ZoomIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Photo } from "../backend";
import { useDeletePhoto, useGetAllPhotos } from "../hooks/useQueries";

interface EvidenceGalleryProps {
  onClose: () => void;
}

export default function EvidenceGallery({ onClose }: EvidenceGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const photosQuery = useGetAllPhotos();
  const deletePhotoMutation = useDeletePhoto();

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      await deletePhotoMutation.mutateAsync(photoToDelete);
      toast.success("Evidence deleted", {
        description: "Photo removed from archive",
      });
      setPhotoToDelete(null);
      setSelectedPhoto(null);
    } catch (error) {
      toast.error("Failed to delete photo", {
        description: "Please try again",
      });
      console.error("Error deleting photo:", error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Gallery Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
              <h1 className="font-display text-xl tracking-wider text-primary">
                EVIDENCE ARCHIVE
              </h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
              <span className="font-mono text-xs">CLOSE</span>
            </Button>
          </div>
        </header>

        {/* Gallery Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto max-w-7xl">
            {photosQuery.isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                  <p className="font-mono text-sm text-muted-foreground">
                    Loading evidence archive...
                  </p>
                </div>
              </div>
            ) : photosQuery.data && photosQuery.data.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photosQuery.data.map((photo) => (
                  <Card
                    key={photo.id}
                    className="group relative overflow-hidden border-accent/30 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
                  >
                    <CardContent className="p-0">
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-card">
                        <img
                          src={photo.imageData}
                          alt={`Evidence ${photo.id}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <ZoomIn className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setPhotoToDelete(photo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Photo Info */}
                      <div className="p-3 bg-card/50 border-t border-border">
                        <p className="font-mono text-xs text-muted-foreground truncate">
                          ID: {photo.id.slice(0, 12)}...
                        </p>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          {formatTimestamp(photo.timestamp)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md border-accent/50 bg-accent/5">
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="font-display text-lg mb-2">
                      No Evidence Captured Yet
                    </h3>
                    <p className="font-mono text-sm text-muted-foreground">
                      Use Crime Scene Photos to document evidence
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Full-Screen Photo Preview Dialog */}
      <Dialog
        open={!!selectedPhoto}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-5xl w-full p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-display text-xl">
              Evidence Details
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Case Reference: {selectedPhoto?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className="p-6 space-y-4">
              {/* Full Image */}
              <div className="w-full rounded-lg overflow-hidden border border-border bg-card">
                <img
                  src={selectedPhoto.imageData}
                  alt={`Evidence ${selectedPhoto.id}`}
                  className="w-full h-auto"
                />
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    Captured: {formatTimestamp(selectedPhoto.timestamp)}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    Evidence ID: {selectedPhoto.id}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    setPhotoToDelete(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Evidence
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!photoToDelete}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Evidence?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-sm">
              This action cannot be undone. The photo will be permanently
              removed from the evidence archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhoto}
              disabled={deletePhotoMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono"
            >
              {deletePhotoMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
