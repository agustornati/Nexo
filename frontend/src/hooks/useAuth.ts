import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { authApi, type LoginPayload, type RegisterPayload } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"

export function useLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const tokens = await authApi.login(payload)
      const user = await authApi.me()
      return { tokens, user }
    },
    onSuccess: ({ tokens, user }) => {
      setAuth(user, tokens.access_token, tokens.refresh_token)
      queryClient.setQueryData(["me"], user)
      navigate("/")
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const tokens = await authApi.register(payload)
      const user = await authApi.me()
      return { tokens, user }
    },
    onSuccess: ({ tokens, user }) => {
      setAuth(user, tokens.access_token, tokens.refresh_token)
      navigate("/")
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const { refreshToken, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) await authApi.logout(refreshToken)
    },
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      navigate("/login")
    },
  })
}

export function useMe() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: isAuthenticated(),
    staleTime: Infinity,
  })
}
