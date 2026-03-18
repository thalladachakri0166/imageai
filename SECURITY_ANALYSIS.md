# Security Analysis & Recommendations for Image Generation Module

## Executive Summary
The current application has minimal security checks and safety validations for image generation. Critical gaps exist in input validation, output filtering, rate limiting, and content moderation. This document outlines current security measures and recommended improvements.

---

## 1. CURRENT SECURITY MEASURES

### 1.1 Frontend Image Upload ([ImageUploader.tsx](src/components/ImageUploader.tsx))
**File Type Validation (Basic):**
- ✅ Accepts only `image/jpeg` and `image/png`
- ✅ Max size display: 10MB (client-side hint only)
- ❌ **No actual file size validation on upload**
- ❌ **No file integrity checks**

```typescript
// Current validation (line 21-24)
if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
  const preview = URL.createObjectURL(file);
  onImageSelect(file, preview);
}
```

### 1.2 Reference Image Upload ([ReferenceImageUpload.tsx](src/components/ReferenceImageUpload.tsx))
**URL Validation (Minimal):**
- ✅ Basic URL format validation with `new URL()`
- ❌ **No URL origin/whitelist validation**
- ❌ **No SSL/TLS enforcement**
- ❌ **No timeout for loading external images**

```typescript
// Current validation (line 84-87)
try {
  new URL(urlInput); // Only checks valid URL format
  // No further security checks
}
```

### 1.3 Prompt Input ([PromptInput.tsx](src/components/PromptInput.tsx))
**Current State:**
- ❌ **No input sanitization**
- ❌ **No prompt injection prevention**
- ❌ **No character limit enforcement**
- ❌ **No harmful content filtering**

### 1.4 Backend Image Generation ([supabase/functions/generate-image/index.ts](supabase/functions/generate-image/index.ts))

**Safety Features Present:**
1. ✅ **Safety Filter Detection** (line 182-191):
   - Detects `IMAGE_SAFETY` and `SAFETY` finish reasons from AI
   - Returns user-friendly error message
   
   ```typescript
   if (finishReason === "IMAGE_SAFETY" || finishReason === "SAFETY") {
     return new Response(JSON.stringify({
       error: "Generation unsuccessful. Please try again or rephrase your prompt.",
       code: "RETRY",
     }), ...);
   }
   ```

2. ✅ **CORS Headers** (line 3-5):
   - Defined CORS policy (though wide open)
   
3. ✅ **Error Handling** (line 138-180):
   - Handles rate limiting (429)
   - Handles quota/billing (402)
   - Graceful error responses

4. ✅ **API Key Protection** (line 28-31):
   - API key stored in environment variables
   - Validates key exists

**Critical Missing Features:**
- ❌ **No JWT authentication** (`verify_jwt = false` in [supabase/config.toml](supabase/config.toml))
- ❌ **No input validation** on received data
- ❌ **No file size validation**
- ❌ **No prompt content validation**
- ❌ **No rate limiting per user**
- ❌ **No logging of generation requests**
- ❌ **No image content verification**
- ❌ **Overly permissive CORS** (`Access-Control-Allow-Origin: '*'`)

### 1.5 Frontend Request ([src/pages/Index.tsx](src/pages/Index.tsx))
**Current State:**
- ✅ Base64 encoding of images for transmission
- ❌ **No request validation before sending**
- ❌ **No maximum payload size check**
- ❌ **No retry logic with exponential backoff**

---

## 2. IDENTIFIED SECURITY GAPS

### Critical Issues (Priority: HIGH)
1. **No Authentication/Authorization**
   - Function has `verify_jwt = false`
   - Anyone can call the endpoint
   - No user identification or rate limiting per user

2. **Insufficient Input Validation**
   - No validation of `originalImage` format/size
   - No validation of `prompt` content/length
   - No validation of `selectedOptions` whitelist
   - No validation of `referenceImages` array length/format

3. **Overly Permissive CORS**
   - `Access-Control-Allow-Origin: '*'` allows any website
   - Should restrict to specific origin(s)

4. **Prompt Injection Risk**
   - Prompts are directly passed to AI without sanitization
   - System prompt can be overridden
   - No validation of prompt structure

### Medium Issues (Priority: MEDIUM)
1. **No Rate Limiting**
   - Users can spam generation requests
   - No per-user quota tracking
   - Vulnerable to DDoS/abuse

2. **No Request Logging**
   - No audit trail of who generated what
   - Can't track abuse patterns
   - No security incident investigation capability

3. **Large File Handling**
   - No server-side file size validation
   - Base64 encoding increases payload by 33%
   - Potential memory issues with large images

4. **No Content Moderation Output**
   - Only catches AI's safety filter rejection
   - Generated images not scanned for harmful content
   - No NSFW detection on outputs

5. **Reference Image Security**
   - External URLs loaded without validation
   - Could be SSRF vulnerability
   - No image integrity verification

### Low Issues (Priority: LOW)
1. **Missing Security Headers**
   - No `Content-Security-Policy`
   - No `X-Content-Type-Options: nosniff`
   - No `X-Frame-Options`

2. **Incomplete Error Messages**
   - While user-friendly, may leak system info in development

