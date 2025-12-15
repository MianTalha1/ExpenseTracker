/**
 * User Types
 * Shared user-related type definitions
 */
export interface User {
    id: number;
    email: string;
    name: string | null;
    createdAt: string;
}
export interface CreateUserRequest {
    email: string;
    password: string;
    name?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    accessToken: string;
    user: User;
}
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
//# sourceMappingURL=user.d.ts.map