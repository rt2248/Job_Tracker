export const VISIT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
export const MIN_AWAY_TIME_MS = 8000; // 8 seconds
export const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getUserIdFromToken() {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || null;
    } catch {
        return null;
    }
}

export function getStorageKey(base, userId = null) {
    const id = userId || getUserIdFromToken();
    return id ? `evolexa:${id}:${base}` : `evolexa:${base}`;
}

export function getPendingVisits(userId = null) {
    try {
        const key = getStorageKey("pendingVisits", userId);
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const visits = JSON.parse(raw);
        return Array.isArray(visits) ? visits : [];
    } catch {
        return [];
    }
}

export function savePendingVisits(visits, userId = null) {
    try {
        const key = getStorageKey("pendingVisits", userId);
        localStorage.setItem(key, JSON.stringify(visits));
    } catch (err) {
        console.error("Failed to save pending visits:", err);
    }
}

export function clearPendingVisits(userId = null) {
    try {
        const key = getStorageKey("pendingVisits", userId);
        localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

export function recordExternalListingClick(listing) {
    if (!listing?.id) return;
    try {
        const userId = getUserIdFromToken();
        const visits = getPendingVisits(userId);
        const now = Date.now();

        // Prune visits older than 30 mins
        const validVisits = visits.filter((v) => now - v.clickedAt < VISIT_EXPIRY_MS);

        // Prepend current visit and cap at 3 recent to prevent unbounded memory
        const updated = [
            {
                listingId: listing.id,
                title: listing.title || "Untitled Role",
                company: listing.company || "",
                location: listing.location || "",
                link: listing.link || "",
                clickedAt: now,
            },
            ...validVisits.slice(0, 2),
        ];

        savePendingVisits(updated, userId);
    } catch (err) {
        console.error("Failed to record external visit:", err);
    }
}

export function getDismissals(userId = null) {
    try {
        const key = getStorageKey("promptDismissals", userId);
        const raw = localStorage.getItem(key);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export function recordDismissal(listingId, userId = null) {
    if (!listingId) return;
    try {
        const key = getStorageKey("promptDismissals", userId);
        const dismissals = getDismissals(userId);
        dismissals[listingId] = {
            lastDismissedAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(dismissals));
    } catch (err) {
        console.error("Failed to record dismissal:", err);
    }
}

export function getActiveClaim(userId = null) {
    try {
        const key = getStorageKey("activePromptClaim", userId);
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setActiveClaim(claim, userId = null) {
    try {
        const key = getStorageKey("activePromptClaim", userId);
        localStorage.setItem(key, JSON.stringify(claim));
    } catch {
        // ignore
    }
}

export function clearPromptStorageOnLogout() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("evolexa:")) {
                keysToRemove.push(key);
            }
        }
        for (const key of keysToRemove) {
            localStorage.removeItem(key);
        }
    } catch {
        // ignore
    }
}
