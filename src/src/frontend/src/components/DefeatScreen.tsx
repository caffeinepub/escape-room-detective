import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "../hooks/useActor";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { RefObject, useEffect } from "react";

interface DefeatScreenProps {
  audioRef: RefObject<HTMLAudioElement | null>;
}

export default function DefeatScreen({ audioRef }: DefeatScreenProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  // Stop music when defeat screen appears
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [audioRef]);

  const resetGameMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.startNewGame();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Game reset", {
        description: "Starting a new investigation...",
      });
      // Reload page to reset all state
      setTimeout(() => window.location.reload(), 1000);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-500">
      {/* Dramatic background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-destructive/10 to-background animate-pulse opacity-50" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Main Defeat Text - Larger */}
        <h1 className="font-display text-7xl md:text-9xl lg:text-[12rem] font-bold text-destructive drop-shadow-[0_0_40px_rgba(239,68,68,0.9)] animate-in slide-in-from-top duration-700 leading-tight">
          SLUČAJ IZGUBLJEN!
        </h1>

        {/* Subtitle */}
        <p className="font-mono text-2xl md:text-3xl text-foreground/80 animate-in fade-in duration-700 delay-300">
          CASE FAILED
        </p>

        {/* Time Display */}
        <div className="inline-block px-12 py-6 bg-card/80 backdrop-blur-sm border-2 border-destructive rounded-xl shadow-2xl shadow-destructive/40 animate-in zoom-in duration-500 delay-500">
          <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Elapsed Time
          </p>
          <p className="font-mono text-5xl font-bold text-destructive drop-shadow-lg">
            40:00
          </p>
        </div>

        {/* Additional Message */}
        <p className="font-mono text-lg text-foreground/70 animate-in fade-in duration-700 delay-700">
          The case remains unsolved. Better luck next time, Detective.
        </p>

        {/* Reset Button - Smaller and less prominent */}
        <div className="pt-8 animate-in fade-in duration-700 delay-1000">
          <Button
            onClick={() => resetGameMutation.mutate()}
            disabled={resetGameMutation.isPending}
            variant="outline"
            size="sm"
            className="gap-2 border-destructive/40 hover:bg-destructive/20 hover:border-destructive"
          >
            <RotateCcw className="w-4 h-4" />
            {resetGameMutation.isPending
              ? "RESETTING..."
              : "RESET GAME (MODERATOR)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
