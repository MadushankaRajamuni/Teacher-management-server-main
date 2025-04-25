import { Types } from "mongoose";
import {User} from "../models/user.model";
import {UserPWReset} from "../models/user.password.reset.model";
import {hashPassword, validatePassword} from "../util/hash";
const ObjectId = Types.ObjectId;


export const aggregateUserRepo = (filters: any) => {
    return User.aggregate([
        {
            $match: {
                ...filters,
            },
        },
    ]).exec();
};

export const findOneUserRepo = (filters: any) => {
    return User.findOne(filters).exec();
};

export const findLatestUserRepo = async (filters? : any) => {
    return User.find(filters).sort({ createdAt: -1 }).limit(1).exec();
};
export const createUserRepo = (data: any) => {
    return new User(data).save();
};

export const getLoggedUserRepo = async (id: any) => {
    return User.aggregate([
        {
            $match: {
                _id: new ObjectId(id),
            },
        },
        {
            $lookup: {
                from: "roles",
                localField: "role",
                foreignField: "_id",
                as: "role",
            },
        },
        {
            $unwind: {
                path: "$role",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 1,
                role: {
                  name: 1
                },
                refNo: 1,
                name: {
                    $concat: [
                        { $ifNull: ["$firstname", ""] },
                        " ",
                        { $ifNull: ["$lastname", ""] },
                    ],
                },
                email: 1,
                imageUrl: 1,
                active: 1,
                mobile: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]).exec();
};

export const getPagedUserRepo = async (data: any) => {
    const { pageIndex = 0, pageSize = 10, sortField = "createdAt", sortOrder = -1, filters = {} } = data;

    const matchStage: any = {
        archived: false,
    };

    // Search filter (on text field)
    if (filters?.searchTerm) {
        matchStage["text"] = {
            $regex: filters.searchTerm,
            $options: "i",
        };
    }

    // Status filter
    if (filters?.status === true || filters?.status === false) {
        matchStage["active"] = filters.status;
    }

    // Department filter
    if (filters?.depart) {
        matchStage["department"] = new ObjectId(filters.depart);
    }

    const pipeline: any[] = [
        {
            $match: matchStage,
        },
        {
            $lookup: {
                from: "departments",
                localField: "department",
                foreignField: "_id",
                as: "department",
            },
        },
        {
            $unwind: {
                path: "$department",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "roles",
                localField: "role",
                foreignField: "_id",
                as: "role",
            },
        },
        {
            $unwind: {
                path: "$role",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 1,
                refNo: 1,
                name: {
                    $concat: [
                        { $ifNull: ["$firstname", ""] },
                        " ",
                        { $ifNull: ["$lastname", ""] },
                        " ",
                        { $ifNull: ["$email", ""] },
                        " ",
                        { $ifNull: ["$mobile", ""] },
                        " ",
                        { $ifNull: ["$department.depName", ""] },
                    ],
                },
                firstname:1,
                lastname:1,
                email: 1,
                imageUrl: 1,
                active: 1,
                nic: 1,
                mobile: 1,
                createdAt: 1,
                updatedAt: 1,
                "role.name": 1,
                "department.depName": 1,
            },
        },

        {
            $sort: {
                [sortField]: sortOrder === -1 ? -1 : 1,
            },
        },
        {
            $facet: {
                data: [
                    { $skip: pageIndex * pageSize },
                    { $limit: pageSize },
                ],
                total: [
                    { $count: "count" },
                ],
            },
        },
    ];

    const result = await User.aggregate(pipeline).exec();
    const users = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

    return {
        users,
        total,
    };
};
export const findOneAndUpdateUserRepo = async (filters: any, data: any) => {
    if (data.password) {
        if (validatePassword(data.password)) {
            data.password = await hashPassword(data.password);
        } else {
            throw {
                pwdValid: false,
                message:
                    "Password must be at least 8 characters long, contain at least one lowercase letter, one uppercase letter, and one digit.",
            };
        }
    }
    return User.findOneAndUpdate(filters, { $set: { ...data } }, { new: true }).exec();
};

export const createUserPwReset = (data: any, session?: any) => {
    return new UserPWReset(data).save({ session });
};
export const findUserPwResetToken = (filters?: any) => {
    return UserPWReset.findOne(filters).exec();
};
export const findUserPwResetTokenAndDelete = (filters?: any) => {
    return UserPWReset.findOneAndDelete(filters).exec();
};
