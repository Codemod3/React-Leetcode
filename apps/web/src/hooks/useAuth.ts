import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@reactcode/shared";
import { api, ApiError } from "../lib/api";
import { useAuthStore } from "../stores/authStore";

export function useCurrentUser() {
  const { setUser, setStatus } = useAuthStore();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/auth/me"),
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess) {
      setUser(query.data);
      setStatus("authenticated");
    } else if (query.isError) {
      setUser(null);
      setStatus("anonymous");
    }
  }, [query.isSuccess, query.isError, query.data, setUser, setStatus]);

  return query;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.post<User>("/auth/login", input),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setStatus("authenticated");
      queryClient.setQueryData(["me"], user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; email: string; password: string }) =>
      api.post<User>("/auth/register", input),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setStatus("authenticated");
      queryClient.setQueryData(["me"], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setStatus("anonymous");
      queryClient.setQueryData(["me"], null);
    },
  });
}

export function authErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Something went wrong. Please try again.";
}
