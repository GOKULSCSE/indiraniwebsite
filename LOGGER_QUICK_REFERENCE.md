# Winston Logger - Quick Reference

## Import

```typescript
import logger from '@/lib/logger';
```

## Basic Usage

```typescript
// ℹ️ Info - Important events
logger.info('User registered', { userId: 123, email: 'user@example.com' });

// ⚠️ Warning - Potential issues
logger.warn('Low stock alert', { productId: 456, remaining: 5 });

// ❌ Error - Failures
logger.error('Payment failed', { orderId: 789, error });

// 🐛 Debug - Detailed info (only when LOG_LEVEL=debug)
logger.debug('Processing data', { step: 1, data: {...} });

// 🌐 HTTP - Request/Response
logger.http('POST /api/orders', { statusCode: 201, duration: '120ms' });
```

## Common Patterns

### API Routes
```typescript
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    logger.info('Creating order', { userId: body.userId });
    const result = await createOrder(body);
    logger.info('Order created', { 
      orderId: result.id, 
      duration: `${Date.now() - startTime}ms` 
    });
    return Response.json(result);
  } catch (error) {
    logger.error('Order creation failed', { userId: body.userId, error });
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Services
```typescript
async processPayment(orderId: string, amount: number) {
  logger.info('Processing payment', { orderId, amount });
  try {
    const result = await razorpay.create({ amount });
    logger.info('Payment successful', { orderId, paymentId: result.id });
    return result;
  } catch (error) {
    logger.error('Payment failed', { orderId, amount, error });
    throw error;
  }
}
```

### Authentication
```typescript
async login(email: string, password: string) {
  logger.info('Login attempt', { email });
  
  const user = await findUser(email);
  if (!user) {
    logger.warn('Login failed - user not found', { email });
    throw new Error('Invalid credentials');
  }
  
  logger.info('Login successful', { userId: user.id, email });
  return user;
}
```

### Error Handling
```typescript
// Simple error
logger.error('Database query failed', new Error('Connection timeout'));

// Error with context
logger.error('Failed to update user', {
  userId: 123,
  error: error instanceof Error ? error.message : error,
  stack: error instanceof Error ? error.stack : undefined
});
```

## Log Levels (Hierarchy)

```
error (0)   ❌ Always logged - Failures
  ↓
warn (1)    ⚠️  Warnings & potential issues
  ↓
info (2)    ℹ️  Important business events (default)
  ↓
http (3)    🌐 HTTP requests/responses
  ↓
debug (4)   🐛 Detailed debugging info
```

Set with `LOG_LEVEL` env variable. Example: `LOG_LEVEL=debug` shows all levels.

## What to Log

### ✅ DO Log
- User authentication (login/logout/register)
- Payments & transactions
- Order creation/updates
- External API calls
- File uploads
- Database errors
- Performance metrics (duration)
- Important state changes
- Security events

### ❌ DON'T Log
- Passwords
- API keys / tokens
- Credit card numbers
- Personal Identifiable Information (PII)
- Full request/response bodies in production

## Log Files

```bash
logs/
├── application-2025-10-17.log      # All logs
├── error-2025-10-17.log            # Errors only
├── combined-2025-10-17.log         # Info and above
├── exceptions-2025-10-17.log       # Uncaught exceptions
└── rejections-2025-10-17.log       # Promise rejections
```

Old logs are auto-compressed (`.gz`) and deleted after retention period.

## Viewing Logs

```bash
# Real-time all logs
tail -f logs/application-*.log

# Real-time errors only
tail -f logs/error-*.log

# Search for specific user
grep "userId: 123" logs/application-2025-10-17.log

# Count today's errors
grep "ERROR" logs/application-$(date +%Y-%m-%d).log | wc -l

# Last 100 lines
tail -n 100 logs/application-*.log

# Filter by level
grep "\[INFO\]" logs/application-*.log
grep "\[ERROR\]" logs/error-*.log
```

## Configuration

**Environment Variables** (`.env`):
```env
LOG_LEVEL=info          # error | warn | info | http | debug
NODE_ENV=production     # production | development
```

**Features**:
- ✅ Auto-rotation (daily)
- ✅ Max file size: 20MB
- ✅ Retention: 14 days (errors: 30 days)
- ✅ Compression: `.gz` archives
- ✅ Console in dev, files in prod

## Testing

```bash
# Run test
npx tsx test-logger.ts

# Check logs created
ls -lh logs/

# View test output
cat logs/application-*.log
```

## Performance Tips

1. **Don't log in loops** - Use summary instead
   ```typescript
   // ❌ Bad
   items.forEach(item => logger.info('Processing item', item));
   
   // ✅ Good
   logger.info('Processing items', { count: items.length });
   items.forEach(processItem);
   logger.info('Items processed', { count: items.length });
   ```

2. **Include timing for slow operations**
   ```typescript
   const start = Date.now();
   await slowOperation();
   logger.info('Completed', { duration: `${Date.now() - start}ms` });
   ```

3. **Use appropriate levels** - Don't use `info` for debugging

## Examples by Module

| Module | What to Log | Level |
|--------|-------------|-------|
| Auth | Login/logout/register attempts | `info` |
| Auth | Failed login attempts | `warn` |
| Auth | Security violations | `error` |
| Orders | Order creation | `info` |
| Orders | Order status changes | `info` |
| Payments | Payment initiated | `info` |
| Payments | Payment success/failure | `info`/`error` |
| Products | Product created/updated | `info` |
| Inventory | Low stock | `warn` |
| API | HTTP requests | `http` |
| Database | Query errors | `error` |
| External APIs | API calls | `info` |
| External APIs | API failures | `error` |
| Webhooks | Webhook received | `info` |
| Webhooks | Webhook processing | `debug` |

## Full Documentation

- [LOGGING.md](./LOGGING.md) - Complete documentation
- [LOGGER_INTEGRATION_EXAMPLES.md](./LOGGER_INTEGRATION_EXAMPLES.md) - Code examples
- [README.md](./README.md#logging) - Quick start

