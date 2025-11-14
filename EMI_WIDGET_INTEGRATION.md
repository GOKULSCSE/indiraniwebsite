# Razorpay EMI² Affordability Widget Integration

## Overview
This document describes the integration of Razorpay EMI² Affordability Widget into the e-commerce checkout page. The widget displays various EMI and payment options to customers before they proceed to payment.

## Implementation Details

### 1. New Component Created
**File:** `src/components/common/Payment/RazorpayAffordabilityWidget.tsx`

**Features:**
- Dynamic script loading for Razorpay Affordability Widget
- Proper error handling and loading states
- TypeScript support with proper type definitions
- Responsive design with customizable styling
- Callback functions for widget load/error events

**Key Props:**
- `amount`: Payment amount in paise (required)
- `keyId`: Razorpay API key ID (required)
- `className`: Custom CSS classes (optional)
- `onWidgetLoad`: Callback when widget loads successfully (optional)
- `onWidgetError`: Callback when widget encounters an error (optional)

### 2. Integration in Checkout Page
**File:** `src/app/(main)/(pages)/checkout/page.tsx`

**Integration Points:**
- Added dynamic import for the new widget component
- Integrated widget in the payment summary section
- Positioned after "Amount Payable" display
- Only shows when payment tab is active and amount > 0
- Styled with attractive gradient background and proper spacing

**Location in UI:**
```
Payment Summary Section
├── Order Items
├── Discounts (if any)
├── GST Calculation
├── Shipping Charges
├── Amount Payable
├── 🆕 EMI Affordability Widget (NEW)
├── Courier Service Info
└── Payment Buttons
```

## Configuration

### Environment Variables
Ensure your `.env.local` file contains:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXX00000XXXX
```

### Razorpay Dashboard Setup
1. **Enable EMI² Widget:**
   - Log in to Razorpay Dashboard
   - Navigate to **Payment Products** → **Affordability**
   - Choose **Others** as your website platform
   - Click **Enable Widget** in the **Go live!** section
   - Select the checkbox and click **Yes, enable**

2. **Test Mode:**
   - Use test API keys for development
   - Widget will show test EMI options
   - Switch to live keys for production

## Features

### Widget Display
- **Conditional Rendering:** Only shows on payment tab when amount > 0
- **Responsive Design:** Adapts to different screen sizes
- **Attractive Styling:** Blue gradient background with proper spacing
- **Clear Labeling:** "Flexible Payment Options" with emoji icon

### Payment Options Displayed
The widget automatically shows available options based on:
- Order amount (minimum thresholds apply)
- Customer eligibility
- Enabled payment methods in Razorpay dashboard

**Common Options:**
- EMI options (3, 6, 9, 12 months)
- Cardless EMI
- Pay Later options
- Bank offers and discounts

### Error Handling
- Script loading errors are caught and logged
- Widget rendering errors are handled gracefully
- Fallback behavior if widget fails to load
- Console logging for debugging

## Testing

### Test Mode Setup
1. Use test Razorpay key: `rzp_test_XXXX00000XXXX`
2. Test with different amounts to see various EMI options
3. Check browser console for any errors
4. Verify widget loads correctly on payment tab

### Test Scenarios
1. **Small Amount (< ₹1000):** Should show limited options
2. **Medium Amount (₹1000-₹5000):** Should show more EMI options
3. **Large Amount (> ₹5000):** Should show all available options
4. **Tab Switching:** Widget should only appear on payment tab
5. **Amount Changes:** Widget should update when cart amount changes

## Production Deployment

### Live Mode Setup
1. **Generate Live Keys:**
   - Switch to Live Mode in Razorpay Dashboard
   - Generate live API keys
   - Update environment variables

2. **Enable Widget:**
   - Ensure widget is enabled in live mode
   - Test with real payment scenarios
   - Monitor for any issues

### Performance Considerations
- Widget script loads asynchronously
- No impact on existing payment flow
- Minimal bundle size increase
- Proper error boundaries prevent crashes

## Troubleshooting

### Common Issues

1. **Widget Not Loading:**
   - Check if Razorpay key is correct
   - Verify widget is enabled in dashboard
   - Check browser console for errors
   - Ensure amount is in paise (multiply by 100)

2. **No EMI Options Showing:**
   - Check minimum order limits
   - Verify customer eligibility
   - Ensure EMI options are enabled in dashboard
   - Test with different amounts

3. **Script Loading Errors:**
   - Check internet connectivity
   - Verify CDN is accessible
   - Check for ad blockers
   - Try different browsers

### Debug Information
- Widget load success/error callbacks
- Console logging for troubleshooting
- Amount conversion verification
- Script loading status

## Benefits

### For Customers
- **Transparency:** See all available payment options upfront
- **Flexibility:** Choose payment method that suits their needs
- **Trust:** Official Razorpay widget builds confidence
- **Convenience:** No need to discover options during checkout

### For Business
- **Increased Conversions:** More payment options = higher conversion rates
- **Better UX:** Customers see options before committing
- **Reduced Cart Abandonment:** Payment flexibility reduces drop-offs
- **No Development Overhead:** Razorpay handles all EMI logic

## Future Enhancements

### Potential Improvements
1. **Custom Styling:** Match widget colors to brand theme
2. **Analytics:** Track which options customers prefer
3. **A/B Testing:** Test different widget positions
4. **Mobile Optimization:** Ensure perfect mobile experience
5. **Integration with Checkout:** Allow direct selection from widget

### Advanced Features
1. **Dynamic Offers:** Show personalized offers
2. **Customer History:** Use past payment data for recommendations
3. **Real-time Eligibility:** Check eligibility in real-time
4. **Multi-language Support:** Support for different languages

## Support

### Razorpay Support
- **Documentation:** https://razorpay.com/docs/payments/payment-gateway/emi²/widget/native-web/
- **Support Portal:** https://razorpay.com/support/
- **Integration Form:** Available in Razorpay dashboard

### Internal Support
- Check component implementation in `RazorpayAffordabilityWidget.tsx`
- Verify integration in checkout page
- Review environment variables
- Check browser console for errors

---

**Note:** This integration maintains full backward compatibility with existing payment flows. The EMI widget is purely informational and doesn't interfere with the current Razorpay payment process.
