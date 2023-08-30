import * as z from "zod";

export const PhorstValidation = z.object({
  phorst: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
  accountId: z.string(),
});

export const CommentValidation = z.object({
  phorst: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
});
