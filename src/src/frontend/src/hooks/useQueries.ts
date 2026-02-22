import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { AttemptRecord, Photo } from "../backend";

export function useCheckUnlockCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codeEntered: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.checkUnlockCode(codeEntered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attempts"] });
    },
  });
}

export function useGetAttempts() {
  const { actor, isFetching } = useActor();

  return useQuery<AttemptRecord[]>({
    queryKey: ["attempts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttempts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStorePhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, imageData, timestamp }: { id: string; imageData: string; timestamp: bigint }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.storePhoto(id, imageData, timestamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}

export function useGetAllPhotos() {
  const { actor, isFetching } = useActor();

  return useQuery<Photo[]>({
    queryKey: ["photos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPhotos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeletePhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.deletePhoto(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}

// Timer and Game State Hooks

export function useGetRemainingSeconds() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["remainingSeconds"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getRemainingSeconds();
    },
    refetchInterval: 1000, // Poll every second
    enabled: !!actor && !isFetching,
  });
}

export function useGetGamePhase() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ["gamePhase"],
    queryFn: async () => {
      if (!actor) return "ongoing";
      return actor.getGamePhase();
    },
    refetchInterval: 1000,
    enabled: !!actor && !isFetching,
  });
}

export function useIsTimerRunning() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["timerRunning"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isTimerRunning();
    },
    refetchInterval: 1000,
    enabled: !!actor && !isFetching,
  });
}

export function useGetSuspects() {
  const { actor } = useActor();

  return useQuery<string[]>({
    queryKey: ["suspects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSuspectList();
    },
    enabled: !!actor,
  });
}

export function useCheckSuspect() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.checkSuspectGuess(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gamePhase"] });
    },
  });
}

export function useAddPenalty() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seconds: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.addPenalty(seconds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remainingSeconds"] });
    },
  });
}

export function useToggleTimer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.toggleTimer();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timerRunning"] });
      queryClient.invalidateQueries({ queryKey: ["remainingSeconds"] });
    },
  });
}

export function useStartNewGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.startNewGame();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
