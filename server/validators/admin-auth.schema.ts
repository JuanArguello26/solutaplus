import { z } from "zod";

export const adminLoginSchema = z.object({
  password: z.string({ error: "La contraseña es obligatoria." }).min(1, {
    error: "La contraseña es obligatoria.",
  }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
