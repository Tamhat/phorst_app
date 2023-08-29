"use server";

import { revalidatePath } from "next/cache";
import Phorst from "../models/phorst.model";
import { connectToDB } from "../mongoose";
import User from "../models/user.model";

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export async function createPhorst({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    connectToDB();

    const createPhorst = await Phorst.create({
      text,
      author,
      community: null,
    });

    //update user model
    await User.findOneAndUpdate({ _id: author }, {
      $push: { phorst: createPhorst._id },
    });
    
    revalidatePath(path);
  } catch (err) {
    console.log(err);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20, author: string) {
  //connect to db
  connectToDB();

  //skipAmount is the amount of posts to skip----
  const skipAmount = pageSize * (pageNumber - 1);

  //find all posts that have no parent----
  //populate author and children
  const postQuery = Phorst.find({ parentId: { $in: [null, undefined] } })
    //sort by createdAt
    .sort({ createdAt: "desc" })
    //skip posts
    .skip(skipAmount)
    //limit posts
    .limit(pageSize)
    //populate author and children
    .populate({ path: "author", model:User, match: { _id: author } })
    .populate({
      path: "children",
      //sort by createdAt
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    });
  const totalPostsCount = await Phorst.countDocuments({
    parentId: { $in: [null, undefined] },
  });

  const posts = await postQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext };
}

export async function fetchPhorstById(id: string) {
  connectToDB();
  try {
    const phorst = await Phorst.findById(id)
      .populate({ path: "author", model: User, select: "_id id name image" })
      .populate({
        path: "children",
        populate: [
          { path: "author", model: User, select: "_id id name parentId image" },
          {
            path: "children",
            model: Phorst,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      }).exec();

    return phorst;
  } catch (err: any) {
    throw new Error(`Error fetching phorst: ${err.message}`);
  }
}

export async function addCommentToPhorst(
  phorstId: string,
  commentText: string,
  userId : string,
  path : string
){
  connectToDB();
  try{
    
  //find original phorst
  const originalPhorst = await Phorst.findById(phorstId);

  if(!originalPhorst){
    throw new Error("Phorst not found");
  }

  //create new phorst with the comment text
  const commentPhorst = new Phorst({
    text: commentText,
    author: userId,
    parentId: phorstId,
  })

  //save new phorst
  const savedCommentPhorst = await commentPhorst.save();

  //update original phorst with new phorst
  originalPhorst.children.push(savedCommentPhorst._id);

  //save original phorst
  await originalPhorst.save();

  revalidatePath(path);
  }
  catch(error){
    console.log(error);
  }
}