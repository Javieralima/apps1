"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  enlace: string;
  fecha: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = () => {
      fetch("/api/notificaciones")
        .then((r) => r.json())
        .then((d) => {
          setNotifications(d.notifications || []);
          setCount(d.count || 0);
        })
        .catch(() => {});
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tipoIcon: Record<string, string> = {
    comision: "text-amber-500",
    operacion: "text-blue-500",
    alerta: "text-red-500",
    pago: "text-green-500",
  };

  const tipoEmoji: Record<string, string> = {
    comision: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    operacion: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    alerta: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z",
    pago: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 transition"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">
              Notificaciones
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-400">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(n.enlace);
                  }}
                  className="w-full text-left p-3 hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className={`w-4 h-4 ${tipoIcon[n.tipo] || "text-slate-400"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={tipoEmoji[n.tipo] || tipoEmoji.alerta}
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">
                        {n.titulo}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {n.descripcion}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {timeAgo(n.fecha)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
