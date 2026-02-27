import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface CaseSolutionModalProps {
  open: boolean;
  onClose: () => void;
  onVictory: () => void;
}

export default function CaseSolutionModal({
  open,
  onClose,
  onVictory,
}: CaseSolutionModalProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState<Set<string>>(new Set());
  const [shuffledSuspects, setShuffledSuspects] = useState<string[]>([]);
  const prevOpenRef = useRef(false);

  const { data: suspects = [] } = useQuery<string[]>({
    queryKey: ["suspects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSuspectList();
    },
    enabled: !!actor && open,
  });

  // Shuffle names every time the modal opens or when suspects data arrives while open
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    const dataArrivedWhileOpen =
      open && suspects.length > 0 && shuffledSuspects.length === 0;

    if ((justOpened || dataArrivedWhileOpen) && suspects.length > 0) {
      setShuffledSuspects(shuffleArray(suspects));
      setWrongAttempts(new Set());
    }

    if (!open && prevOpenRef.current) {
      // Reset shuffled list when modal closes so it reshuffles on next open
      setShuffledSuspects([]);
    }

    prevOpenRef.current = open;
  }, [open, suspects, shuffledSuspects.length]);

  const checkSuspectMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.checkSuspectGuess(name);
    },
    onSuccess: (isCorrect, name) => {
      if (isCorrect) {
        toast.success("CASE SOLVED!", {
          description: `${name} is the culprit! Congratulations!`,
        });
        queryClient.invalidateQueries({ queryKey: ["gamePhase"] });
        onVictory();
      } else {
        // Add to wrong attempts
        setWrongAttempts((prev) => new Set(prev).add(name));

        toast.error("-5 MINUTES PENALTY!", {
          description: `${name} is not the culprit. Keep investigating.`,
        });
        // Penalty is already applied by backend in checkSuspectGuess
        // Just refresh the timer display
        queryClient.invalidateQueries({ queryKey: ["remainingSeconds"] });

        // Check if time dropped to 0 or below after penalty
        if (actor) {
          actor.getRemainingSeconds().then((newRemainingSeconds) => {
            if (Number(newRemainingSeconds) <= 0) {
              queryClient.invalidateQueries({ queryKey: ["gamePhase"] });
            }
          });
        }
      }
      setSelectedName(null);
    },
  });

  const handleSuspectClick = (name: string) => {
    setSelectedName(name);
    checkSuspectMutation.mutate(name);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-md border-primary/40">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-primary flex items-center gap-3 justify-center">
            <Scale className="w-8 h-8" />
            WHO IS THE CULPRIT?
          </DialogTitle>
          <DialogDescription className="font-mono text-center text-muted-foreground">
            Select the suspect you believe committed the crime. Wrong choices
            will cost you 5 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 py-6">
          {(shuffledSuspects.length > 0 ? shuffledSuspects : suspects).map(
            (name) => {
              const isWrongAttempt = wrongAttempts.has(name);
              const isCurrentlyChecking =
                checkSuspectMutation.isPending && selectedName === name;

              return (
                <Button
                  key={name}
                  onClick={() => handleSuspectClick(name)}
                  disabled={isWrongAttempt || isCurrentlyChecking}
                  variant="outline"
                  className={`h-auto py-4 font-mono text-sm transition-all duration-200 ${
                    isWrongAttempt
                      ? "bg-red-500 border-red-500 text-white cursor-not-allowed hover:bg-red-500 hover:border-red-500"
                      : "border-primary/40 bg-card/80 hover:bg-primary/20 hover:border-primary hover:shadow-lg hover:shadow-primary/30 hover:scale-105 disabled:opacity-50"
                  }`}
                >
                  {isCurrentlyChecking ? "CHECKING..." : name}
                </Button>
              );
            },
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
