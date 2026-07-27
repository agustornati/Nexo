import apiClient from "./client"
import type { TokenResponse, User } from "@/types"

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  studio_name: string
  studio_cuit: string
  studio_email: string
  user_email: string
  user_password: string
  user_first_name: string
  user_last_name: string
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const { data } = await apiClient.post<TokenResponse>("/auth/login", payload)
    return data
  },

  register: async (payload: RegisterPayload): Promise<TokenResponse> => {
    const { data } = await apiClient.post<TokenResponse>("/auth/register", payload)
    return data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post("/auth/logout", { refresh_token: refreshToken })
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ data: User }>("/auth/me")
    return data.data
  },
}
