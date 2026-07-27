import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "@/hooks/useAuth"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const login = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  const errorMessage = login.error
    ? (login.error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Error al iniciar sesión"
    : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-600 tracking-tight">Nexo</h1>
          <p className="mt-2 text-sm text-gray-500">Gestión de monotributistas</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contador@estudio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full" loading={login.isPending}>
              Ingresar
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Todavía no tenés cuenta?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Registrá tu estudio
          </Link>
        </p>
      </div>
    </div>
  )
}
