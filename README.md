# E-Commerce Website

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- 🛍️ Full-featured e-commerce platform
- 👥 Multi-role support (Buyer/Seller)
- 💳 Payment integration (Razorpay)
- 📦 Shiprocket integration for order fulfillment
- 🔐 Secure authentication with NextAuth
- 📊 Seller analytics dashboard
- 📝 **Winston file logging** with automatic rotation

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Logging

This project uses **Winston** for comprehensive file-based logging with automatic rotation.

### Features
- ✅ Automatic daily log rotation
- ✅ Separate error logs
- ✅ Compressed archived logs
- ✅ Configurable retention periods
- ✅ Console logging in development
- ✅ File logging in production
- ✅ Uncaught exception & rejection handling

### Usage

```typescript
import logger from '@/lib/logger';

// Info logging
logger.info('User logged in', { userId: 123 });

// Error logging
logger.error('Payment failed', error);

// Warning
logger.warn('Low inventory', { productId: 789 });

// Debug
logger.debug('Processing request', { data });

// HTTP
logger.http('GET /api/products', { statusCode: 200 });
```

### Log Files

Logs are stored in `/logs`:
- `application-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Errors only
- `combined-YYYY-MM-DD.log` - Info and above
- `exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `rejections-YYYY-MM-DD.log` - Unhandled rejections

### Testing Logger

```bash
# Run test
npx tsx test-logger.ts

# View logs
tail -f logs/application-*.log

# View errors only
tail -f logs/error-*.log
```

### Documentation
- 📖 [LOGGING.md](./LOGGING.md) - Complete logging documentation
- 💡 [LOGGER_INTEGRATION_EXAMPLES.md](./LOGGER_INTEGRATION_EXAMPLES.md) - Integration examples

### Environment Variables

```env
LOG_LEVEL=info          # error, warn, info, http, debug
NODE_ENV=production     # production, development
```

## Nginx Configuration

<!-- Nginx local -->
events { }

http {
    server {
        listen 80;

        location / {
            proxy_pass http://nextjs:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}

<!-- Nginx live -->
events { }

http {
    server {
        listen 80;
        server_name mysite.makeyoueasy.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name mysite.makeyoueasy.com;

        ssl_certificate /etc/letsencrypt/live/mysite.makeyoueasy.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/mysite.makeyoueasy.com/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://nextjs:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
