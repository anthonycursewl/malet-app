interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export const createRateLimiter = (config: RateLimitConfig) => {
    return (key: string): boolean => {
        const now = Date.now();
        const limit = rateLimits.get(key);

        if (!limit || now > limit.resetTime) {
            rateLimits.set(key, { count: 1, resetTime: now + config.windowMs });
            return true;
        }

        if (limit.count >= config.maxRequests) {
            return false;
        }

        limit.count++;
        return true;
    };
};

export const authRateLimiter = createRateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000,
});

export const apiRateLimiter = createRateLimiter({
    maxRequests: 30,
    windowMs: 60 * 1000,
});