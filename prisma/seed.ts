import "dotenv/config";
import { PrismaClient, type Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SERVICES as SERVICE_CATALOG } from "../constants/services";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definida. Revisa tu archivo .env.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

type PlanSeed = Omit<Prisma.PlanCreateInput, "service">;

type ServiceSeed = Prisma.ServiceCreateInput & {
  plans: PlanSeed[];
};

// ⚠️ PRECIOS DE EJEMPLO. Las tarifas reales las debe confirmar el cliente;
// hasta entonces `NEXT_PUBLIC_PRICES_CONFIRMED` se queda en "false" y el
// cotizador no le muestra la cifra al usuario (ver lib/public-env.ts).
//
// Los planes se declaran aquí porque el modelo Plan solo existe en la base
// de datos. Los METADATOS de cada servicio (nombre, descripción, icono,
// orden) NO se repiten: se toman de `constants/services.ts`, que es la
// fuente única —así la landing (que renderiza desde esa constante) y el
// cotizador (que lee de la base de datos) no pueden divergir.
const PLANS_BY_SLUG: Record<string, PlanSeed[]> = {
  salud: [
    {
      name: "Básico",
      description: "Cobertura esencial en salud.",
      estimatedPrice: 120000,
      currency: "COP",
      benefits: ["Atención personalizada", "Cobertura nacional"],
      displayOrder: 1,
    },
    {
      name: "Intermedio",
      description: "Cobertura ampliada con beneficios adicionales.",
      estimatedPrice: 185000,
      currency: "COP",
      benefits: [
        "Atención personalizada",
        "Cobertura nacional",
        "Asesor dedicado",
      ],
      displayOrder: 2,
    },
    {
      name: "Premium",
      description: "Cobertura completa para toda la familia.",
      estimatedPrice: 260000,
      currency: "COP",
      benefits: [
        "Atención personalizada",
        "Cobertura nacional",
        "Asesor dedicado",
        "Acompañamiento permanente",
      ],
      displayOrder: 3,
    },
    {
      name: "Empresarial",
      description: "Plan diseñado para equipos y empresas.",
      estimatedPrice: 350000,
      currency: "COP",
      benefits: [
        "Cobertura nacional",
        "Asesor dedicado",
        "Gestión centralizada de afiliados",
      ],
      displayOrder: 4,
    },
  ],
  pension: [
    {
      name: "Básico",
      description: "Afiliación estándar al fondo de pensión.",
      estimatedPrice: 95000,
      currency: "COP",
      benefits: ["Atención personalizada", "Asesoría en traslado de fondo"],
      displayOrder: 1,
    },
    {
      name: "Premium",
      description: "Afiliación con acompañamiento continuo.",
      estimatedPrice: 150000,
      currency: "COP",
      benefits: [
        "Atención personalizada",
        "Asesoría en traslado de fondo",
        "Acompañamiento permanente",
      ],
      displayOrder: 2,
    },
  ],
  arl: [
    {
      name: "Básico",
      description: "Cobertura de riesgos laborales para independientes.",
      estimatedPrice: 45000,
      currency: "COP",
      benefits: ["Cobertura nacional", "Atención personalizada"],
      displayOrder: 1,
    },
    {
      name: "Premium",
      description: "Cobertura ampliada de riesgos laborales.",
      estimatedPrice: 80000,
      currency: "COP",
      benefits: [
        "Cobertura nacional",
        "Atención personalizada",
        "Asesor dedicado",
      ],
      displayOrder: 2,
    },
  ],
  "seguridad-social-integral": [
    {
      name: "Integral Básico",
      description: "Los tres servicios en su cobertura esencial.",
      estimatedPrice: 220000,
      currency: "COP",
      benefits: ["Cobertura nacional", "Gestión centralizada"],
      displayOrder: 1,
    },
    {
      name: "Integral Premium",
      description: "Los tres servicios con cobertura ampliada.",
      estimatedPrice: 380000,
      currency: "COP",
      benefits: [
        "Cobertura nacional",
        "Gestión centralizada",
        "Asesor dedicado",
      ],
      displayOrder: 2,
    },
  ],
};

// Une los metadatos de `constants/services.ts` (fuente única) con los planes
// de arriba. `benefits` de la constante es solo para las tarjetas de la
// landing: el modelo Service de Prisma no tiene ese campo.
const SERVICES: ServiceSeed[] = SERVICE_CATALOG.map((service, index) => ({
  name: service.name,
  slug: service.slug,
  description: service.description,
  icon: service.icon,
  displayOrder: index + 1,
  plans: PLANS_BY_SLUG[service.slug] ?? [],
}));

async function main() {
  for (const { plans, ...service } of SERVICES) {
    const createdService = await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });

    for (const plan of plans) {
      await prisma.plan.upsert({
        where: {
          serviceId_name: { serviceId: createdService.id, name: plan.name },
        },
        update: plan,
        create: { ...plan, service: { connect: { id: createdService.id } } },
      });
    }

    console.log(
      `Servicio "${createdService.name}" listo con ${plans.length} plan(es).`,
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
