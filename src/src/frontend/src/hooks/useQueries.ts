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

export function useUpdateUnlockCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (newCode: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateUnlockCode(newCode);
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
