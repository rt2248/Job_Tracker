import React from "react";
import { Navigate } from "react-router-dom";
import { SettingsProvider } from "../context/SettingsContext";
import { TrackingProvider } from "../context/TrackingContext";
import ReturnPromptHost from "../components/shared/ReturnPromptHost";

import { clearPromptStorageOnLogout } from "../utils/promptStorage";

const ProtectedRoutes = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        clearPromptStorageOnLogout();
        return <Navigate to="/login" replace />;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) {
            clearPromptStorageOnLogout();
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }
    } catch {
        clearPromptStorageOnLogout();
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    return (
        <SettingsProvider>
            <TrackingProvider>
                <ReturnPromptHost />
                {children}
            </TrackingProvider>
        </SettingsProvider>
    );
};

export default ProtectedRoutes;