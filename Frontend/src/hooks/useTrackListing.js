import { useContext } from "react";
import { TrackingContext } from "../context/TrackingContext";

export function useTrackListing() {
    const context = useContext(TrackingContext);
    if (!context) {
        throw new Error("useTrackListing must be used within a TrackingProvider");
    }
    return context;
}
