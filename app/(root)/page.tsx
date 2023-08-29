import PhorstCard from "@/components/cards/PhorstCard";
import { fetchPosts } from "@/lib/actions/phorst.actions";
import { currentUser } from "@clerk/nextjs";

export default async function Home() {
  const result = await fetchPosts(1, 30);
  const user = await currentUser()
  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="text-center no-result">No Phorst found.</p>
        ) : (
          result.posts.map((post) => (
            <PhorstCard
              key={post.id}
              id={post.id}
              currentUserId={user?.id || ""}
              parentId={post.parentId}
              content={post.text}
              author={post.author}
              community={post.community}
              createdAt={post.createdAt}
              comments={post.children}
            />
          ))
        )}
      </section>
    </>
  );
}