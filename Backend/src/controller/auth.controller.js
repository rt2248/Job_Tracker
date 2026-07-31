const bcrypt = require("bcryptjs");

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        //Empty case
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        //Password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //User details
        const user = {
            name,
            email,
            password: hashedPassword,
        };

        console.log("User created: ", user);
        res.status(201).json({
            message: "User registered successfully",
            user: {
                name: user.name,
                email: user.email,
            },
        });
    }

    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" })
    }
};

module.exports = { signup };