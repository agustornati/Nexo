import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRegister } from "@/hooks/useAuth"

export function RegisterPage() {
  const register = useRegister()
  const [form, setForm] = useState({
    studio_name: "",
    studio_cuit: "",
    studio_email: "",
    user_email: "",
    user_password: "",
    user_first_name: "",
    user_last_name: "",
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register.mutate(form)
  }

  const errorMessage = register.error
    ? (register.error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Error al registrar"
    : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-600 tracking-tight">Nexo</h1>
          <p className="mt-2 text-sm text-gray-500">Creá tu estudio contable</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Datos del estudio</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="studio_name">Nombre del estudio</Label>
                  <Input id="studio_name" placeholder="Estudio Pérez & Asociados" value={form.studio_name} onChange={set("studio_name")} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="studio_cuit">CUIT</Label>
                    <Input id="studio_cuit" placeholder="30123456789" value={form.studio_cuit} onChange={set("studio_cuit")} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="studio_email">Email del estudio</Label>
                    <Input id="studio_email" type="email" placeholder="info@estudio.com" value={form.studio_email} onChange={set("studio_email")} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tu cuenta</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input id="first_name" placeholder="Juan" value={form.user_first_name} onChange={set("user_first_name")} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input id="last_name" placeholder="Pérez" value={form.user_last_name} onChange={set("user_last_name")} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="user_email">Email</Label>
                  <Input id="user_email" type="email" placeholder="juan@estudio.com" value={form.user_email} onChange={set("user_email")} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={form.user_password} onChange={set("user_password")} required minLength={8} />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full" loading={register.isPending}>
              Crear estudio
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
