/**
 * Definición pura (sin React) de los pasos del tour de bienvenida del Inicio.
 * El motor (`SpotlightTour`) filtra los pasos cuyo `target` no exista en el DOM,
 * salvo el paso de bienvenida (sin target → cartelito centrado).
 *
 * Los `target` se corresponden con atributos `data-tour="..."` puestos en el
 * dashboard (cada tarjeta + la frase) y en el header del layout (el engranaje).
 */

export type TourStep = {
  id: string
  /** Selector `data-tour` del elemento a resaltar. Vacío = cartelito centrado. */
  target?: string
  title: string
  body: string
  /** Acción opcional con link (p.ej. ir a configurar las frases). */
  cta?: { label: string; href: string }
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a EPHA!",
    body: "Te muestro en 30 segundos cómo funciona la app. Podés saltarte el recorrido cuando quieras.",
  },
  {
    id: "rutinas",
    target: "rutinas",
    title: "Rutinas",
    body: "Creá y organizá tus rutinas de entrenamiento: días, ejercicios, series y descansos.",
  },
  {
    id: "entrenar",
    target: "entrenar",
    title: "Entrenar",
    body: "Seguí tu plan del día o elegí una rutina y entrená en vivo con el cronómetro y el timer de descanso.",
  },
  {
    id: "progreso",
    target: "progreso",
    title: "Progreso",
    body: "Mirá tu evolución de fuerza y volumen a lo largo del tiempo.",
  },
  {
    id: "wiki",
    target: "wiki",
    title: "Wiki Gym",
    body: "Una biblioteca de entrenamiento y nutrición para consultar cuando lo necesites.",
  },
  {
    id: "supplements",
    target: "supplements",
    title: "Suplementación",
    body: "Registrá tu constancia diaria de suplementos y no te saltees ninguno.",
  },
  {
    id: "asesorias",
    target: "asesorias",
    title: "Asesorías y planes",
    body: "Entrená con un coach profesional o, si sos coach, vendé tus asesorías en la plataforma.",
  },
  {
    id: "frases",
    target: "frases",
    title: "Tu frase del día",
    body: "Arriba aparece una frase motivacional al entrar. Podés elegir las categorías que te gustan (estoicismo, fe, mentalidad…) o desactivarlas.",
    cta: { label: "Configurar frases", href: "/settings/quotes" },
  },
  {
    id: "settings",
    target: "settings",
    title: "Configuración",
    body: "Desde este engranaje ajustás tu perfil, las frases y el resto de tus preferencias.",
  },
]
