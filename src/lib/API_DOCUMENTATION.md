/\*\*

- BACKEND API ROUTES DOCUMENTATION
-
- All endpoints return consistent JSON format:
- {
-     success: boolean,
-     data?: T,
-     error?: { message, code, details }
- }
-
- IMPLEMENTATION NOTES:
-   - All passwords hashed with bcrypt (12 rounds)
-   - Access token: JWT, 15 minute expiry
-   - Refresh token: Stored in HTTP-only cookie, 7 day expiry
-   - Rate limiting: 5 login attempts per minute per IP
-   - Email verification: Required before account activation
      \*/

/\*\*

- POST /api/auth/register
-
- Create new user account
-
- Request:
- {
-     email: "user@example.com",
-     password: "SecurePass123!",
-     name: "John Doe"
- }
-
- Response (201):
- {
-     success: true,
-     data: {
-         id: "uuid",
-         email: "user@example.com",
-         name: "John Doe",
-         emailVerified: false,
-         createdAt: "2024-02-10T12:00:00Z"
-     }
- }
-
- Errors:
-   - 409: Email already registered
-   - 400: Invalid email/password format
-   - 429: Too many registration attempts
-
- Server Implementation:
-   1. Validate email format
-   2. Check email not already registered
-   3. Hash password with bcrypt
-   4. Create user record
-   5. Generate email verification token
-   6. Send verification email
-   7. Return user (without password hash)
       \*/

/\*\*

- POST /api/auth/login
-
- Authenticate user and issue tokens
-
- Request:
- {
-     email: "user@example.com",
-     password: "SecurePass123!"
- }
-
- Response (200):
- {
-     success: true,
-     data: {
-         accessToken: "eyJhbGc...",
-         user: {
-             id: "uuid",
-             email: "user@example.com",
-             name: "John Doe",
-             role: "user"
-         }
-     },
-     // Refresh token in HTTP-only cookie
- }
-
- Errors:
-   - 401: Invalid credentials
-   - 403: Email not verified
-   - 429: Too many login attempts
-
- Server Implementation:
-   1. Validate rate limit (5 per minute per IP)
-   2. Find user by email
-   3. Verify password with bcrypt
-   4. Check email verified
-   5. Generate access token (15min expiry)
-   6. Generate and store refresh token (7d expiry)
-   7. Set refresh token in HTTP-only cookie
-   8. Return access token + user
       \*/

/\*\*

- POST /api/auth/logout
-
- Logout user and invalidate refresh token
-
- Request:
- Headers:
-   - Authorization: Bearer {accessToken}
-
- Response (200):
- { success: true }
-
- Server Implementation:
-   1. Verify access token
-   2. Delete refresh token from database
-   3. Clear refresh token cookie
-   4. Return success
       \*/

/\*\*

- POST /api/auth/refresh
-
- Get new access token using refresh token
-
- Request:
- Cookies:
-   - refreshToken (HTTP-only)
-
- Response (200):
- {
-     success: true,
-     data: {
-         accessToken: "eyJhbGc..."
-     }
- }
-
- Errors:
-   - 401: No refresh token
-   - 401: Invalid or expired refresh token
-
- Server Implementation:
-   1. Extract refresh token from cookie
-   2. Verify it's valid in database
-   3. Check expiration
-   4. Issue new access token
-   5. Optionally rotate refresh token
-   6. Return new access token
       \*/

/\*\*

