import { useState, RefObject } from "react";
import { 
  FolderOpen, 
  FileText, 
  Image as ImageIcon,
  Video,
  Settings,
  ChevronRight,
  Camera as CameraIcon,
  X,
  AlertCircle,
  Scale
} from "lucide-react";
import { useCamera } from "@/camera/useCamera";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetAttempts, useStorePhoto, useGetGamePhase } from "../hooks/useQueries";
import { toast } from "sonner";
import EvidenceGallery from "./EvidenceGallery";
import GameTimer from "./GameTimer";
import CaseSolutionModal from "./CaseSolutionModal";
import VictoryScreen from "./VictoryScreen";
import DefeatScreen from "./DefeatScreen";

interface DesktopItem {
  id: string;
  name: string;
  icon?: typeof FolderOpen;
  customIcon?: string;
  type: "folder" | "file";
  description?: string;
}

const desktopItems: DesktopItem[] = [
  { id: "1", name: "Active Cases", icon: FolderOpen, type: "folder", description: "Current investigations" },
  { id: "2", name: "Evidence", customIcon: "/assets/uploads/image-1.png", type: "folder", description: "Physical and digital evidence" },
  { id: "3", name: "Crime Scene Photos", icon: ImageIcon, type: "folder", description: "Photo archive" },
  { id: "4", name: "Witness Interviews", icon: Video, type: "folder", description: "Video recordings" },
  { id: "5", name: "Case_Report_Final.doc", icon: FileText, type: "file", description: "Detective notes" },
  { id: "6", name: "Suspect_List.txt", icon: FileText, type: "file", description: "Person of interest database" },
  { id: "7", name: "Rješenje Slučaja", icon: Scale, type: "folder", description: "Suspect identification" },
];

interface DesktopProps {
  audioRef: RefObject<HTMLAudioElement | null>;
}

