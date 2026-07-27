export interface Studio {
  id: string
  name: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "admin" | "accountant"
  studio: Studio
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