3. **No Image Metadata Stripping**
   - EXIF data not removed (privacy concern)
   - Could contain location/device info

---

## 3. RECOMMENDED SECURITY IMPLEMENTATIONS

### Phase 1: Critical (Implement First)

#### 3.1 Enable JWT Authentication
**File:** `supabase/config.toml`
```toml
[functions.generate-image]
verify_jwt = true  # Enable JWT verification
```

**Update Function to Check Auth:**
```typescript
// Add at start of handler
const token = req.headers.get('authorization')?.split('Bearer ')[1];
if (!token) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

#### 3.2 Input Validation Module
**Create new file:** `supabase/functions/generate-image/validators.ts`
```typescript
interface ValidationError {
  field: string;
  message: string;
}

export function validateGenerationRequest(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate originalImage
  if (!body.originalImage) {
    errors.push({ field: 'originalImage', message: 'Image is required' });
  } else if (!isValidBase64Image(body.originalImage)) {
    errors.push({ field: 'originalImage', message: 'Invalid image format' });
  } else if (getBase64Size(body.originalImage) > 25 * 1024 * 1024) { // 25MB limit
    errors.push({ field: 'originalImage', message: 'Image too large (max 25MB)' });
  }

  // Validate prompt
  if (body.prompt && typeof body.prompt !== 'string') {
    errors.push({ field: 'prompt', message: 'Prompt must be a string' });
  } else if (body.prompt && body.prompt.length > 2000) {
    errors.push({ field: 'prompt', message: 'Prompt too long (max 2000 chars)' });
  }

  // Validate selectedOptions
  const validOptions = ['shirt', 'pants', 'shoes', 'hairstyle', 'full-outfit'];
  if (!Array.isArray(body.selectedOptions) || body.selectedOptions.length === 0) {
    errors.push({ field: 'selectedOptions', message: 'At least one option required' });
  } else {
    const invalid = body.selectedOptions.filter((opt: string) => !validOptions.includes(opt));
    if (invalid.length > 0) {
      errors.push({ field: 'selectedOptions', message: `Invalid options: ${invalid.join(', ')}` });
    }
  }

  // Validate referenceImages
  if (!Array.isArray(body.referenceImages)) {
    errors.push({ field: 'referenceImages', message: 'Reference images must be an array' });
  } else if (body.referenceImages.length > 4) {
    errors.push({ field: 'referenceImages', message: 'Max 4 reference images allowed' });
  }

  // Validate style
  const validStyles = ['casual', 'formal', 'vintage', 'modern', 'streetwear'];
  if (body.style && !validStyles.includes(body.style)) {
    errors.push({ field: 'style', message: `Invalid style. Must be one of: ${validStyles.join(', ')}` });
  }

  return errors;
}

function isValidBase64Image(str: string): boolean {
  try {
    const base64Regex = /^data:image\/(jpeg|png);base64,/;
    return base64Regex.test(str);
  } catch {
    return false;
  }
}

function getBase64Size(str: string): number {
  return Math.ceil((str.length * 3) / 4);
}
```

#### 3.3 Restrict CORS
**Update Function:**
```typescript
// Replace permissive CORS with restricted version
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'http://localhost:5173', // Dev only
];

const origin = req.headers.get('origin') || '';
const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};
```

#### 3.4 Implement Rate Limiting
**Create new file:** `supabase/functions/generate-image/rate-limiter.ts`
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.90.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || ''
);

const RATE_LIMIT = {
  requests_per_hour: 10,
  requests_per_day: 50,
};

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    const { count } = await supabase
      .from('generation_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', hourAgo.toISOString());

    const requestsThisHour = count || 0;
    const remaining = Math.max(0, RATE_LIMIT.requests_per_hour - requestsThisHour);

    return {
      allowed: requestsThisHour < RATE_LIMIT.requests_per_hour,
      remaining,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: RATE_LIMIT.requests_per_hour };
  }
}

export async function logGenerationRequest(
  userId: string,
  prompt: string,
  options: string[],
  success: boolean,
  errorCode?: string
): Promise<void> {
  try {
    await supabase.from('generation_requests').insert({
      user_id: userId,
      prompt: prompt.substring(0, 500), // Truncate
      options: options,
      success,
      error_code: errorCode,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log generation request:', error);
  }
}
```

#### 3.5 Database Schema for Rate Limiting
**Create SQL Migration:**
```sql
-- Migration: create_generation_requests_table
create table if not exists generation_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users,
  prompt text,
  options text[] not null,
  success boolean default false,
  error_code text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_generation_requests_user_id_created_at 
on generation_requests(user_id, created_at desc);

create index if not exists idx_generation_requests_success 
on generation_requests(success);
```

### Phase 2: Medium Priority (Implement Next)

