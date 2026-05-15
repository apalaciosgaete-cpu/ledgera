// src/app/disclaimer/page.tsx

export default function DisclaimerPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        padding: "48px 24px",
        fontFamily: "var(--font-body)",
      }}
    >
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "16px",
          padding: "40px",
          color: "#0F172A",
          lineHeight: 1.7,
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            margin: "0 0 16px",
          }}
        >
          Disclaimer tributario
        </h1>

        <p style={{ color: "#64748B", marginBottom: "32px" }}>
          Última actualización: mayo 2026
        </p>

        <h2>1. Naturaleza de LEDGERA</h2>
        <p>
          LEDGERA es una plataforma tecnológica orientada a la organización,
          trazabilidad y generación de información financiera y tributaria
          relacionada con criptoactivos y activos digitales.
        </p>

        <p>
          La plataforma entrega herramientas de cálculo, reportes, clasificación,
          respaldo documental y apoyo operativo, pero no constituye asesoría
          tributaria, legal, contable, financiera ni de inversión.
        </p>

        <h2>2. No reemplazo de asesoría profesional</h2>
        <p>
          El uso de LEDGERA no reemplaza la revisión de un contador, auditor,
          abogado tributario u otro profesional competente. El usuario es
          responsable de validar la información generada antes de utilizarla en
          declaraciones, presentaciones ante la autoridad tributaria o decisiones
          patrimoniales.
        </p>

        <h2>3. Información ingresada por el usuario</h2>
        <p>
          Los cálculos, reportes y resultados generados por LEDGERA dependen de
          la información ingresada, importada o confirmada por el usuario. Si los
          datos de origen son incompletos, erróneos, duplicados o inconsistentes,
          los resultados generados por la plataforma también pueden ser
          incorrectos.
        </p>

        <h2>4. Criterios tributarios</h2>
        <p>
          LEDGERA puede aplicar criterios técnicos y metodologías de cálculo,
          incluyendo FIFO, conversión de moneda, determinación de PnL y
          clasificación de eventos tributarios. Estos criterios pueden requerir
          revisión profesional según el caso concreto del usuario.
        </p>

        <h2>5. No garantía de aceptación por autoridad tributaria</h2>
        <p>
          LEDGERA no garantiza que los reportes, cálculos, respaldos o
          clasificaciones generadas sean aceptados automáticamente por el Servicio
          de Impuestos Internos u otra autoridad competente.
        </p>

        <p>
          La aceptación, observación o rechazo de antecedentes tributarios
          depende de la normativa vigente, los antecedentes disponibles, los
          criterios administrativos aplicables y la situación particular de cada
          contribuyente.
        </p>

        <h2>6. Responsabilidad del usuario</h2>
        <p>
          El usuario es responsable de revisar, validar, conservar y presentar la
          información tributaria que corresponda. También es responsable de
          mantener respaldos, documentos de origen, comprobantes de transacciones
          y cualquier antecedente requerido para justificar sus operaciones.
        </p>

        <h2>7. Cambios normativos</h2>
        <p>
          Las normas tributarias, criterios administrativos y obligaciones
          aplicables pueden cambiar en el tiempo. LEDGERA podrá actualizar sus
          funcionalidades y criterios, pero no garantiza que todos los cambios
          normativos sean incorporados de forma inmediata.
        </p>

        <h2>8. Limitación de responsabilidad</h2>
        <p>
          LEDGERA no será responsable por pérdidas, multas, sanciones,
          diferencias tributarias, errores de declaración o perjuicios derivados
          del uso incorrecto de la plataforma, de información incompleta ingresada
          por el usuario o de la falta de revisión profesional independiente.
        </p>

        <h2>9. Recomendación final</h2>
        <p>
          Antes de presentar información tributaria, declaraciones, reportes o
          antecedentes generados con LEDGERA, se recomienda obtener revisión de
          un profesional competente, especialmente en operaciones de alto monto,
          alta complejidad o con impacto tributario relevante.
        </p>
      </section>
    </main>
  );
}