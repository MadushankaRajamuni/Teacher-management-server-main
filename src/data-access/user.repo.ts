import { Types } from "mongoose";
import { User } from "../models/user.model";
const ObjectId = Types.ObjectId;

// Find a single user by filters
export const findOneUserRepo = (filters: any) => {
    return User.findOne(filters).exec();
};

// Find the latest user based on the given filters
export const findLatestUserRepo = async (filters?: any) => {
    return User.find(filters).sort({ createdAt: -1 }).limit(1).exec();
};

// Create a new user
export const createUserRepo = (data: any) => {
    return new User(data).save();
};

// Update an existing user based on filters and provided data
export const findOneAndUpdateUserRepo = async (filters: any, data: any) => {
    return User.findOneAndUpdate(filters, { $set: { ...data } }, { new: true }).exec();
};

// Get a paginated list of users with filters, sorting, and pagination
export const getPagedUsersRepo = async (data: any) => {
    const { pageIndex, pageSize, sortField, sortOrder, filters } = data;
    let filterFieldsStatus = {};
    let filterFields = {};
    let filterDepart = {};
    let archiveFilter = { archived: false };

    // Apply search filter
    if (filters?.searchTerm) {
        filterFields = {
            text: {
                $regex: filters.searchTerm,
                $options: "i",
            },
        };
    }

    // Apply department filter
    if (filters?.depart) {
        filterDepart = {
            "department._id": new ObjectId(filters.depart),
        };
    }

    // Apply status filter (active or inactive)
    if (filters?.status === true || filters?.status === false) {
        filterFieldsStatus = {
            active: filters.status,
        };
    }

    return User.aggregate([
        {
            $match: {
                ...archiveFilter,
            },
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
            $match: {
                ...filterFieldsStatus,
                ...filterDepart
            },
        },
        {
            $project: {
                _id: 1,
                firstname: 1,
                lastname: 1,
                email: 1,
                mobile: 1,
                department: {
                    depName: 1
                },
                active: 1,
                createdAt: 1,
                refNo: 1,
                text: {
                    $concat: [
                        { $ifNull: ["$refNo", ""] },
                        " ",
                        { $ifNull: ["$firstname", ""] },
                        " ",
                        { $ifNull: ["$lastname", ""] },
                        " ",
                        { $ifNull: ["$email", ""] },
                        " ",
                        { $ifNull: ["$mobile", ""] },
                        " ",
                        { $ifNull: ["$department.depName", ""] }
                    ],
                },
            },
        },
        {
            $match: {
                ...filterFields,
            },
        },
        {
            $project: {
                text: 0
            }
        },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    { $addFields: { page: pageIndex } },
                ],
                data: [
                    {
                        $sort: {
                            [sortField || "createdAt"]: sortOrder || -1,
                        },
                    },
                    { $skip: pageSize * (pageIndex - 1) || 0 },
                    { $limit: pageSize },
                ],
            },
        },
    ]).exec();
};
