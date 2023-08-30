import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";

import Comment from "@/components/forms/Comment";
import PhorstCard from "@/components/cards/PhorstCard";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchPhorstById } from "@/lib/actions/phorst.actions";

export const revalidate = 0;

async function page({ params }: { params: { id: string } }) {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const phorst = await fetchPhorstById(params.id);

  return (
    <section className="relative">
      <div>
        <PhorstCard
          id={phorst._id}
          currentUserId={user.id}
          parentId={phorst.parentId}
          content={phorst.text}
          author={phorst.author}
          community={phorst.community}
          createdAt={phorst.createdAt}
          comments={phorst.children}
        />
      </div>

      <div className="mt-7">
        <Comment
          phorstId={params.id}
          currentUserImg={user.imageUrl}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className="mt-10">
        {phorst.children.map((childItem: any) => (
          <PhorstCard
            key={childItem._id}
            id={childItem._id}
            currentUserId={user.id}
            parentId={childItem.parentId}
            content={childItem.text}
            author={childItem.author}
            community={childItem.community}
            createdAt={childItem.createdAt}
            comments={childItem.children}
            isComment
          />
        ))}
      </div>
    </section>
  );
}

export default page;
