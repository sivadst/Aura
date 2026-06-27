import { Redis } from "@upstash/redis";

// Fallback in-memory store for dev if redis is not configured
const memoryStore = new Map<string, any>();

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export interface UserPresence {
  userId: string;
  status: "online" | "away" | "busy" | "offline";
  currentView?: string;
  lastActivity: number;
  socketId?: string;
}

export class PresenceManager {
  private static getKey(organizationId: string, userId: string) {
    return `presence:${organizationId}:${userId}`;
  }

  static async setStatus(
    organizationId: string,
    userId: string,
    status: UserPresence["status"],
    currentView?: string,
    socketId?: string
  ) {
    const presence: UserPresence = {
      userId,
      status,
      currentView,
      lastActivity: Date.now(),
      socketId,
    };

    if (redis) {
      await redis.set(this.getKey(organizationId, userId), presence, { ex: 300 }); // expire in 5 mins
    } else {
      memoryStore.set(this.getKey(organizationId, userId), presence);
    }
  }

  static async setOnline(organizationId: string, userId: string, socketId?: string, currentView?: string) {
    return this.setStatus(organizationId, userId, "online", currentView, socketId);
  }

  static async setAway(organizationId: string, userId: string) {
    return this.setStatus(organizationId, userId, "away");
  }

  static async setBusy(organizationId: string, userId: string) {
    return this.setStatus(organizationId, userId, "busy");
  }

  static async setOffline(organizationId: string, userId: string) {
    if (redis) {
      await redis.del(this.getKey(organizationId, userId));
    } else {
      memoryStore.delete(this.getKey(organizationId, userId));
    }
  }

  static async getOnlineUsers(organizationId: string): Promise<UserPresence[]> {
    if (redis) {
      const keys = await redis.keys(`presence:${organizationId}:*`);
      if (keys.length === 0) return [];
      const users = await redis.mget(...keys);
      return users.filter(Boolean) as UserPresence[];
    } else {
      const prefix = `presence:${organizationId}:`;
      const users: UserPresence[] = [];
      for (const [key, value] of Array.from(memoryStore.entries())) {
        if (key.startsWith(prefix)) {
          // Check expiration manually for memory store (5 mins)
          if (Date.now() - value.lastActivity > 300000) {
            memoryStore.delete(key);
          } else {
            users.push(value);
          }
        }
      }
      return users;
    }
  }

  static async broadcastPresence(organizationId: string, event: any) {
    // In a full implementation, this would publish to a Redis Pub/Sub channel
    // and a WebSocket/SSE server would fan out to connected clients.
    // For this app, we rely on the SSE endpoint polling or subscribing.
  }
}
