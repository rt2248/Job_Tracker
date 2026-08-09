const { hashPassword } = require("../utils/hash");
const { findUserbyEmail, createUser } = require("../models/user.model");

const signup = async (req, res) => {
    try {
        const { firstname, midname, lastname, email, username, password } = req.body;

        if (!firstname || !lastname || !email || !username || !password) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        const existingUser = await findUserbyEmail(email);

        if (existingUser) {
            return res.status(409).json
                ({ message: "Email already in use" });
        }

        const passwordHash = await hashPassword(password);
        const newUser = await createUser({
            firstName: firstname,
            middleName: midname,
            lastName: lastname,
            email,
            userName: username,
            passwordHash,
        });

        res.status(201).json({
            message: "User registered successfully",
            user: newUser,
        });

    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { signup };
