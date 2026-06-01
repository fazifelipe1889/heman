import { EphaLogoButton } from "@/components/epha-logo-button"
import { MarketplaceBackButton } from "@/components/marketplace-back-button"
import { createClient } from "@/lib/supabase/server"

export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center gap-1">
          <MarketplaceBackButton />
          <EphaLogoButton
            href={user ? "/dashboard" : "/login"}
            aria_label="Inicio"
          />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
