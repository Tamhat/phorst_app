import * as z from "zod";

export const PhorstValidation = z.object({
    phorst: z.string().nonempty().min(3,{message:"Phorst must be at least 3 characters long"}),
    accountId: z.string(),
})

export const CommentValidation = z.object({
    phorst: z.string().nonempty().min(3,{message:"Phorst must be at least 3 characters long"}),

})
















