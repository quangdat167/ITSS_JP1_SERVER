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
}

module.exports = new AuthController();
