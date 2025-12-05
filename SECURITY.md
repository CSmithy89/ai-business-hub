# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of HYVVE seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@hyvve.io**

If you don't receive a response within 48 hours, please follow up via email to ensure we received your original message.

### What to Include

Please include as much of the following information as possible:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 5 business days
- **Resolution Timeline:** Depends on severity
  - Critical: Within 7 days
  - High: Within 14 days
  - Medium: Within 30 days
  - Low: Within 90 days

### What to Expect

1. **Acknowledgment:** We will acknowledge receipt of your vulnerability report
2. **Communication:** We will keep you informed of the progress toward a fix
3. **Credit:** We will credit you in our security advisories (unless you prefer anonymity)
4. **Disclosure:** We will coordinate disclosure timing with you

## Security Measures

### Authentication

- Password hashing using bcrypt with appropriate cost factor
- Two-factor authentication (TOTP) support
- Rate limiting on authentication endpoints
- Session management with secure cookies
- OAuth 2.0 integration with major providers

### Data Protection

- AES-256-GCM encryption for sensitive data (API keys, credentials)
- TLS 1.3 for data in transit
- PostgreSQL Row-Level Security (RLS) for multi-tenant isolation
- Input validation and sanitization on all endpoints

### Infrastructure

- Environment variable validation on startup
- CSRF protection on state-changing operations
- Content Security Policy headers
- Secure HTTP headers (HSTS, X-Frame-Options, etc.)

## Known Security Considerations

### Production Deployment

Before deploying to production, ensure:

1. **Encryption Key:** `ENCRYPTION_MASTER_KEY` must be at least 32 characters with high entropy
2. **Rate Limiting:** Migrate from in-memory to Redis-based rate limiting
3. **Database:** Enable and test RLS policies
4. **Secrets:** Never commit secrets to version control
5. **HTTPS:** All production traffic must use HTTPS

### Environment Variables

The following environment variables contain sensitive data and must be protected:

- `DATABASE_URL` - Database connection string
- `BETTER_AUTH_SECRET` - Authentication secret
- `ENCRYPTION_MASTER_KEY` - Master encryption key
- `REDIS_URL` - Redis connection string
- AI provider API keys (Claude, OpenAI, etc.)

## Security Updates

Security updates are released as soon as possible after a vulnerability is confirmed. Subscribe to our GitHub releases to be notified of security updates.

## Bug Bounty

We currently do not have a formal bug bounty program. However, we deeply appreciate the security research community's efforts and will acknowledge responsible disclosures in our release notes.

## Contact

For security-related inquiries, contact: **security@hyvve.io**

For general inquiries, please open an issue on GitHub.
