import { redirect } from "next/navigation";

import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import { fetchUserPosts } from "@/lib/actions/user.actions";

import PhorstCard from "../cards/PhorstCard";

interface Result {
  name: string;
  image: string;
  id: string;
  phorst: {
    _id: string;
    text: string;
    parentId: string | null;
    author: {
      name: string;
      image: string;
      id: string;
    };
    community: {
      id: string;
      name: string;
      image: string;
    } | null;
    createdAt: string;
    children: {
      author: {
        image: string;
      };
    }[];
  }[];
}

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

async function PhorstTab({ currentUserId, accountId, accountType }: Props) {
  let result: Result;

  if (accountType === "Community") {
    result = await fetchCommunityPosts(accountId);
  } else {
    result = await fetchUserPosts(accountId);
  }

  if (!result) {
    redirect("/");
  }

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.phorst.map((phorst) => (
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
          }
          community={
            accountType === "Community"
              ? { name: result.name, id: result.id, image: result.image }
              : phorst.community
          }
          createdAt={phorst.createdAt}
          comments={phorst.children}
        />
      ))}
    </section>
  );
}

export default PhorstTab;
