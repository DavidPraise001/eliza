import crypto from 'crypto';
import { ContentType, Platform } from '../types';

/**
 * Generate a unique ID using crypto
 */
export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate a Sei wallet address
 */
export function isValidSeiAddress(address: string): boolean {
  return address.startsWith('sei1') && address.length === 43;
}

/**
 * Format SEI amount for display
 */
export function formatSeiAmount(amount: number): string {
  return `${amount.toFixed(2)} SEI`;
}

/**
 * Calculate time remaining until deadline
 */
export function getTimeRemaining(deadline: Date): string {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}

/**
 * Extract emojis from text
 */
export function extractEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  return text.match(emojiRegex) || [];
}

/**
 * Clean and normalize text for analysis
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format platform name for display
 */
export function formatPlatformName(platform: Platform): string {
  switch (platform) {
    case Platform.DISCORD:
      return 'Discord';
    case Platform.TELEGRAM:
      return 'Telegram';
    case Platform.TWITTER:
      return 'Twitter';
    default:
      return platform;
  }
}

/**
 * Get content type icon
 */
export function getContentTypeIcon(contentType: ContentType): string {
  switch (contentType) {
    case ContentType.ART:
      return '🎨';
    case ContentType.MEME:
      return '😂';
    case ContentType.TEXT:
      return '💬';
    case ContentType.LINK:
      return '🔗';
    case ContentType.VIDEO:
      return '🎥';
    default:
      return '📄';
  }
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Generate a hash from string
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString();
}

/**
 * Get random element from array
 */
export function getRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    // Cleanup old entries
    if (Math.random() < 0.1) { // 10% chance to cleanup
      this.cleanup(windowStart);
    }
    
    return true;
  }
  
  private cleanup(cutoff: number): void {
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > cutoff);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

/**
 * Simple cache implementation
 */
export class SimpleCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  
  constructor(private defaultTtl: number = 5 * 60 * 1000) {} // 5 minutes default
  
  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTtl);
    this.cache.set(key, { value, expiry });
  }
  
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    this.cleanup();
    return this.cache.size;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}