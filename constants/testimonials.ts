export interface TestimonialContent {
  name: string;
  city: string;
  service: string;
  quote: string;
}

/**
 * Testimonios reales de clientes.
 *
 * Está VACÍO a propósito: el cliente todavía no ha entregado testimonios
 * reales y publicar reseñas inventadas sería publicidad engañosa (Ley 1480
 * de 2011). Mientras el array esté vacío, `Testimonials.tsx` no renderiza
 * la sección — mismo criterio que ya usa `Location.tsx` cuando faltan los
 * datos de dirección.
 *
 * Para publicarla: agregar aquí los testimonios reales, con autorización
 * del cliente para usar su nombre y ciudad. No hace falta tocar el
 * componente.
 */
export const TESTIMONIALS: TestimonialContent[] = [];
