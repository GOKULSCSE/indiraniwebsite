# Winston Logger Integration Examples

Here are practical examples of how to integrate Winston logging into your existing codebase.

## 1. Controllers - Enhanced Error Tracking

### Before (without logging)
```typescript
// src/modules/controllers/OrderController.ts
export class OrderController {
  async createOrder(request: Request) {
    try {
      const body = await request.json();
      const result = await this.orderService.createOrder(body);
      return NextResponse.json(ResponseGenerator.generate(201, result, "Order created"));
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

### After (with Winston logging)
```typescript
// src/modules/controllers/OrderController.ts
import logger from '@/lib/logger';

export class OrderController {
  async createOrder(request: Request) {
    const startTime = Date.now();
    
    try {
      const body = await request.json();
      logger.info('Creating new order', { 
        userId: body.userId,
        items: body.items?.length,
        amount: body.totalAmount 
      });
      
      const result = await this.orderService.createOrder(body);
      
      logger.info('Order created successfully', { 
        orderId: result.id,
        userId: body.userId,
        amount: result.totalAmount,
        duration: `${Date.now() - startTime}ms`
      });
      
      return NextResponse.json(ResponseGenerator.generate(201, result, "Order created"));
    } catch (error) {
      logger.error('Order creation failed', { 
        userId: body?.userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${Date.now() - startTime}ms`
      });
      return this.handleError(error);
    }
  }
}
```

## 2. API Routes - HTTP Request Logging

### Example: Product API
```typescript
// src/app/api/products/route.ts
import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);
  
  logger.http('GET /api/products', {
    query: Object.fromEntries(url.searchParams),
    headers: {
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer')
    }
  });

  try {
    const products = await productService.getAll();
    
    logger.info('Products fetched successfully', {
      count: products.length,
      duration: `${Date.now() - startTime}ms`
    });

    return NextResponse.json(
      ResponseGenerator.generate(200, products, "Success"),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to fetch products', {
      error: error instanceof Error ? error.message : error,
      duration: `${Date.now() - startTime}ms`
    });

    return NextResponse.json(
      ResponseGenerator.generate(500, null, "Internal Server Error"),
      { status: 500 }
    );
  }
}
```

## 3. Services - Business Logic Tracking

### Example: Payment Service
```typescript
// src/modules/services/PaymentService.ts
import logger from '@/lib/logger';

export class PaymentService {
  async processPayment(orderId: string, amount: number, userId: string) {
    logger.info('Payment processing initiated', { orderId, amount, userId });

    try {
      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: orderId
      });

      logger.info('Razorpay order created', {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount
      });

      return razorpayOrder;
    } catch (error) {
      logger.error('Payment processing failed', {
        orderId,
        amount,
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    logger.info('Verifying payment', { orderId, paymentId });

    try {
      const isValid = this.validateSignature(orderId, paymentId, signature);
      
      if (isValid) {
        logger.info('Payment verified successfully', { orderId, paymentId });
      } else {
        logger.warn('Payment verification failed - invalid signature', { 
          orderId, 
          paymentId 
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Payment verification error', {
        orderId,
        paymentId,
        error
      });
      throw error;
    }
  }
}
```

## 4. Authentication - Security Tracking

### Example: Auth Service
```typescript
// src/modules/services/AuthService.ts
import logger from '@/lib/logger';

export class AuthService {
  async LoginWithPassword(credentials: { email: string; password: string }) {
    logger.info('Login attempt', { email: credentials.email });

    try {
      const user = await this.userService.findByEmail(credentials.email);

      if (!user) {
        logger.warn('Login failed - user not found', { email: credentials.email });
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await this.verifyPassword(
        credentials.password,
        user.password
      );

      if (!isValidPassword) {
        logger.warn('Login failed - invalid password', { 
          email: credentials.email,
          userId: user.id 
        });
        throw new Error('Invalid credentials');
      }

      logger.info('Login successful', { 
        userId: user.id,
        email: user.email,
        role: user.role 
      });

      return { user, token: this.generateToken(user) };
    } catch (error) {
      logger.error('Login error', { 
        email: credentials.email,
        error 
      });
      throw error;
    }
  }

  async ForgotPasswordRequest(email: string) {
    logger.info('Password reset request', { email });

    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        logger.warn('Password reset requested for non-existent user', { email });
        // Don't reveal user doesn't exist
        return { success: true };
      }

      const resetToken = this.generateResetToken();
      await this.sendResetEmail(user.email, resetToken);

      logger.info('Password reset email sent', { 
        userId: user.id,
        email: user.email 
      });

      return { success: true };
    } catch (error) {
      logger.error('Password reset request failed', { email, error });
      throw error;
    }
  }
}
```

## 5. Webhooks - Event Tracking

### Example: Shiprocket Webhook
```typescript
// src/app/api/shipmentwebhook/route.ts
import logger from '@/lib/logger';

export async function POST(request: Request) {
  logger.info('Shiprocket webhook received');

  try {
    const body = await request.json();

    logger.info('Webhook payload', {
      orderId: body.order_id,
      status: body.current_status,
      awbCode: body.awb_code,
      shipmentId: body.shipment_id
    });

    // Process webhook
    await processShipmentUpdate(body);

    logger.info('Webhook processed successfully', {
      orderId: body.order_id,
      status: body.current_status
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing failed', {
      error,
      body: await request.text()
    });

    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
```

## 6. Database Operations

### Example: User Service
```typescript
// src/modules/services/UserService.ts
import logger from '@/lib/logger';

export class UserService {
  async createUser(userData: CreateUserDTO) {
    logger.info('Creating new user', { 
      email: userData.email,
      role: userData.role 
    });

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        logger.warn('User creation failed - email already exists', {
          email: userData.email
        });
        throw new Error('Email already registered');
      }

      const user = await prisma.user.create({
        data: userData
      });

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return user;
    } catch (error) {
      logger.error('User creation failed', {
        email: userData.email,
        error
      });
      throw error;
    }
  }

  async updateUser(userId: string, updates: UpdateUserDTO) {
    logger.info('Updating user', { userId, fields: Object.keys(updates) });

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updates
      });

      logger.info('User updated successfully', {
        userId,
        updatedFields: Object.keys(updates)
      });

      return user;
    } catch (error) {
      logger.error('User update failed', { userId, error });
      throw error;
    }
  }
}
```

## 7. File Upload Operations

### Example: S3 Upload
```typescript
// src/lib/s3.ts
import logger from '@/lib/logger';

export async function uploadToS3(file: File, key: string) {
  logger.info('S3 upload initiated', {
    fileName: file.name,
    fileSize: file.size,
    key
  });

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type
    });

    await s3Client.send(command);

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;

    logger.info('S3 upload successful', {
      fileName: file.name,
      fileSize: file.size,
      key,
      url
    });

    return url;
  } catch (error) {
    logger.error('S3 upload failed', {
      fileName: file.name,
      key,
      error
    });
    throw error;
  }
}
```

## 8. Scheduled Jobs / Background Tasks

### Example: Inventory Sync
```typescript
// src/jobs/inventorySync.ts
import logger from '@/lib/logger';

export async function syncInventory() {
  const startTime = Date.now();
  logger.info('Inventory sync started');

  try {
    const products = await prisma.product.findMany({
      where: { needsSync: true }
    });

    logger.info('Products fetched for sync', { count: products.length });

    let synced = 0;
    let failed = 0;

    for (const product of products) {
      try {
        await syncProductInventory(product.id);
        synced++;
      } catch (error) {
        failed++;
        logger.error('Product sync failed', {
          productId: product.id,
          error
        });
      }
    }

    logger.info('Inventory sync completed', {
      total: products.length,
      synced,
      failed,
      duration: `${Date.now() - startTime}ms`
    });
  } catch (error) {
    logger.error('Inventory sync job failed', {
      error,
      duration: `${Date.now() - startTime}ms`
    });
  }
}
```

## Quick Integration Checklist

1. ✅ Install Winston packages
2. ✅ Create logger configuration (`src/lib/logger.ts`)
3. ✅ Add `/logs` to `.gitignore`
4. ✅ Import logger in controllers: `import logger from '@/lib/logger'`
5. ✅ Add logging to:
   - [ ] Authentication flows
   - [ ] Payment processing
   - [ ] Order creation/updates
   - [ ] File uploads
   - [ ] External API calls
   - [ ] Database operations
   - [ ] Error handlers
   - [ ] Webhook handlers

## Tips

1. **Log at entry and exit points** of important operations
2. **Include context**: userId, orderId, productId, etc.
3. **Log timing** for performance monitoring
4. **Use appropriate levels**: error for failures, warn for anomalies, info for business events
5. **Don't log**: passwords, tokens, credit card numbers, PII
6. **Include duration** to identify slow operations

