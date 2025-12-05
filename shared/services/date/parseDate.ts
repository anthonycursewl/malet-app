export const parseDate = (date: string | Date): string => {
    const initialDate = new Date(date);
    const now = new Date();
    const diffMilliseconds = now.getTime() - initialDate.getTime();

    // Handle future dates (optional, current request implies past dates)
    if (diffMilliseconds < 0) {
        // For simplicity, we'll treat future dates as "just now" or similar,
        // or you could return "en X tiempo"
        return "en el futuro";
    }

    const diffSeconds = Math.floor(diffMilliseconds / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30.437); // Average days in a month
    const diffYears = Math.floor(diffDays / 365.25); // Average days in a year

    if (diffMinutes < 1) {
        return "hace un momento";
    } else if (diffMinutes < 60) {
        return `hace ${diffMinutes} minuto${diffMinutes === 1 ? '' : 's'}`;
    } else if (diffHours < 24) {
        return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
    } else if (diffDays < 7) {
        return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    } else if (diffWeeks < 4) { // Approximately less than a month
        return `hace ${diffWeeks} semana${diffWeeks === 1 ? '' : 's'}`;
    } else if (diffMonths < 12) {
        return `hace ${diffMonths} mes${diffMonths === 1 ? '' : 'es'}`;
    } else {
        return `hace ${diffYears} año${diffYears === 1 ? '' : 's'}`;
    }
};