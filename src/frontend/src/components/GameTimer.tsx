import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";

interface GameTimerProps {
  inline?: boolean;
}

export default function GameTimer({ inline = false }: GameTimerProps) {
  const { actor, isFetching } = useActor();
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: remainingSeconds } = useQuery<bigint>({
    queryKey: ["remainingSeconds"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getRemainingSeconds();
    },
    // Sync with backend every 5 seconds to correct drift
    refetchInterval: 5000,
    enabled: !!actor && !isFetching,
  });

  const { data: isRunning } = useQuery<boolean>({
    queryKey: ["timerRunning"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isTimerRunning();
    },
    refetchInterval: 5000,
    enabled: !!actor && !isFetching,
  });

  // Sync localSeconds when backend data arrives
  useEffect(() => {
    if (remainingSeconds !== undefined) {
      setLocalSeconds(Number(remainingSeconds));
    }
  }, [remainingSeconds]);

  // Local countdown interval - ticks every 1 second precisely
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setLocalSeconds((prev) => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  if (!isRunning || localSeconds === null) {
    return null;
  }

  const minutes = Math.floor(localSeconds / 60);
  const secs = localSeconds % 60;
  const isLowTime = localSeconds < 300; // Less than 5 minutes

  // Format with leading zeros for MM:SS
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = secs.toString().padStart(2, "0");

  if (inline) {
    return (
      <div className="flex items-center border-l-2 border-primary/40 pl-4 ml-2">
        <div
          className={`font-mono text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent drop-shadow-lg ${
            isLowTime ? "animate-pulse" : ""
          }`}
        >
          {formattedMinutes}:{formattedSeconds}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-5 right-8 z-40 px-6 py-4 bg-card/90 backdrop-blur-md border-2 border-primary/40 rounded-lg shadow-xl shadow-primary/20">
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
