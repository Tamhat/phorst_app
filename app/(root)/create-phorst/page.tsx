import PostPhorst from "@/components/forms/PostPhorst";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

async function Page() {
  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id);

  if (!userInfo?.onboarded) redirect("/onboarding");

  return (
    <>
      <h1 className="head-text">Create Phorst</h1>

      <PostPhorst userId={userInfo._id}/>
    </>
  );
}

export default Page;
