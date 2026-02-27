import { useQuery } from "@tanstack/react-query";
import { type RefObject, useEffect } from "react";
import { useActor } from "../hooks/useActor";

interface VictoryScreenProps {
  audioRef: RefObject<HTMLAudioElement | null>;
}

export default function VictoryScreen({ audioRef }: VictoryScreenProps) {
  const { actor } = useActor();

  // Stop music when victory screen appears
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [audioRef]);

  const { data: remainingSeconds } = useQuery<bigint>({
    queryKey: ["remainingSeconds"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getRemainingSeconds();
    },
    enabled: !!actor,
  });

  const seconds = Number(remainingSeconds || 0n);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // Format with leading zeros for MM:SS
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = secs.toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-500">
      {/* Dramatic background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-background animate-pulse opacity-50" />

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Main Victory Text - Larger */}
        <h1 className="font-display text-7xl md:text-9xl lg:text-[12rem] font-bold text-primary drop-shadow-[0_0_40px_rgba(251,191,36,0.9)] animate-in slide-in-from-top duration-700 leading-tight">
          SLUČAJ RIJEŠEN!
        </h1>

        {/* Time Display */}
        <div className="inline-block px-12 py-6 bg-card/80 backdrop-blur-sm border-2 border-primary rounded-xl shadow-2xl shadow-primary/40 animate-in zoom-in duration-500 delay-300">
          <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Vrijeme
          </p>
          <p className="font-mono text-5xl font-bold text-primary drop-shadow-lg">
            {formattedMinutes}:{formattedSeconds}
          </p>
        </div>

        {/* Congratulations message */}
        <p className="font-mono text-xl text-foreground/80 animate-in fade-in duration-700 delay-500">
          Excellent detective work.
        </p>
      </div>
    </div>
  );
}
