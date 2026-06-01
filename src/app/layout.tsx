import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Inter, Cinzel, Cormorant_Garamond } from "next/font/google"

import { Providers } from "@/components/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

/** Exclusivamente para métricas de entrenamiento en vivo (peso, reps, series, timers). */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["700", "800"],
})

/** Solo se usa en el logo completo (auth/splash). */
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["900"],
})

/** Solo se usa en el logo completo (effatá, versículo). */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400"],
})

export const metadata: Metadata = {
  title: "EPHA — Open your limits",
  description:
    "Plataforma fitness para optimizar tu entrenamiento en el gimnasio: rutinas, ejecución en vivo y seguimiento de progreso.",
}

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${cinzel.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
