const { Schema, model } = require("mongoose");
const { workspaceTableName } = require("./workspace.model");
const { projectTableName } = require("./Project.model");

const ObjectId = Schema.Types.ObjectId;
const taskTableName = "task";

const taskSchema = new Schema(
    {
        name: { type: String },
        description: { type: String },
        startTime: { type: Date },
        deadline: { type: Date },
        priority: { type: String },
        status: { type: String },
        workspaceId: { type: ObjectId, ref: workspaceTableName },
        type: { type: String },
        projectId: { type: ObjectId, ref: projectTableName },
    },
    {
        versionKey: false,
        timestamps: true,
    },
);

const TaskModel = model(taskTableName, taskSchema);

module.exports = { TaskModel, taskTableName };
