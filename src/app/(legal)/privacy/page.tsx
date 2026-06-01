import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad — EPHA",
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
      <h1>Política de Privacidad</h1>
      <p className="text-muted-foreground text-sm">Última actualización: mayo 2025</p>

      <p>
        En <strong>EPHA</strong> nos tomamos en serio la privacidad de tus datos. Esta política
        explica qué información recopilamos, cómo la usamos y cuáles son tus derechos.
      </p>

      {/* 1 */}
      <h2>1. Información que recopilamos</h2>
      <h3>1.1 Datos que vos proporcionás</h3>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, dirección de email y contraseña (almacenada de forma
          encriptada; nunca la vemos en texto plano).
        </li>
        <li>
          <strong>Perfil fitness:</strong> fecha de nacimiento, sexo, altura, peso, objetivo,
          nivel de experiencia y preferencias de entrenamiento.
        </li>
        <li>
          <strong>Actividad:</strong> rutinas, sesiones de entrenamiento, series, pesos,
          repeticiones, suplementos y cualquier otro dato que registrés voluntariamente.
        </li>
      </ul>

      <h3>1.2 Datos recopilados automáticamente</h3>
      <ul>
        <li>
          <strong>Técnicos:</strong> tipo de dispositivo, sistema operativo y navegador (usados
          para diagnóstico de errores, no para seguimiento publicitario).
        </li>
        <li>
          <strong>Uso:</strong> páginas visitadas dentro de la app, con fines de mejora del
          servicio y detección de problemas.
        </li>
      </ul>

      {/* 2 */}
      <h2>2. Cómo usamos tu información</h2>
      <ul>
        <li>Brindar y mejorar las funcionalidades de la app.</li>
        <li>Personalizar tu experiencia (objetivos, estadísticas, progresión).</li>
        <li>Enviarte comunicaciones relacionadas con tu cuenta (confirmación, cambio de contraseña).</li>
        <li>Detectar y corregir errores técnicos.</li>
        <li>Cumplir con obligaciones legales.</li>
      </ul>
      <p>
        <strong>No vendemos, alquilamos ni cedemos tus datos personales a terceros con fines
        comerciales o publicitarios.</strong>
      </p>

      {/* 3 */}
      <h2>3. Proveedores de infraestructura</h2>
      <p>
        EPHA utiliza <strong>Supabase</strong> (base de datos y autenticación) y{" "}
        <strong>Vercel</strong> (hosting). Estos proveedores procesan tus datos únicamente para
        prestarnos el servicio de infraestructura y están sujetos a sus propias políticas de
        privacidad y a contratos de procesamiento de datos que garantizan la protección de tu
        información.
      </p>
      <ul>
        <li>
          Supabase:{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            supabase.com/privacy
          </a>
        </li>
        <li>
          Vercel:{" "}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            vercel.com/legal/privacy-policy
          </a>
        </li>
      </ul>

      {/* 4 */}
      <h2>4. Almacenamiento y seguridad</h2>
      <p>
        Tus datos se almacenan en servidores ubicados dentro de la Unión Europea (región
        eu-central de Supabase). Implementamos medidas técnicas y organizativas razonables para
        proteger tu información: cifrado en tránsito (TLS), contraseñas hasheadas y políticas de
        acceso a nivel de base de datos (Row Level Security).
      </p>
      <p>
        Ningún sistema es 100% seguro. Si detectamos una brecha que afecte tus datos, te
        notificaremos dentro de los plazos que exija la normativa aplicable.
      </p>

      {/* 5 */}
      <h2>5. Retención de datos</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu cuenta, borramos
        toda tu información personal en un plazo máximo de 30 días, salvo que debamos conservarla
        por obligación legal.
      </p>

      {/* 6 */}
      <h2>6. Tus derechos</h2>
      <p>Podés ejercer los siguientes derechos en cualquier momento:</p>
      <ul>
        <li>
          <strong>Acceso:</strong> solicitar un resumen de los datos que tenemos sobre vos.
        </li>
        <li>
          <strong>Rectificación:</strong> corregir datos inexactos desde la sección de perfil o
          contactándonos.
        </li>
        <li>
          <strong>Eliminación:</strong> pedir el borrado completo de tu cuenta y todos tus datos.
        </li>
        <li>
          <strong>Portabilidad:</strong> recibir tus datos de entrenamiento en formato legible.
        </li>
        <li>
          <strong>Oposición:</strong> objetar el tratamiento de tus datos en casos específicos.
        </li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos, contactanos en{" "}
        <strong>heman.app.contacto@gmail.com</strong>. Respondemos en un plazo máximo de 30 días
        hábiles.
      </p>

      {/* 7 */}
      <h2>7. Cookies y almacenamiento local</h2>
      <p>
        Usamos cookies de sesión estrictamente necesarias para mantener tu sesión iniciada
        (proporcionadas por Supabase Auth). También guardamos preferencias de la app en el
        almacenamiento local de tu dispositivo (<em>localStorage</em>). No usamos cookies de
        seguimiento ni publicitarias.
      </p>

      {/* 8 */}
      <h2>8. Menores de edad</h2>
      <p>
        La aplicación no está dirigida a menores de 13 años. Si tenés conocimiento de que un menor
        de esa edad nos proporcionó datos sin consentimiento parental, contactanos para proceder a
        su eliminación inmediata.
      </p>

      {/* 9 */}
      <h2>9. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad. Ante cambios significativos, notificaremos
        por email a los usuarios registrados al menos 15 días antes de que entren en vigencia.
        El uso continuado de la app tras ese plazo implica la aceptación de los cambios.
      </p>

      {/* 10 */}
      <h2>10. Contacto</h2>
      <p>
        Para cualquier consulta relacionada con tu privacidad escribinos a{" "}
        <strong>heman.app.contacto@gmail.com</strong>.
      </p>
    </article>
  )
}
