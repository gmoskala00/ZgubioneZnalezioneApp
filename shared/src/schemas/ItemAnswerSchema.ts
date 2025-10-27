import { z } from "zod";

export const itemAnswerCreateSchema = z.object({
  answers: z.array(z.string().trim().min(1)).min(1, "Min. 1 odpowiedź"),
});

export type ItemAnswerCreate = z.infer<typeof itemAnswerCreateSchema>;

export const itemAnswerDtoSchema = z.object({
  _id: z.string(),
  answers: z.array(z.string()),
  answeredBy: z.string(),
  createdAt: z.string(),
});
export type ItemAnswerDto = z.infer<typeof itemAnswerDtoSchema>;
