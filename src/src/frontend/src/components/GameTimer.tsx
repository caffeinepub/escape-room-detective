import { useQuery } from "@tanstack/react-query";
import { useActor } from "../hooks/useActor";

interface GameTimerProps {
  inline?: boolean;
}

export default function GameTimer({ inline = false }: GameTimerProps) {
  const { actor, isFetching } = useActor();

  const { data: remainingSeconds } = useQuery<bigint>({
    queryKey: ["remainingSeconds"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getRemainingSeconds();
    },
    refetchInterval: 1000,
    enabled: !!actor && !isFetching,
  });

  const { data: isRunning } = useQuery<boolean>({
    queryKey: ["timerRunning"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isTimerRunning();
    },
    refetchInterval: 1000,
    enabled: !!actor && !isFetching,
  });

  if (!isRunning || remainingSeconds === undefined) {
    return null;
  }

  const seconds = Number(remainingSeconds);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLowTime = seconds < 300; // Less than 5 minutes

  // Format with leading zeros for MM:SS
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = secs.toString().padStart(2, "0");

  if (inline) {
    // Inline display for header integration
    return (
      <div className="flex items-center gap-3 border-l-2 border-primary/40 pl-4 ml-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Timer:
          </span>
          <div
            className={`font-mono text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent drop-shadow-lg ${
              isLowTime ? "animate-pulse" : ""
            }`}
          >
            {formattedMinutes}:{formattedSeconds}
          </div>
        </div>
      </div>
    );
  }

  // Legacy fixed positioning (not used anymore)
  return (
    <div
      className="fixed top-5 right-8 z-40 px-6 py-4 bg-card/90 backdrop-blur-md border-2 border-primary/40 rounded-lg shadow-xl shadow-primary/20"
    >
      <div className="text-center space-y-1">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          Time Remaining
        </p>
        <div
          className={`font-mono text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent drop-shadow-lg ${
            isLowTime ? "animate-pulse" : ""
          }`}
        >
          {formattedMinutes}:{formattedSeconds}
        </div>
      </div>
    </div>
  );
}
