import { fetchUserPosts } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import PhorstCard from "../cards/PhorstCard";

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

const PhorstsTab = async ({ currentUserId, accountId, accountType }: Props) => {
  // TODO: Fetch profile phorsts
  let result = await fetchUserPosts(accountId);

  if (!result) redirect("/");

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.phorst.map((phorst: any) => (
        <PhorstCard
          key={phorst._id}
          id={phorst._id}
          currentUserId={currentUserId}
          parentId={phorst.parentId}
          content={phorst.text}
          author={
            accountType === "User"
              ? { name: result.name, image: result.image, id: result.id }
              : {
                  name: phorst.author.name,
                  image: phorst.author.image,
                  id: phorst.author.id,
                }
          } //todo
          community={phorst.community} //todo
          createdAt={phorst.createdAt}
          comments={phorst.children}
        />
      ))}
    </section>
  );
};

export default PhorstsTab;
