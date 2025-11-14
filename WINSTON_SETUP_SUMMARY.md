# ✅ Winston Logger Setup - Complete

## 🎉 What's Been Installed

Winston logging has been successfully integrated into your e-commerce application with comprehensive file-based logging and automatic rotation.

---

## 📦 Packages Installed

```bash
✅ winston - Core logging library
✅ winston-daily-rotate-file - Automatic log rotation
```

---

## 📁 Files Created/Modified

### ✨ New Files Created

1. **`src/lib/logger.ts`** - Winston logger configuration
   - Daily log rotation
   - Multiple log transports (application, error, combined)
   - Exception & rejection handlers
   - Console logging in development
   - Structured JSON logging

2. **`LOGGING.md`** - Complete logging documentation
   - Features overview
   - Usage examples
   - Best practices
   - Monitoring guide

3. **`LOGGER_INTEGRATION_EXAMPLES.md`** - Code integration examples
   - Controllers
   - API routes
   - Services
   - Authentication
   - Webhooks
   - Database operations

4. **`LOGGER_QUICK_REFERENCE.md`** - Quick reference guide
   - Common patterns
   - Log levels
   - Viewing logs
   - Performance tips

### 🔄 Files Modified

1. **`.gitignore`** - Added `/logs` directory to ignore logs from git
2. **`README.md`** - Added logging section with quick start guide
3. **`src/app/api/shipmentwebhook/route.ts`** - Integrated Winston logging

---

## 🗂️ Log Files Structure

Your application will create these log files in the `/logs` directory:

```
logs/
├── application-2025-10-17.log      # All logs (14 days retention)
├── error-2025-10-17.log            # Errors only (30 days retention)
├── combined-2025-10-17.log         # Info and above (14 days)
├── exceptions-2025-10-17.log       # Uncaught exceptions (30 days)
└── rejections-2025-10-17.log       # Unhandled rejections (30 days)
```

Old logs are automatically:
- ✅ Rotated daily
- ✅ Compressed to `.gz` format
- ✅ Deleted after retention period
- ✅ Limited to 20MB per file

---

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import logger from '@/lib/logger';

// Info - Important events
logger.info('User registered', { userId: 123, email: 'user@example.com' });

// Warning - Potential issues
logger.warn('Low inventory', { productId: 456, stock: 2 });

// Error - Failures
logger.error('Payment failed', { orderId: 789, error });

// Debug - Detailed debugging
logger.debug('Processing order', { step: 1, data: {...} });

// HTTP - Request tracking
logger.http('POST /api/orders', { statusCode: 201, duration: '120ms' });
```

### 2. View Logs

```bash
# Real-time all logs
tail -f logs/application-*.log

# Errors only
tail -f logs/error-*.log

# Search logs
grep "userId: 123" logs/application-2025-10-17.log

# Count errors today
grep "ERROR" logs/application-$(date +%Y-%m-%d).log | wc -l
```

### 3. Environment Variables

Add to your `.env`:

```env
LOG_LEVEL=info          # error, warn, info, http, debug
NODE_ENV=production     # production, development
```

---

## ✅ Shipment Webhook Logging

Your shipment webhook (`/api/shipmentwebhook`) now logs:

### What's Being Logged:

1. **Webhook Receipt**
   - Headers (content-type, user-agent)
   - Timestamp

2. **Authorization**
   - Invalid API key attempts (with IP)
   - Security violations

3. **Payload Processing**
   - AWB number
   - Courier name
   - Status updates
   - Order IDs
   - Return shipments
   - Scan counts

4. **Database Operations**
   - Shipment lookups
   - Status updates (old → new)
   - Order item updates
   - Tracking entries created

5. **Errors & Warnings**
   - Shipments not found
   - Invalid status codes
   - JSON parsing errors
   - Processing failures

6. **Performance**
   - Request duration
   - Processing time

### Example Log Output:

```log
2025-10-17 12:30:45 [INFO]: Shiprocket webhook received {...}
2025-10-17 12:30:45 [INFO]: Webhook payload parsed {
  "awb": "ABC123456",
  "courierName": "BlueDart",
  "currentStatus": "In Transit",
  "orderId": "ORD-12345"
}
2025-10-17 12:30:45 [INFO]: Shipment found, updating status {
  "shipmentId": "ship-001",
  "awb": "ABC123456",
  "oldStatus": "Pending",
  "newStatus": "In Transit"
}
2025-10-17 12:30:45 [INFO]: Shipment webhook processed successfully {
  "shipmentId": "ship-001",
  "status": "In Transit",
  "duration": "45ms"
}
```

---

## 📊 Log Levels Hierarchy

```
error (0)   ❌ Always logged - Critical failures
  ↓
