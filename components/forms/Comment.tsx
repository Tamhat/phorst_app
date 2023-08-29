"use client";

import { z } from "zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { usePathname } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { currentUser } from "@clerk/nextjs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { CommentValidation } from "@/lib/validations/phorst";
import { addCommentToPhorst } from "@/lib/actions/phorst.actions";

interface Props {
  phorstId: string;
  currentUserImg: string;
  currentUserId: string;
}

function Comment({ phorstId, currentUserImg, currentUserId }: Props) {
  const pathname = usePathname();

  const form = useForm<z.infer<typeof CommentValidation>>({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      phorst: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
    await addCommentToPhorst(
      phorstId,
      values.phorst,
      JSON.parse(currentUserId),
      pathname
    );

    form.reset();
  };

  try {
    currentUserImg && console.log("got the image");
  } catch (err) {
    console.log(`not getting the image ${err}`);
  }

  console.log("currentUserImg:", currentUserImg);
  return (
    <Form {...form}>
      <form className="comment-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="phorst"
          render={({ field }) => (
            <FormItem className="flex w-full items-center gap-3">
              <FormLabel>
                <Image
                  alt="current_user"
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                  src={
                    currentUserImg
                      ? currentUserImg
                      : "https://th.bing.com/th/id/R.ba5be714eae6b3bfb14effbd3f262eca?rik=XnSV8wJhQY%2fdPA&pid=ImgRaw&r=0"
                  }
                />
              </FormLabel>
              <FormControl className="border-none bg-transparent">
                <Input
                  type="text"
                  {...field}
                  placeholder="Comment..."
                  className="no-focus text-light-1 outline-none"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="comment-form_btn">
          Reply
        </Button>
      </form>
    </Form>
  );
}

export default Comment;
