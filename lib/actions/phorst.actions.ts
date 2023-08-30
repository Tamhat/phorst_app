"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Phorst from "../models/phorst.model";
import Community from "../models/community.model";

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
  const skipAmount = (pageNumber - 1) * pageSize;

  // Create a query to fetch the posts that have no parent (top-level phorst) (a phorst that is not a comment/reply).
  const postsQuery = Phorst.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({
      path: "author",
      model: User,
    })
    .populate({
      path: "community",
      model: Community,
    })
    .populate({
      path: "children", // Populate the children field
      populate: {
        path: "author", // Populate the author field within children
        model: User,
        select: "_id name parentId image", // Select only _id and username fields of the author
      },
    });

  // Count the total number of top-level posts (phorst) i.e., phorst that are not comments.
  const totalPostsCount = await Phorst.countDocuments({
    parentId: { $in: [null, undefined] },
  }); // Get the total count of posts

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext };
}

interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}

export async function createPhorst({ text, author, communityId, path }: Params
) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdPhorst = await Phorst.create({
      text,
      author,
      community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    // Update User model
    await User.findByIdAndUpdate(author, {
      $push: { phorst: createdPhorst._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { phorst: createdPhorst._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create phorst: ${error.message}`);
  }
}

async function fetchAllChildPhorsts(phorstId: string): Promise<any[]> {
  const childPhorsts = await Phorst.find({ parentId: phorstId });

  const descendantPhorsts = [];
  for (const childPhorst of childPhorsts) {
    const descendants = await fetchAllChildPhorsts(childPhorst._id);
    descendantPhorsts.push(childPhorst, ...descendants);
  }

  return descendantPhorsts;
}

export async function deletePhorst(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the Phorst to be deleted (the main phorst)
    const mainPhorst = await Phorst.findById(id).populate("author community");

    if (!mainPhorst) {
      throw new Error("Phorst not found");
    }

    // Fetch all child phorsts and their descendants recursively
    const descendantPhorsts = await fetchAllChildPhorsts(id);

    // Get all descendant Phorst IDs including the main Phorst ID and child Phorst IDs
    const descendantPhorstIds = [
      id,
      ...descendantPhorsts.map((phorst) => phorst._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantPhorsts.map((phorst) => phorst.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainPhorst.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantPhorsts.map((phorst) => phorst.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainPhorst.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child phorst and their descendants
    await Phorst.deleteMany({ _id: { $in: descendantPhorstIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { phorst: { $in: descendantPhorstIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { phorst: { $in: descendantPhorstIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete phorst: ${error.message}`);
  }
}

export async function fetchPhorstById(phorstId: string) {
  connectToDB();

  try {
    const phorst = await Phorst.findById(phorstId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children", // Populate the children field
        populate: [
          {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id id name parentId image", // Select only _id and username fields of the author
          },
          {
            path: "children", // Populate the children field within children
            model: Phorst, // The model of the nested children (assuming it's the same "Phorst" model)
            populate: {
              path: "author", // Populate the author field within nested children
              model: User,
              select: "_id id name parentId image", // Select only _id and username fields of the author
            },
          },
        ],
      })
      .exec();

    return phorst;
  } catch (err) {
    console.error("Error while fetching phorst:", err);
    throw new Error("Unable to fetch phorst");
  }
}

export async function addCommentToPhorst(
  phorstId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    // Find the original phorst by its ID
    const originalPhorst = await Phorst.findById(phorstId);

    if (!originalPhorst) {
      throw new Error("Phorst not found");
    }

    // Create the new comment phorst
    const commentPhorst = new Phorst({
      text: commentText,
      author: userId,
      parentId: phorstId, // Set the parentId to the original phorst's ID
    });

    // Save the comment phorst to the database
    const savedCommentPhorst = await commentPhorst.save();

    // Add the comment phorst's ID to the original phorst's children array
    originalPhorst.children.push(savedCommentPhorst._id);

    // Save the updated original phorst to the database
    await originalPhorst.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}
