const {
    getSettingsByUserId,
    updateSettingsByUserId,
} = require("../models/files/settings.model");

const formatSettings = (row) => ({
    returnPromptsEnabled: row.return_prompts_enabled,
});

const getSettings = async (req, res) => {
    try {
        const row = await getSettingsByUserId(req.user.userId);

        if (!row) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ settings: formatSettings(row) });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { returnPromptsEnabled } = req.body;

        // Strict boolean check: "false" (string) or 0 must not slip through.
        if (typeof returnPromptsEnabled !== "boolean") {
            return res.status(400).json({ message: "returnPromptsEnabled must be true or false" });
        }

        const row = await updateSettingsByUserId(req.user.userId, { returnPromptsEnabled });

        if (!row) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Settings updated",
            settings: formatSettings(row),
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getSettings, updateSettings };