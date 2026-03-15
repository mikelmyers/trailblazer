import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let _authRateLimit: Ratelimit | null = null;

export function getAuthRateLimit() {
  if (!_authRateLimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    _authRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    });
  }
  return _authRateLimit;
}

/** @deprecated Use getAuthRateLimit() instead */
export const authRateLimit = new Proxy({} as Ratelimit, {
  get(_target, prop, receiver) {
    return Reflect.get(getAuthRateLimit(), prop, receiver);
  },
});
