import React, { createContext, useState, useEffect, useCallback } from "react";
import { getApiUrl } from "../utils/config";
import { useToast } from "../hooks/useToast";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [returnPromptsEnabled, setReturnPromptsEnabledState] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    const fetchSettings = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(getApiUrl("/api/settings"), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                if (typeof data.settings?.returnPromptsEnabled === "boolean") {
                    setReturnPromptsEnabledState(data.settings.returnPromptsEnabled);
                }
            }
        } catch (err) {
            console.error("Failed to load user settings:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const setReturnPromptsEnabled = useCallback(async (value) => {
        const previousValue = returnPromptsEnabled;
        // Optimistic update
        setReturnPromptsEnabledState(value);

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(getApiUrl("/api/settings"), {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ returnPromptsEnabled: value }),
            });

            if (!response.ok) {
                // Rollback on failure
                setReturnPromptsEnabledState(previousValue);
                toast.error("Failed to update setting");
            }
        } catch (err) {
            console.error("Failed to update settings:", err);
            // Rollback on network failure
            setReturnPromptsEnabledState(previousValue);
            toast.error("Network error while updating setting");
        }
    }, [returnPromptsEnabled, toast]);

    const value = {
        returnPromptsEnabled,
        setReturnPromptsEnabled,
        isLoading,
        fetchSettings,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export { SettingsContext };
