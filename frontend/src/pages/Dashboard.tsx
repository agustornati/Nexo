import { useAuthStore } from "@/store/authStore"

export function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bienvenido, {user?.first_name}. Aquí vas a ver el estado de tu cartera.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
        <p className="text-sm text-gray-400">
          Sprint 3 — el dashboard con KPIs y tabla de clientes va acá
        </p>
      </div>
    </div>
  )
}
