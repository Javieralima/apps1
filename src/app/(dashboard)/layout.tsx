import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/layout/NotificationBell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        user={{
          nombre: user.nombreCompleto,
          rol: user.rol,
          agencia: user.agencia.nombre,
        }}
      />
      <div className="flex-1 flex flex-col overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-end gap-4 sticky top-0 z-40">
          <NotificationBell />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              {user.nombreCompleto
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .substring(0, 2)}
            </div>
            <span className="font-medium">{user.nombreCompleto}</span>
          </div>
        </header>
        <main className="flex-1">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