#### 3.6 Prompt Injection Prevention
**Create:** `supabase/functions/generate-image/prompt-safety.ts`
```typescript
const BLOCKED_PATTERNS = [
  /ignore previous instructions/gi,
  /system prompt/gi,
  /disregard above/gi,
  /forget the instructions/gi,
];

const BLOCKED_KEYWORDS = [
  'jailbreak',
  'override',
  'bypass',
  'hack',
  'exploit',
];

export function sanitizePrompt(prompt: string): { safe: boolean; reason?: string } {
  // Check for injection patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return { safe: false, reason: 'Invalid prompt pattern detected' };
    }
  }

  // Check for blocked keywords
  const lowerPrompt = prompt.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerPrompt.includes(keyword)) {
      return { safe: false, reason: 'Unsafe content in prompt' };
    }
  }

  // Check for excessive length
  if (prompt.length > 2000) {
    return { safe: false, reason: 'Prompt too long' };
  }

  return { safe: true };
}
```

#### 3.7 Frontend Input Validation Enhancement
**Update:** `src/components/ImageUploader.tsx`
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return { valid: false, error: 'Only JPG and PNG images are supported' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size must be less than 10MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)` };
  }

  // Validate image dimensions (optional)
  return { valid: true };
};
```

#### 3.8 Reference Image URL Validation
**Update:** `src/components/ReferenceImageUpload.tsx`
```typescript
const validateImageUrl = (urlString: string): { valid: boolean; error?: string } => {
  try {
    const url = new URL(urlString);
    
    // Only allow https
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }

    // Block local/internal IPs
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return { valid: false, error: 'Local URLs are not permitted' };
    }

    // Whitelist common image services
    const whitelistedDomains = [
      'pinterest.com',
      'unsplash.com',
      'pexels.com',
      'pixabay.com',
      'images.pexels.com',
      'images.unsplash.com',
      // Add your trusted domains
    ];

    const isWhitelisted = whitelistedDomains.some(domain => hostname.endsWith(domain));
    if (!isWhitelisted && process.env.NODE_ENV === 'production') {
      return { valid: false, error: 'Image URL from untrusted source' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};
```

#### 3.9 Security Headers
**Add to Supabase Function Response:**
```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

### Phase 3: Enhancement (Nice to Have)

#### 3.10 EXIF Data Stripping
```typescript
// Client-side: Strip EXIF before upload
import exifParser from 'exif-parser'; // or similar library

const stripExif = async (file: File): Promise<Blob> => {
  const buffer = await file.arrayBuffer();
  // Strip EXIF data here
  return new Blob([buffer], { type: file.type });
};
```

#### 3.11 Content Moderation on Output
```typescript
// Use a moderation API to scan generated images
const checkImageSafety = async (imageUrl: string): Promise<boolean> => {
  // Call moderation service (e.g., AWS Rekognition, Google Vision, OpenAI Moderation)
  return true; // Implement based on chosen service
};
```

#### 3.12 Request/Response Logging
```typescript
export async function logApiCall(
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  metadata?: any
): Promise<void> {
  console.log({
    timestamp: new Date().toISOString(),
    userId,
    endpoint,
    method,
    statusCode,
    durationMs: duration,
    metadata,
  });
}
```

---

## 4. SECURITY CHECKLIST

- [ ] Enable JWT authentication in `supabase/config.toml`
- [ ] Implement input validation for all request fields
- [ ] Restrict CORS to specific origins
- [ ] Add rate limiting per user (database schema + middleware)
- [ ] Sanitize prompt input for injection attempts
- [ ] Add file size validation (frontend + backend)
- [ ] Validate reference image URLs (whitelist approach)
- [ ] Add security headers to responses
- [ ] Implement request/response logging
- [ ] Add EXIF data stripping
- [ ] Implement output content moderation
- [ ] Add CSP headers to frontend (HTML)
- [ ] Regular security audits
- [ ] Monitor rate limit patterns for abuse

---

## 5. ENVIRONMENT VARIABLES NEEDED

```env
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Backend (Supabase Secrets)
LOVABLE_API_KEY=your_api_key
MODERATION_API_KEY=optional_moderation_service_key
```

---

## 6. TESTING RECOMMENDATIONS

1. **Input Fuzzing**: Test with malformed inputs, SQL injection patterns, XSS payloads
2. **Load Testing**: Test rate limiting under high request volume
3. **Security Scanning**: Use OWASP ZAP or Burp Suite
4. **Dependency Scanning**: Use `npm audit`, `snyk`, or similar
5. **Penetration Testing**: Professional security testing

---

## 7. DEPLOYMENT CHECKLIST

- [ ] All validation rules tested
- [ ] Rate limiting tables created in database
- [ ] JWT verification enabled
- [ ] CORS origins configured for production domain
- [ ] Security headers configured
- [ ] Logging enabled
- [ ] Monitoring alerts configured
- [ ] Backup and disaster recovery plan in place

---

## Summary of Risk Levels

| Issue | Risk | Effort | Priority |
|-------|------|--------|----------|
| No Authentication | CRITICAL | Low | 1 |
| Missing Input Validation | CRITICAL | Medium | 2 |
| Open CORS | HIGH | Low | 3 |
| No Rate Limiting | HIGH | Medium | 4 |
| Prompt Injection | HIGH | Medium | 5 |
| No Logging | MEDIUM | Low | 6 |
| No Output Moderation | MEDIUM | High | 7 |
| Missing Security Headers | LOW | Low | 8 |

