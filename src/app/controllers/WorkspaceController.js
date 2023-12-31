const Config = require("../../util/Config");
const { mongoose } = require("mongoose");
const { UserTaskModel } = require("../models/userTask.model");
const { UserWorkspaceModel } = require("../models/userWorkspace.model");
const { WorkspaceModel } = require("../models/workspace.model");
const { TaskModel } = require("../models/Task.model");
const ObjectId = mongoose.Types.ObjectId;

function generateRandomCode() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";

    for (let i = 0; i < 7; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }

    return code;
}
class WorkspaceController {
    async create(req, res) {
        try {
            const { userId, name, description, memberId } = req.body;

            const newWs = await WorkspaceModel.create({
                name,
                description,
                code: generateRandomCode(),
            });
            newWs.save();

            await UserWorkspaceModel.create({
                userId,
                wsId: newWs._id,
                role: Config.USERWORKSPACE_ROLE_ADMIN,
            });

            return res.status(200).json(newWs);
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getAll(req, res) {
        try {
            const { userId } = req.body;

            const workspaces = await UserWorkspaceModel.aggregate([
                { $match: { userId: new ObjectId(userId) } },
                {
                    $lookup: {
                        from: "workspaces", // assuming the name of your workspace collection
                        localField: "wsId",
                        foreignField: "_id",
                        as: "workspace",
                    },
                },
                { $unwind: "$workspace" },
                {
                    $project: {
                        role: 1,
                        workspace: 1,
                    },
                },
            ]);

            return res.status(200).json(workspaces);
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getDetailWs(req, res) {
        try {
            const { _id } = req.body;

            const workspaces = await WorkspaceModel.aggregate([
                { $match: { _id: new ObjectId(_id) } },
                {
                    $lookup: {
                        from: "projects",
                        localField: "_id",
                        foreignField: "wsId",
                        as: "project",
                    },
                },
                {
                    $lookup: {
                        from: "tasks",
                        localField: "_id",
                        foreignField: "workspaceId",
                        as: "tasks",
                    },
                },
                {
                    $lookup: {
                        from: "usertasks",
                        localField: "tasks._id",
                        foreignField: "taskId",
                        as: "usertasks",
                    },
                },
                {
                    $lookup: {
                        from: "userinfos",
                        localField: "usertasks.userId",
                        foreignField: "_id",
                        as: "usertask",
                    },
                },
                {
                    $lookup: {
                        from: "projects",
                        localField: "tasks.projectId",
                        foreignField: "_id",
                        as: "projects",
                    },
                },
                {
                    $addFields: {
                        "tasks.firstName": "$usertask.firstName",
                        "tasks.lastName": "$usertask.lastName",
                        "tasks.role": "$usertasks.role",
                        "tasks.userId": "$usertasks.userId",
                        "tasks.projectName": "$projects.name",
                    },
                },
                {
                    $lookup: {
                        from: "userworkspaces",
                        localField: "_id",
                        foreignField: "wsId",
                        as: "members",
                    },
                },
                // {
                //     $unwind: "$members",
                // },
                {
                    $lookup: {
                        from: "userinfos",
                        localField: "members.userId", // Trường userId trong members
                        foreignField: "_id",
                        as: "member",
                    },
                },
                {
                    $addFields: {
                        "member.role": "$members.role", // Thêm trường role vào member
                    },
                },
                // { $unwind: "$members.role" },
                {
                    $project: {
                        usertask: 0,
                        usertasks: 0,
                    },
                },
            ]);

            return res.status(200).json(workspaces);
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async joinWorkspaceByCode(req, res) {
        try {
            const { userId, code } = req.body;

            const workspaces = await WorkspaceModel.findOne({ code });
            console.log(workspaces);
            if (workspaces) {
                const isUserJoined = await UserWorkspaceModel.findOne({
                    userId: userId,
                    wsId: workspaces._id,
                });
                if (isUserJoined) {
                    return res.status(200).json({ message: "You are already in the workspace" });
                } else
                    await UserWorkspaceModel.create({
                        userId,
                        wsId: workspaces._id,
                        role: Config.USERWORKSPACE_ROLE_MEMBER,
                    });
                return res.status(200).json({ message: "Joined workspace" });
            } else {
                res.status(200).json({ message: "Not exist workspace" });
            }
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getAllUserOfWorkspace(req, res) {
        try {
            const { wsId } = req.body;

            const allUser = await UserWorkspaceModel.aggregate([
                {
                    $match: {
                        wsId: new ObjectId(wsId),
                    },
                },
                {
                    $lookup: {
                        from: "userinfos",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userInfos",
                    },
                },
                {
                    $unwind: "$userInfos",
                },
                {
                    $project: {
                        userInfos: {
                            email: 1,
                            _id: 1,
                        },
                    },
                },
            ]);
            if (allUser.length) {
                return res.status(200).json(allUser);
            }
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async addUserToWs(req, res) {
        try {
            const { wsId, memberId } = req.body;

            if (memberId.length > 0) {
                await Promise.all(
                    memberId.map(async mem => {
                        await UserWorkspaceModel.create({
                            userId: mem,
                            wsId,
                            role: Config.USERWORKSPACE_ROLE_MEMBER,
                        });
                    }),
                );

                return res.status(200).json({ message: "successfully added" });
            }
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getAllTaskOfWorkspace(req, res) {
        try {
            const { wsId } = req.body;

            const allTask = await TaskModel.aggregate([
                {
                    $match: {
                        workspaceId: new ObjectId(wsId),
                    },
                },
                {
                    $lookup: {
                        from: "usertasks",
                        localField: "_id",
                        foreignField: "taskId",
                        as: "usertask",
                    },
                },
                {
                    $lookup: {
                        from: "userinfos",
                        localField: "usertask.userId",
                        foreignField: "_id",
                        as: "userInfo",
                    },
                },
                {
                    $lookup: {
                        from: "projects",
                        localField: "projectId",
                        foreignField: "_id",
                        as: "projectInfo",
                    },
                },
                {
                    $unwind: "$userInfo",
                },
                {
                    $unwind: "$projectInfo",
                },
            ]);
            console.log("allTask: ", allTask);
            res.status(200).json(allTask);
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async outWs(req, res) {
        try {
            const { wsId, userId } = req.body;

            await UserWorkspaceModel.deleteOne({
                userId,
                wsId,
            });

            const result = await UserTaskModel.aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                    },
                },
                {
                    $lookup: {
                        from: "tasks",
                        localField: "taskId",
                        foreignField: "_id",
                        as: "taskInfo",
                    },
                },
                {
                    $unwind: "$taskInfo",
                },
                {
                    $match: {
                        "taskInfo.workspaceId": new ObjectId(wsId),
                    },
                },
            ]);

            // Xử lý xóa các bản ghi từ bảng UserTaskModel
            const deletedRecords = await UserTaskModel.deleteMany({
                userId,
                taskId: { $in: result.map(item => item.taskId) },
            });

            return res.status(200).json({ message: "successfully out" });
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = new WorkspaceController();
