/**
 * Repositories - Barrel Export
 * API access layer (minimal - most data via Firestore)
 */

export { insightsRepository } from './InsightsRepository';
export { chatRepository } from './ChatRepository';

// Re-export base for extension
export { BaseRepository } from './BaseRepository';
export { ApiError } from '../client';
