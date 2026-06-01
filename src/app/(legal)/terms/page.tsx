import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones — EPHA",
}

export default function TermsPage() {
  return (
    <article className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
      <h1>Términos y Condiciones de Uso</h1>
      <p className="text-muted-foreground text-sm">Última actualización: mayo 2025</p>

      <p>
        Al crear una cuenta en <strong>EPHA</strong> y utilizar la aplicación, aceptás los
        presentes Términos y Condiciones. Leelos detenidamente antes de registrarte.
      </p>

      {/* 1 */}
      <h2>1. Descripción del servicio</h2>
      <p>
        EPHA es una aplicación web de seguimiento de entrenamiento físico que permite planificar
        rutinas, registrar sesiones, llevar control de suplementación y acceder a contenido
        educativo sobre fitness y nutrición. El servicio se presta de forma gratuita durante el
        período de acceso abierto.
      </p>

      {/* 2 */}
      <h2>2. Requisitos de uso</h2>
      <ul>
        <li>
          <strong>Edad mínima:</strong> debés tener al menos 18 años para registrarte. Si tenés
          entre 13 y 17 años, necesitás autorización expresa de tu padre, madre o tutor legal.
        </li>
        <li>
          <strong>Información veraz:</strong> los datos que ingresás (nombre, peso, edad, objetivo)
          deben ser correctos. No nos hacemos responsables por resultados derivados de datos
          incorrectos.
        </li>
        <li>
          <strong>Acceso personal:</strong> tu cuenta es individual e intransferible. No podés
          compartirla ni cederla a terceros.
        </li>
      </ul>

      {/* 3 */}
      <h2>3. Descargo de responsabilidad médica y física</h2>
      <p>
        <strong>
          EPHA no es un servicio médico ni de salud profesional. El contenido de la aplicación
          —incluyendo planes de entrenamiento, artículos de la Wiki Gym, sugerencias de
          suplementación y cualquier otra información— tiene carácter exclusivamente informativo y
          educativo.
        </strong>
      </p>
      <p>
        Antes de iniciar cualquier programa de ejercicio físico, cambio en tu alimentación o
        consumo de suplementos, consultá con un médico u otro profesional de la salud habilitado,
        especialmente si:
      </p>
      <ul>
        <li>Tenés antecedentes de enfermedades cardíacas, metabólicas o musculoesqueléticas.</li>
        <li>Estás embarazada, en período de lactancia o post-parto reciente.</li>
        <li>Tomás medicamentos recetados.</li>
        <li>Llevás más de un año sin realizar actividad física regular.</li>
      </ul>
      <p>
        El uso de la aplicación es bajo tu exclusiva responsabilidad. EPHA y sus desarrolladores
        no se hacen responsables por lesiones, daños a la salud, pérdidas o perjuicios de cualquier
        tipo derivados del uso o la interpretación del contenido de la app.
      </p>

      {/* 4 */}
      <h2>4. Suplementación</h2>
      <p>
        La sección de suplementación es una herramienta de organización y seguimiento personal.
        No constituye prescripción, recomendación médica ni nutricional. La decisión de tomar
        cualquier suplemento es tuya y, de considerarlo necesario, debería consultarse con un
        profesional de la salud o nutricionista.
      </p>

      {/* 5 */}
      <h2>5. Propiedad de los datos</h2>
      <p>
        Los datos de entrenamiento, rutinas y preferencias que registrás en la app son tuyos. No
        vendemos ni compartimos tu información personal con terceros con fines comerciales. Podés
        solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento contactándonos
        por los medios indicados en la Política de Privacidad.
      </p>

      {/* 6 */}
      <h2>6. Conducta del usuario</h2>
      <p>Queda prohibido:</p>
      <ul>
        <li>Intentar acceder a cuentas de otros usuarios.</li>
        <li>Usar la aplicación para actividades ilegales o que perjudiquen a terceros.</li>
        <li>Introducir datos falsos, código malicioso o realizar ataques a la infraestructura.</li>
      </ul>

      {/* 7 */}
      <h2>7. Modificaciones del servicio</h2>
      <p>
        Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier
        momento, con o sin previo aviso. Ante cambios relevantes en estos Términos, notificaremos
        a los usuarios activos por email.
      </p>

      {/* 8 */}
      <h2>8. Ley aplicable</h2>
      <p>
        Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier
        controversia, las partes se someten a la jurisdicción de los tribunales ordinarios de la
        Ciudad Autónoma de Buenos Aires.
      </p>

      {/* 9 */}
      <h2>9. Contacto</h2>
      <p>
        Para consultas sobre estos Términos escribinos a{" "}
        <strong>heman.app.contacto@gmail.com</strong>.
      </p>
    </article>
  )
}
