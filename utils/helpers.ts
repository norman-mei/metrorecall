export const readLocalNumber = (key: string, fallback: number) => {
    if (typeof window === 'undefined') return fallback;
    try {
        const val = window.localStorage.getItem(key);
        const num = val !== null ? Number(val) : NaN;
        return Number.isFinite(num) ? num : fallback;
    } catch {
        return fallback;
    }
};

export const persistLocalNumber = (key: string, value: number) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, String(value));
    } catch {
        // ignore
    }
};
