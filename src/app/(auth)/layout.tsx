import Link from "next/link"

import { EphaLogo } from "@/components/epha-logo"
import { FadeIn } from "@/components/motion/fade-in"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo completo con gradiente + glow */}
        <FadeIn className="mb-10 flex justify-center">
          <Link href="/" className="flex justify-center">
            <EphaLogo />
          </Link>
        </FadeIn>
        <FadeIn delay={0.12}>{children}</FadeIn>
      </div>
    </div>
  )
}
