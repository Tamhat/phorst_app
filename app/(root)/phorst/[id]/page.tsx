import PhorstCard from "@/components/cards/PhorstCard";
import Comment from "@/components/forms/Comment";
import { fetchPhorstById } from "@/lib/actions/phorst.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const Page = async ({ params }: { params: { id: string } }) => {
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
          key={phorst._id}
          id={phorst._id}
          currentUserId={user?.id || ""}
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
         phorstId={phorst.id}
          currentUserImg={userInfo.image}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className="mt-10">
        {phorst.children.map((childItem: any) => (
          <PhorstCard 
          key={childItem._id}
          id={childItem._id}
          currentUserId={childItem?.id || ""}
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
};
export default Page;