- POST /api/auth/forgot-password
-
- Request password reset email
-
- Request:
- {
-     email: "user@example.com"
- }
-
- Response (200):
- {
-     success: true,
-     message: "If account exists, reset link sent"
- }
-
- Note: Always returns 200 to prevent user enumeration
-
- Server Implementation:
-   1. Find user by email (don't disclose if not found)
-   2. Generate reset token (1 hour expiry)
-   3. Store token hash in database
-   4. Send reset email with link
-   5. Return generic success
       \*/

/\*\*

- POST /api/auth/reset-password
-
- Reset password using token from email
-
- Request:
- {
-     token: "reset-token-from-email",
-     password: "NewSecurePass123!"
- }
-
- Response (200):
- {
-     success: true,
-     message: "Password reset successfully"
- }
-
- Errors:
-   - 400: Invalid or expired token
-   - 400: Password too weak
-
- Server Implementation:
-   1. Verify token exists in database
-   2. Check token not expired (1 hour)
-   3. Validate new password
-   4. Hash password with bcrypt
-   5. Update user password
-   6. Delete used token
-   7. Invalidate all existing refresh tokens (force re-login)
-   8. Return success
       \*/

/\*\*

- GET /api/auth/verify-email
-
- Verify email address using token
-
- Query Parameters:
-   - token: email verification token
-
- Response (200):
- {
-     success: true,
-     message: "Email verified successfully"
- }
-
- Errors:
-   - 400: Invalid or expired token
-   - 409: Email already verified
-
- Server Implementation:
-   1. Find verification token in database
-   2. Check token not expired (24 hours)
-   3. Update user.emailVerified = true
-   4. Delete used token
-   5. Return success
       \*/

/\*\*

- POST /api/auth/resend-verification
-
- Resend verification email
-
- Request:
- {
-     email: "user@example.com"
- }
-
- Response (200):
- {
-     success: true,
-     message: "Verification email sent"
- }
-
- Server Implementation:
-   1. Find user by email
-   2. Check not already verified
-   3. Generate new verification token
-   4. Send verification email
-   5. Return success
       \*/

/\*\*

- GET /api/me
-
- Get current authenticated user
-
- Request:
- Headers:
-   - Authorization: Bearer {accessToken}
-
- Response (200):
- {
-     success: true,
-     data: {
-         id: "uuid",
-         email: "user@example.com",
-         name: "John Doe",
-         role: "user",
-         emailVerified: true,
-         createdAt: "2024-02-10T12:00:00Z"
-     }
- }
-
- Errors:
-   - 401: Unauthorized (no token or invalid token)
-
- Server Implementation:
-   1. Extract and verify access token
-   2. Get user from database
-   3. Return user info (no password)
       \*/

/\*\*

- DATABASE SCHEMA
-
- User Table:
-   - id (uuid, primary key)
-   - email (varchar, unique, indexed)
-   - passwordHash (varchar)
-   - name (varchar)
-   - role (enum: user/admin, default: user)
-   - emailVerified (boolean, default: false)
-   - lastLoginAt (timestamp, nullable)
-   - createdAt (timestamp)
-   - updatedAt (timestamp)
-
- RefreshToken Table:
-   - id (uuid, primary key)
-   - userId (uuid, foreign key to User.id)
-   - tokenHash (varchar, indexed)
-   - expiresAt (timestamp)
-   - revokedAt (timestamp, nullable)
-   - createdAt (timestamp)
-
- VerificationToken Table:
-   - id (uuid, primary key)
-   - userId (uuid, foreign key to User.id)
-   - tokenHash (varchar)
-   - type (enum: email_verification/password_reset)
-   - expiresAt (timestamp)
-   - usedAt (timestamp, nullable)
-   - createdAt (timestamp)
      \*/

/\*\*

- ERROR CODES
-
- Authentication Errors:
-   - INVALID_CREDENTIALS: Email/password don't match
-   - EMAIL_NOT_VERIFIED: Email verification required
-   - UNAUTHORIZED: No token or invalid token
-   - TOKEN_EXPIRED: Token has expired
-
- Validation Errors:
-   - INVALID_EMAIL: Email format invalid
-   - WEAK_PASSWORD: Password doesn't meet requirements
-   - EMAIL_REQUIRED: Email is required
-   - PASSWORD_REQUIRED: Password is required
-
- Business Logic Errors:
-   - EMAIL_ALREADY_REGISTERED: Email in use
-   - USER_NOT_FOUND: User doesn't exist
-   - INVALID_TOKEN: Token is invalid or expired
-
- Rate Limiting:
-   - TOO_MANY_ATTEMPTS: Rate limit exceeded
-
- Server Errors:
-   - INTERNAL_SERVER_ERROR: Server error
      \*/

/\*\*

- MIDDLEWARE REQUIREMENTS
-
- Authentication Middleware:
-   - Extract token from Authorization header
-   - Verify token signature
-   - Check expiration
-   - Attach user to request
-   - Return 401 if invalid
-
- Rate Limiting Middleware:
-   - Track attempts per IP + endpoint
-   - Return 429 if exceeded
-
- CSRF Protection:
-   - Use SameSite cookies
-   - Validate origin header
      \*/

export const AUTH_API_DOCUMENTATION = true;
