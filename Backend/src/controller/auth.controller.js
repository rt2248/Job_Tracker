const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/hash");
const { findUserbyEmail, findUserbyUsername, createUser } = require("../models/files/user.model");

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

        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: newUser,
        });

    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

const login = async (req, res) => {

    try {

        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Email/Username and password are required" });
        }

        const isEmail = identifier.includes("@");

        const user = isEmail
            ? await findUserbyEmail(identifier)
            : await findUserbyUsername(identifier);

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const passwordMatch = await comparePassword(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                username: user.user_name,
            },
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }

};

module.exports = { signup, login };
