import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "echo inmo - Control de Comisiones Inmobiliarias",
  description:
    "Sistema de control de comisiones y distribución de ventas inmobiliarias",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
