import { redirect } from "next/navigation"

/**
 * El catálogo público de coaches fue desactivado: el modelo pasó a ser
 * "solo por link directo". Cada producto se comparte vía
 * `/c/[handle]/[slug]`, que sigue funcionando. La raíz `/c` ya no navega
 * a un marketplace, así que redirige (307) al inicio.
 *
 * El componente original (CoachCard + listMarketplaceCoaches) se conserva en
 * el repo por si se reactiva el catálogo más adelante.
 */
export default function MarketplaceIndexPage() {
  redirect("/")
}
