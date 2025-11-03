import { z } from "zod";

export const claimCreateSchema = z.object({
  answers: z
    .array(z.string().min(1))
    .length(2, "Podaj dokładnie dwie odpowiedzi"),
  message: z.string().max(500).optional(),
});
