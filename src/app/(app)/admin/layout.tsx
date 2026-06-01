import Link from "next/link"
import { Shield } from "lucide-react"

import { requireAdmin } from "@/lib/auth/guards"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-14 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
          <Shield className="size-4 text-primary" />
          <Link href="/admin/coaches" className="hover:text-foreground">
            Coaches
          </Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">{children}</div>
    </div>
  )
}
