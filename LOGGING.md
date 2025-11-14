# Winston Logger Setup

This project uses Winston for comprehensive file-based logging with automatic log rotation.

## Features

- **File Rotation**: Logs are automatically rotated daily
- **Log Levels**: Support for info, warn, error, debug, and http levels
- **Separate Error Logs**: Error logs are kept in separate files for easier debugging
- **Automatic Cleanup**: Old logs are automatically compressed and deleted after retention period
- **Exception Handling**: Uncaught exceptions and promise rejections are logged
- **Development Mode**: Console logging in development, file logging in production

## Log Files

All logs are stored in the `/logs` directory:

- `application-YYYY-MM-DD.log` - All logs (retained for 14 days)
- `error-YYYY-MM-DD.log` - Error logs only (retained for 30 days)
- `combined-YYYY-MM-DD.log` - Info and above (retained for 14 days)
- `exceptions-YYYY-MM-DD.log` - Uncaught exceptions (retained for 30 days)
- `rejections-YYYY-MM-DD.log` - Unhandled promise rejections (retained for 30 days)

Old logs are automatically compressed to `.gz` files.

## Usage

```typescript
import logger from '@/lib/logger';

// Info logging
logger.info('User logged in', { userId: 123, email: 'user@example.com' });

// Error logging
logger.error('Payment failed', { orderId: 456, error: err });

// Warning
logger.warn('Low inventory', { productId: 789, quantity: 2 });

// Debug (only in development when LOG_LEVEL=debug)
logger.debug('Processing request', { requestId: 'abc-123' });

// HTTP requests
logger.http('GET /api/products', { statusCode: 200, duration: '45ms' });
```

## Examples in Your Application

### API Routes
```typescript
// src/app/api/products/route.ts
import logger from '@/lib/logger';

export async function GET(request: Request) {
  try {
    logger.info('Fetching products', { url: request.url });
    const products = await getProducts();
    logger.info('Products fetched successfully', { count: products.length });
    return Response.json(products);
  } catch (error) {
    logger.error('Failed to fetch products', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### Controllers
```typescript
// src/modules/controllers/orderController.ts
import logger from '@/lib/logger';

export const createOrder = async (req, res) => {
  try {
    logger.info('Creating new order', { userId: req.user.id });
    const order = await orderService.create(req.body);
    logger.info('Order created successfully', { orderId: order.id, amount: order.total });
    return res.json(order);
  } catch (error) {
    logger.error('Order creation failed', { 
      userId: req.user.id, 
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
};
```

### Services
```typescript
// src/modules/services/paymentService.ts
import logger from '@/lib/logger';

export const processPayment = async (orderId: string, amount: number) => {
  logger.info('Processing payment', { orderId, amount });
  
  try {
    const result = await razorpay.orders.create({ amount });
    logger.info('Payment processed successfully', { 
      orderId, 
      paymentId: result.id 
    });
    return result;
  } catch (error) {
    logger.error('Payment processing failed', { 
      orderId, 
      amount, 
      error 
    });
    throw error;
  }
};
```

## Environment Variables

Add to your `.env` file:

```bash
# Log level: error, warn, info, http, debug
LOG_LEVEL=info

# In production
NODE_ENV=production
```

## Configuration

Edit `/src/lib/logger.ts` to customize:

- **Log retention**: Change `maxFiles` (e.g., '30d' for 30 days)
- **File size**: Change `maxSize` (e.g., '50m' for 50MB)
- **Log format**: Modify `customFormat` for different output
- **Log directory**: Change `logDirectory` path

## Best Practices

1. **Use appropriate log levels**:
   - `error`: Failures and exceptions
   - `warn`: Potential issues, deprecations
   - `info`: Important business events
   - `http`: HTTP requests/responses
   - `debug`: Detailed debugging info

2. **Include context**: Always provide relevant metadata
   ```typescript
   logger.info('Event occurred', { userId, orderId, timestamp });
   ```

3. **Don't log sensitive data**: Avoid logging passwords, tokens, credit cards

4. **Log business events**: Track user actions, transactions, important state changes

5. **Error objects**: Pass full error objects for stack traces
   ```typescript
   catch (error) {
     logger.error('Operation failed', error);
   }
   ```

## Monitoring Logs

### View logs in real-time
```bash
# All logs
tail -f logs/application-2025-10-17.log

# Errors only
tail -f logs/error-2025-10-17.log

# Filter by level
grep "ERROR" logs/application-2025-10-17.log

# Search for specific user
grep "userId: 123" logs/application-2025-10-17.log
```

### Analyze logs
```bash
# Count errors today
grep "ERROR" logs/application-$(date +%Y-%m-%d).log | wc -l

# Find slow requests
grep "duration" logs/application-$(date +%Y-%m-%d).log | awk -F'duration: ' '{print $2}'
```

## Production Deployment

The logger automatically:
- Disables console output in production
- Enables file logging
- Compresses old logs
- Removes logs past retention period

No additional configuration needed!

