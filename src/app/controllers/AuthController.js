const { UserInfoModel } = require("../models/user.model");

class AuthController {
    async signUp(req, res) {
        try {
            const { email } = req.body;

            const existingUser = await UserInfoModel.findOne({ email });

            if (existingUser) {
                return res.status(200).json(existingUser);
            } else {
                const newUser = await UserInfoModel.create(req.body);
                newUser.save();
                return res.status(200).json(newUser);
            }
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async getUserInfo(req, res) {
        try {
            const { email } = req.body;

            const existingUser = await UserInfoModel.findOne({ email });

            if (existingUser) {
                return res.status(200).json(existingUser);
            } else {
                return res.status(200).json({});
            }
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async searchUserByEmail(req, res) {
        try {
            const { email } = req.body;

            const users = await UserInfoModel.find({
                email: { $regex: email, $options: "i" },
            });

            if (users.length > 0) {
                return res.status(200).json(users);
            } else {
                return res.status(200).json({ message: "No users found" });
            }
        } catch (err) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getAllUserEmail(req, res) {
        try {
            // const {  } = req.body;

            const allUser = await UserInfoModel.aggregate([
                {
                    $match: {},
                },
                {
                    $project: {
                        email: 1,
                    },
                },
            ]);

            return res.status(200).json(allUser);
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = new AuthController();