warn (1)    ⚠️  Warnings & anomalies
  ↓
info (2)    ℹ️  Important business events (DEFAULT)
  ↓
http (3)    🌐 HTTP requests/responses
  ↓
debug (4)   🐛 Detailed debugging info
```

Setting `LOG_LEVEL=debug` shows all levels.
Setting `LOG_LEVEL=error` shows only errors.

---

## 🎯 Next Steps - Integration Checklist

### Recommended Areas to Add Logging:

- [ ] **Payment Processing** (`/api/(razorpay)/verifyPayment/route.ts`)
  - Payment initiation
  - Payment verification
  - Razorpay responses
  - Payment failures

- [ ] **Order Management**
  - Order creation
  - Order updates
  - Order cancellations

- [ ] **User Authentication**
  - Login attempts
  - Registration
  - Password resets
  - Failed authentication

- [ ] **Product Operations**
  - Product creation/updates
  - Inventory changes
  - Bulk uploads

- [ ] **Seller Operations**
  - Seller registration
  - Product listings
  - Payout processing

- [ ] **External API Calls**
  - Shiprocket API calls
  - S3 uploads
  - Email sending

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| `LOGGING.md` | Complete logging guide with features, usage, and best practices |
| `LOGGER_INTEGRATION_EXAMPLES.md` | Real code examples for all modules |
| `LOGGER_QUICK_REFERENCE.md` | Quick reference card for developers |
| `README.md` | Quick start guide in main README |

---

## 🔧 Configuration

Located in `src/lib/logger.ts`:

```typescript
// Customize retention
maxFiles: '14d'  // Change to '30d', '60d', etc.

// Customize file size
maxSize: '20m'   // Change to '50m', '100m', etc.

// Customize log format
// Edit customFormat and consoleFormat functions
```

---

## 🎨 Features Overview

| Feature | Status | Description |
|---------|--------|-------------|
| Daily Rotation | ✅ | Logs rotate automatically at midnight |
| Compression | ✅ | Old logs compressed to .gz |
| Auto-cleanup | ✅ | Logs deleted after retention period |
| Separate Error Logs | ✅ | Errors in dedicated files |
| Console in Dev | ✅ | Colored console output in development |
| File in Prod | ✅ | File logging in production |
| Exception Handling | ✅ | Uncaught exceptions logged |
| Promise Rejections | ✅ | Unhandled rejections logged |
| Structured Logging | ✅ | JSON format with metadata |
| Performance Tracking | ✅ | Duration logging built-in |

---

## 🚨 Important Notes

1. **Logs are in `.gitignore`** - They won't be committed to git
2. **Development mode** - Logs appear in console AND files
3. **Production mode** - Logs only in files (no console)
4. **Sensitive data** - Never log passwords, tokens, or PII
5. **Performance** - Logging is async and won't block requests

---

## 🐛 Troubleshooting

### Logs not appearing?
```bash
# Check logs directory exists
ls -la logs/

# Check permissions
chmod -R 755 logs/

# Run with debug level
LOG_LEVEL=debug npm run dev
```

### Too many logs?
```env
# Set higher log level (less verbose)
LOG_LEVEL=warn  # or LOG_LEVEL=error
```

### Old logs not deleting?
```typescript
// Check retention settings in src/lib/logger.ts
maxFiles: '14d'  // Increase if needed
```

---

## ✨ Success!

Your Winston logger is now fully configured and ready to use! 

Start logging important events in your application to improve debugging, monitoring, and analytics.

**Happy Logging! 🎉**

