# Public registration email verification

Public event registration requires a verified attendee email before a submission, guest or check-in QR is created. The first email field is the attendee address and is always required and editable in the public form. Forms without an email field receive a required email field automatically. Existing registrations are unchanged.

Attendees request a six-digit code and verify it on the form. Codes expire after 10 minutes, allow five guesses and can be resent after 60 seconds. Requests also use the distributed rate limiter. Verification expires after 20 minutes and is bound to the exact normalized email and event. Changing the email requires another verification.

Submission consumes verification in the same MongoDB transaction as registration and QR creation. A retry with the same idempotency key is allowed; another registration cannot reuse the proof. The submission records `emailVerifiedAt`. MongoDB automatically removes expired verification records with a TTL index; expiration is also checked on every request.

No new environment variables are required. This uses the existing SMTP settings, authentication secret, job encryption key, MongoDB and email worker. Verification codes in queued emails are encrypted; challenge records store a keyed code hash and a hash of the verification proof. No code or proof is returned from the request-code endpoint.

Each registration now sends a verification email, plus the existing pass email when approved. Ensure the configured email provider has capacity for both. A code verifies mailbox access; it does not establish an attendee's legal identity.

Tests use an isolated MongoDB, browser and local SMTP inbox. They cover delivery, expiry, guessing limits, cooldown, email/event binding, proof replay, safe submission retries and public form submission.
