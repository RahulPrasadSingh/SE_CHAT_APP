//import Message from "../models/MessagesModel.js";
//import mongoose from "mongoose";
import User from "../models/UserModel.js";
// export const getContactsForDMList = async (request, response) => {
//   try {
//     let { userId } = request;
//     if (!userId) {
//       return response.status(400).send("User ID is required");
//     }
//     userId = new mongoose.Types.ObjectId(userId);

//     const contacts = await Message.aggregate([
//       {
//         $match: {
//           $or: [{ sender: userId }, { recipient: userId }],
//         },
//       },
//       {
//         $sort: { timestamp: -1 },
//       },
//       {
//         $group: {
//           _id: {
//             $cond: {
//               if: { $eq: ["$sender", userId] },
//               then: "$recipient",
//               else: "$sender",
//             },
//           },
//           lastMessageTime: { $first: "$timestamp" },
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "_id",
//           foreignField: "_id",
//           as: "contactInfo",
//         },
//       },
//       {
//         $unwind: "$contactInfo",
//       },
//       {
//         $project: {
//           _id: 1,
//           lastMessageTime: 1,
//           email: "$contactInfo.email",
//           firstName: "$contactInfo.firstName",
//           lastName: "$contactInfo.lastName",
//           image: "$contactInfo.image",
//           color: "$contactInfo.color",
//         },
//       },
//       {
//         $sort: { lastMessageTime: -1 },
//       },
//     ]);

//     return response.status(200).json({ contacts });
//   } catch (error) {
//     console.error("Error in getContactsForDMList:", error);
//     return response.status(500).send("Internal Server Error");
//   }
// };

export const searchContacts = async (request, response) => {
  try {
    const { searchTerm } = request.body;
    const { userId } = request;
    if (!userId) {
      return response.status(400).send("User ID is required");
    }
    if (!searchTerm) {
      return response.status(400).send("Search term is required");
    }

    const sanitizedSearchTerm = searchTerm.replace(/[.*+?^${}|[\]\\]/g, "\\$&");
    const regex = new RegExp(sanitizedSearchTerm, "i");

    const contacts = await User.find({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] },
      ],
    });

    return response.status(200).json({ contacts });
  } catch (error) {
    console.error("Error in searchContacts:", error);
    return response.status(500).send("Internal Server Error");
  }
};

// export const getAllContacts = async (request, response) => {
//   try {
//     const users = await User.find(
//       { _id: { $ne: request.userId } },
//       "firstName lastName _id"
//     );

//     const contacts = users.map((user) => ({
//       label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
//       value: user._id,
//     }));

//     return response.status(200).json({ contacts });
//   } catch (error) {
//     console.error("Error in searchContacts:", error);
//     return response.status(500).send("Internal Server Error");
//   }
// };