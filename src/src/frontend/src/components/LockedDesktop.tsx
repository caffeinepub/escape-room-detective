import { FolderClosed, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import LockScreenModal from "./LockScreenModal";

interface LockedDesktopProps {
  onUnlock: () => void;
  showBootAnimation: boolean;
}

export default function LockedDesktop({ onUnlock, showBootAnimation }: LockedDesktopProps) {
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const handleDetectiveCaseClick = () => {
    setShowUnlockDialog(true);
  };

  const handleUnlockSuccess = () => {
    setShowUnlockDialog(false);
    onUnlock();
  };

  return (
    <div className="min-h-screen w-full bg-background relative">
      {/* Desktop Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/generated/detective-desktop-bg.dim_1920x1080.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/40 to-background/80" />
        {/* Noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }} 
        />
      </div>

      {/* Desktop Icons - Centered arrangement */}
      <div className="relative z-10 h-screen flex items-center justify-center">
        <div className="grid grid-cols-2 gap-16 p-8">
          {/* Recycle Bin - Decorative only */}
          <button
            className="group flex flex-col items-center gap-4 p-6 rounded-lg hover:bg-card/40 hover:backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-default"
            disabled
          >
            <div className="relative">
              <Trash2 className="w-20 h-20 text-muted-foreground/60 group-hover:text-muted-foreground/80 transition-colors duration-300" />
            </div>
            <p className="font-mono text-sm text-foreground/70 group-hover:text-foreground/80 transition-colors">
              Recycle Bin
            </p>
          </button>

          {/* Detective Case - Active application */}
          <button
            onClick={handleDetectiveCaseClick}
            className="group flex flex-col items-center gap-4 p-6 rounded-lg hover:bg-card/60 hover:backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary hover:shadow-xl hover:shadow-primary/20 animate-boot"
          >
            <div className="relative">
              <FolderClosed className="w-20 h-20 text-accent group-hover:text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] group-hover:scale-110" />
              <div className="absolute inset-0 bg-accent/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-mono text-sm text-foreground group-hover:text-primary transition-colors duration-200 font-semibold">
                Detective Case
              </p>
              <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/90 transition-colors">
                Confidential Files
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Unlock Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent 
          className="max-w-xl border-2 border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/20"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <LockScreenModal 
            onUnlock={handleUnlockSuccess} 
            showBootAnimation={showBootAnimation}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