export default function Desktop({ audioRef }: DesktopProps) {
  const [newCode, setNewCode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showCaseSolution, setShowCaseSolution] = useState(false);
  
  const attemptsQuery = useGetAttempts();
  const storePhotoMutation = useStorePhoto();
  const { data: gamePhase } = useGetGamePhase();
  
  const isGameComplete = gamePhase === "won" || gamePhase === "lost";
  
  const { 
    isActive, 
    isSupported, 
    error, 
    isLoading,
    startCamera, 
    stopCamera, 
    capturePhoto,
    videoRef, 
    canvasRef 
  } = useCamera({ 
    facingMode: 'environment' 
  });

  const handleUpdateCode = async () => {
    if (newCode.length !== 6 || !/^\d{6}$/.test(newCode)) {
      toast.error("Invalid code format", {
        description: "Code must be exactly 6 digits",
      });
      return;
    }

    toast.info("Update code not implemented", {
      description: "This feature requires backend support",
    });
    setNewCode("");
    setDialogOpen(false);
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString();
  };

  const handleDesktopItemClick = async (itemId: string) => {
    if (isGameComplete) return; // Disable all interactions when game is complete
    
    if (itemId === "2") { // Evidence
      setShowEvidence(true);
    } else if (itemId === "3") { // Crime Scene Photos
      setShowCamera(true);
      await startCamera();
    } else if (itemId === "7") { // Rješenje Slučaja
      setShowCaseSolution(true);
    }
  };

  const handleCloseCamera = async () => {
    await stopCamera();
    setShowCamera(false);
  };

  const handleCapture = async () => {
    const photoFile = await capturePhoto();
    if (photoFile) {
      try {
        // Convert File to base64 string
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
        });
        
        reader.readAsDataURL(photoFile);
        const base64Data = await base64Promise;
        
        const timestamp = BigInt(Date.now() * 1_000_000);
        const id = `evidence-${timestamp}`;
        
        await storePhotoMutation.mutateAsync({
          id,
          imageData: base64Data,
          timestamp,
        });
        
        toast.success("Evidence captured", {
          description: "Photo saved to Evidence folder",
        });
      } catch (error) {
        toast.error("Failed to save evidence", {
          description: "Please try again",
        });
        console.error("Error saving photo:", error);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-background animate-boot relative">
      {/* Game Completion Overlays */}
      {gamePhase === "won" && <VictoryScreen audioRef={audioRef} />}
      {gamePhase === "lost" && <DefeatScreen audioRef={audioRef} />}
      
      {/* Desktop Background with overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/generated/detective-desktop-bg.dim_1920x1080.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Subtle vignette overlay for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/40 to-background/80" />
        {/* Noise texture overlay for vintage feel */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }} 
        />
      </div>

      {/* Content wrapper with relative positioning */}
      <div className="relative z-10">
        {/* Case Solution Modal */}
        {showCaseSolution && (
          <CaseSolutionModal
            open={showCaseSolution}
            onClose={() => setShowCaseSolution(false)}
            onVictory={() => {
              setShowCaseSolution(false);
            }}
          />
        )}
        
        {/* Evidence Gallery Overlay */}
        {showEvidence && <EvidenceGallery onClose={() => setShowEvidence(false)} />}
        
        {/* Camera View Overlay */}
        {showCamera && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Camera Header */}
          <header className="border-b border-border bg-card/80 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <h1 className="font-display text-xl tracking-wider text-primary">
                  CRIME SCENE DOCUMENTATION
                </h1>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleCloseCamera}
              >
                <X className="w-4 h-4" />
                <span className="font-mono text-xs">CLOSE</span>
              </Button>
            </div>
          </header>

          {/* Camera Feed */}
          <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
            {isSupported === false ? (
              <Card className="max-w-md border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="font-display text-destructive flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Camera Not Supported
                  </CardTitle>
                  <CardDescription className="font-mono text-sm">
                    Your device does not support camera access through the browser.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : error ? (
              <Card className="max-w-md border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="font-display text-destructive flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Camera Error
                  </CardTitle>
                  <CardDescription className="font-mono text-sm">
                    {error.message}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error.type === 'permission' && (
                    <p className="text-sm text-muted-foreground">
                      Please grant camera permissions and try again.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="w-full max-w-4xl space-y-6">
                {/* Video Preview */}
                <div className="relative w-full aspect-video bg-card border-2 border-primary/30 rounded-lg overflow-hidden shadow-2xl">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                        <p className="font-mono text-sm text-muted-foreground">
                          Initializing camera...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Indicator */}
                  {isActive && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-destructive/90 backdrop-blur-sm rounded-full">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="font-mono text-xs text-white font-semibold">
                        RECORDING
                      </span>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={handleCapture}
                    disabled={!isActive || isLoading}
                    size="lg"
                    className="gap-2 font-display px-8"
                  >
                    <CameraIcon className="w-5 h-5" />
                    CAPTURE EVIDENCE
                  </Button>
                </div>

                {/* Instructions */}
                <Card className="border-accent/50 bg-accent/5">
                  <CardContent className="py-4">
                    <p className="text-sm text-center font-mono text-muted-foreground">
                      Position camera to document crime scene evidence. 
                      All captures are logged with timestamp and case number.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Desktop Header - Enhanced Noir Styling */}
      <header className="border-b-2 border-primary/30 bg-gradient-to-r from-card/95 via-card/98 to-card/95 backdrop-blur-md shadow-lg shadow-primary/10">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Detective Badge with glow effect */}
            <div className="relative group">
              <img 
                src="/assets/generated/detective-badge-transparent.dim_150x150.png" 
                alt="Detective Badge"
                className="w-14 h-14 object-contain transition-all duration-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] group-hover:drop-shadow-[0_0_16px_rgba(251,191,36,0.6)] group-hover:scale-110"
              />
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 -z-10" />
            </div>
            
            <div className="flex items-center gap-3 border-l-2 border-primary/40 pl-4">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-lg shadow-success/50" />
              <h1 className="font-display text-2xl tracking-wider text-primary drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]">
                DETECTIVE WORKSTATION
              </h1>
            </div>

            {/* Integrated Game Timer */}
            <GameTimer inline />
          </div>
          
          <div className="flex items-center gap-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-primary/40 bg-card/80 hover:bg-primary/20 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-mono text-xs font-semibold">MODERATOR</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Moderator Tools</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  Update system unlock code
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-code" className="font-mono text-sm">
                    New 6-Digit Code
                  </Label>
                  <Input
                    id="new-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={newCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setNewCode(value);
                    }}
                    placeholder="000000"
                    className="font-mono text-lg tracking-wider"
                  />
                </div>
                
                <Button 
                  onClick={handleUpdateCode}
                  disabled={newCode.length !== 6}
                  className="w-full font-display"
                >
                  UPDATE CODE
                </Button>

                <div className="border-t border-border pt-4">
                  <h3 className="font-mono text-sm font-semibold mb-3">Access Attempts</h3>
                  <ScrollArea className="h-[200px] w-full rounded border border-border p-3">
                    {attemptsQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : attemptsQuery.data && attemptsQuery.data.length > 0 ? (
                      <div className="space-y-2">
                        {attemptsQuery.data.map((attempt, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between text-xs font-mono p-2 rounded bg-card"
                          >
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={attempt.success ? "default" : "destructive"}
                                className="w-16 justify-center"
                              >
                                {attempt.success ? "SUCCESS" : "FAILED"}
                              </Badge>
                              <code className="text-primary">{attempt.codeEntered}</code>
                            </div>
                            <span className="text-muted-foreground">
                              {formatTimestamp(attempt.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No attempts recorded</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </header>

      {/* Desktop Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Success Message */}
        <Card className="mb-8 border-success/50 bg-success/5 backdrop-blur-sm shadow-lg shadow-success/10">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-success flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(74,222,128,0.3)]">
              <ChevronRight className="w-6 h-6 animate-pulse" />
              ACCESS GRANTED
            </CardTitle>
            <CardDescription className="font-mono text-foreground/80">
              Welcome back, Detective. All case files are now accessible.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Desktop Items Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {desktopItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleDesktopItemClick(item.id)}
              disabled={isGameComplete}
              className="group flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-card/60 hover:backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 hover:shadow-lg hover:shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="relative">
                {item.customIcon ? (
                  <div className="w-16 h-16 flex items-center justify-center">
                    <img 
                      src={item.customIcon} 
                      alt={item.name}
                      className="w-16 h-16 object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                    />
                    {item.type === "folder" && (
                      <div className="absolute inset-0 bg-accent/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </div>
                ) : item.icon ? (
                  <>
                    <item.icon 
                      className={`w-16 h-16 transition-all duration-300 ${
                        item.type === "folder" 
                          ? "text-accent group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" 
                          : "text-primary/70 group-hover:text-primary"
                      }`}
                    />
                    {item.type === "folder" && (
                      <div className="absolute inset-0 bg-accent/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </>
                ) : null}
              </div>
              <div className="text-center space-y-1">
                <p className="font-mono text-sm text-foreground group-hover:text-primary transition-colors duration-200">
                  {item.name}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/80 transition-colors">
                    {item.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            © 2026. Built with love using{" "}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline hover:text-primary/80 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            DETECTIVE BUREAU SYSTEM v2.1.5 • SECURE CONNECTION ESTABLISHED
          </p>
        </footer>
      </main>
      </div>
    </div>
  );
}
