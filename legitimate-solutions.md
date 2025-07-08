# Legitimate Solutions for SimpleSwap EUR→POL at €19.50

## Understanding the Real Problem

SimpleSwap routes mobile users to MoonPay (€21.42 minimum) instead of Mercuryo (€19.50 minimum). This isn't a bug - it's intentional business logic. So let's find legitimate ways to ensure Mercuryo access.

## Solution 1: Direct Mercuryo Integration

**Skip SimpleSwap entirely and integrate Mercuryo directly:**

```javascript
// Use Mercuryo's direct widget
<script src="https://widget.mercuryo.io/embed.js"></script>
<div 
  class="mercuryo-widget"
  data-currency="EUR"
  data-crypto="POL"
  data-amount="19.50"
  data-address="USER_WALLET_ADDRESS"
>
</div>
```

**Pros:**
- No SimpleSwap involvement
- Guaranteed €19.50 amount
- Full control over UX
- No mobile discrimination

**Cons:**
- Need Mercuryo partner account
- Handle KYC/compliance directly

## Solution 2: SimpleSwap Partner API

**Use SimpleSwap's partner API which may have different rules:**

```javascript
// SimpleSwap Partner API approach
async function createExchange() {
  const response = await fetch('https://api.simpleswap.io/v1/create_exchange', {
    method: 'POST',
    headers: {
      'api_key': 'YOUR_PARTNER_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currency_from: 'eur',
      currency_to: 'pol',
      amount: 19.50,
      provider: 'mercuryo' // Force provider selection
    })
  });
  
  const data = await response.json();
  // Redirect to the exchange URL
  window.location.href = data.redirect_url;
}
```

**Pros:**
- Official API usage
- Provider selection control
- No user agent tricks needed
- Stable long-term solution

## Solution 3: SimpleSwap Business Account

**Apply for a SimpleSwap business account with custom parameters:**

1. Contact SimpleSwap business team
2. Request custom integration that:
   - Always shows all providers
   - Doesn't apply mobile routing rules
   - Allows amounts below standard minimums

**Pros:**
- Fully legitimate
- Custom support
- Better rates potentially
- Long-term partnership

## Solution 4: Desktop-Mode PWA

**Create a legitimate Progressive Web App that maintains desktop context:**

```javascript
// manifest.json
{
  "name": "EUR to POL Checkout",
  "display": "standalone",
  "orientation": "landscape",
  "categories": ["finance", "productivity"],
  "prefer_native_apps": false
}

// Force desktop viewport
<meta name="viewport" content="width=1024">

// Legitimate desktop mode
if ('standalone' in navigator) {
  // Running as PWA - use desktop parameters
  window.location.href = 'https://simpleswap.io/exchange?from=eur&to=pol&amount=19.50';
}
```

**Pros:**
- Legitimate use of PWA features
- Consistent experience
- User installs once
- Works within browser rules

## Solution 5: Changelly or Alternative Exchanges

**Use exchanges that don't discriminate by device:**

```javascript
const alternatives = [
  {
    name: 'Changelly',
    url: 'https://changelly.com/exchange/eur/pol?amount=19.50',
    minAmount: 20 // Check their actual minimums
  },
  {
    name: 'ChangeNOW',
    url: 'https://changenow.io/?from=eur&to=pol&amount=19.50',
    minAmount: 20
  },
  {
    name: 'StealthEX',
    url: 'https://stealthex.io/?from=eur&to=pol&amount=19.50',
    minAmount: 20
  }
];
```

## Solution 6: Two-Step Process

**Legitimate two-step process that works on all devices:**

```html
<!-- Step 1: Choose provider explicitly -->
<div class="provider-selector">
  <h2>Select Payment Provider</h2>
  <button onclick="selectMercuryo()">
    Mercuryo (€19.50 minimum)
    <small>Lower minimum, instant processing</small>
  </button>
  <button onclick="selectMoonPay()">
    MoonPay (€21.42 minimum)
    <small>Higher minimum, more payment methods</small>
  </button>
</div>

<script>
function selectMercuryo() {
  // Direct to Mercuryo-specific URL if it exists
  window.location.href = 'https://simpleswap.io/exchange?from=eur&to=pol&amount=19.50&provider=mercuryo';
}
</script>
```

## Solution 7: QR Code Bridge

**Legitimate QR code solution for mobile users:**

```javascript
// Generate QR code that opens desktop-specific URL
function generateDesktopQR() {
  const desktopUrl = 'https://simpleswap.io/exchange?from=eur&to=pol&amount=19.50';
  
  // Show QR code
  new QRCode(document.getElementById("qr"), {
    text: desktopUrl,
    width: 256,
    height: 256
  });
  
  // Instruction text
  document.getElementById("instructions").innerHTML = `
    <p>Scan this QR code on your desktop computer for €19.50 checkout</p>
    <p>Or continue on mobile for €21.42 minimum</p>
  `;
}
```

## Solution 8: Email/SMS Link

**Send checkout link that preserves desktop context:**

```javascript
function sendCheckoutLink() {
  const email = document.getElementById('email').value;
  const checkoutUrl = 'https://simpleswap.io/exchange?from=eur&to=pol&amount=19.50';
  
  // Send via your backend
  fetch('/api/send-checkout-link', {
    method: 'POST',
    body: JSON.stringify({
      email: email,
      url: checkoutUrl,
      message: 'Complete your €19.50 EUR to POL purchase on desktop for the best rate'
    })
  });
}
```

## Recommended Approach

**The most sustainable solution is a combination:**

1. **Primary**: Direct Mercuryo integration
   - Eliminates SimpleSwap dependency
   - Full control over amounts
   - No discrimination possible

2. **Secondary**: SimpleSwap Partner API
   - If Mercuryo direct isn't feasible
   - Official integration
   - Provider control

3. **Fallback**: Alternative exchanges
   - Multiple options for users
   - Competition keeps rates fair
   - No single point of failure

## Implementation Plan

### Phase 1: Research (1 week)
- Contact Mercuryo for direct integration
- Apply for SimpleSwap partner API
- Test alternative exchanges

### Phase 2: Prototype (1 week)
- Build Mercuryo widget integration
- Create provider selection UI
- Test on all devices

### Phase 3: Deploy (1 week)
- Launch solution
- Monitor success rates
- Gather user feedback

This approach works within the system rather than against it, providing a sustainable long-term solution.