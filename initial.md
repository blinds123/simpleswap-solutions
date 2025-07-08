# SimpleSwap €19.50 Bulletproof Checkout Solution

## FEATURE:
Create ONE 100% reliable checkout solution that maintains €19.50 EUR pricing on SimpleSwap for all devices, preventing the platform's mobile discrimination that forces users to €21.42 via MoonPay routing.

## GOAL:
A bulletproof, production-ready checkout system that:
- ALWAYS maintains €19.50 price point (never €21.42)
- Works on 100% of mobile devices (iOS Safari, Android Chrome)
- Routes to Mercuryo payment provider (not MoonPay)
- Provides single-click checkout from landing page
- Handles the EUR→POL currency pair correctly
- Zero failures in production environment

## WHY:
- **Business Impact**: Lost conversions due to €1.92 price increase on mobile
- **User Trust**: Inconsistent pricing damages brand credibility  
- **Market Position**: Competitors don't have mobile discrimination
- **Revenue**: Each lost mobile user = €19.50 lost revenue
- **Simplicity**: Users expect one-click checkout at advertised price

## WHAT:
### User-Visible Behavior:
1. User clicks "Buy POL for €19.50" on landing page
2. Redirects to SimpleSwap with amount locked at €19.50
3. Mercuryo provider is shown (green border, wallet field visible)
4. User completes purchase without price changes

### Technical Requirements:
- Static HTML/JS only (Netlify deployment)
- No backend/server components
- Sub-2 second load time
- Graceful fallback if primary method fails
- Success tracking for monitoring

## EXAMPLES:
Current working approaches discovered through testing:
1. **Bridge Currency Method** (100% success):
   ```javascript
   // EUR→USDT preserves €19.50 with Mercuryo
   window.location.href = 'https://simpleswap.io/exchange?from=eur&to=usdt&amount=19.50';
   ```

2. **Desktop Spoofing** (85-95% success):
   ```javascript
   // Override mobile detection signals
   Object.defineProperty(navigator, 'userAgent', {value: 'Mozilla/5.0 (Windows NT 10.0)'});
   ```

## DOCUMENTATION:
- SimpleSwap URL structure: https://simpleswap.io/exchange?from={currency}&to={currency}&amount={value}
- No official SimpleSwap API available
- Mercuryo minimum: €19.50 (desktop only)
- MoonPay minimum: €21.42 (forced on mobile)

## OTHER CONSIDERATIONS:
- **Critical Discovery**: EUR→POL not directly supported by payment providers
- **Working Solution**: EUR→USDT→POL bridge maintains €19.50
- **Mobile Detection**: Multiple signals used (userAgent, touchPoints, screen size)
- **Provider Logic**: Hardcoded business rule - mobile=MoonPay, desktop=Mercuryo
- **Success Metric**: 100% of users complete checkout at €19.50

## TECH STACK:
- HTML5
- Vanilla JavaScript (ES6+)
- CSS3 for responsive design
- No frameworks required
- Static file hosting (Netlify)

## VALIDATION REQUIREMENTS:
- Must work on real iPhone Safari
- Must work on real Android Chrome  
- Must maintain €19.50 through entire flow
- Must show Mercuryo (not MoonPay)
- Must handle network errors gracefully
- Must track success rate

## SPECIFIC MODEL/APPROACH:
Use the bridge currency approach (EUR→USDT) as the primary method since it has 100% success rate. Implement smart detection to guide users through the two-step process seamlessly.