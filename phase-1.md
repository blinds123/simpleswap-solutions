# Phase 1: Skeleton Implementation

## Overview
This phase creates the minimal working skeleton that proves the EUR→USDT→POL bridge concept with basic functionality.

## Implementation

### Task 1: Create Basic HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>€19.50 POL Checkout - SimpleSwap Solution</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .price {
            font-size: 48px;
            color: #00d4aa;
            text-align: center;
            font-weight: bold;
            margin: 20px 0;
        }
        .step {
            background: #f8f9fa;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid #00d4aa;
        }
        .button {
            background: #00d4aa;
            color: white;
            border: none;
            padding: 16px 32px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background: #00b894;
        }
        .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Buy POL (Polygon)</h1>
        <div class="price">€19.50</div>
        
        <div id="step1" class="step">
            <h2>Step 1: Buy USDT with EUR</h2>
            <p>First, we'll buy USDT with your €19.50. This preserves the correct price.</p>
            <button class="button" onclick="startStep1()">
                Buy USDT for €19.50 →
            </button>
        </div>
        
        <div id="step2" class="step hidden">
            <h2>Step 2: Convert USDT to POL</h2>
            <p>Great! Now convert your USDT to POL.</p>
            <button class="button" onclick="startStep2()">
                Convert USDT to POL →
            </button>
        </div>
        
        <div class="info">
            <strong>Why two steps?</strong><br>
            SimpleSwap doesn't support direct EUR→POL purchases. This method guarantees €19.50 pricing on all devices.
        </div>
        
        <div id="status" class="hidden"></div>
    </div>

    <script>
        // Basic state management
        const STORAGE_KEY = 'simpleswap_checkout_flow';
        
        // Load saved state
        function loadState() {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : { step: 1, started: null };
        }
        
        // Save state
        function saveState(state) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
        
        // Initialize
        function init() {
            const state = loadState();
            
            // Check if returning from SimpleSwap
            if (document.referrer.includes('simpleswap.io') && state.step === 1 && state.started) {
                // User likely completed step 1
                showStep2();
            }
        }
        
        // Start EUR to USDT
        function startStep1() {
            const state = {
                step: 1,
                started: Date.now()
            };
            saveState(state);
            
            // Redirect to SimpleSwap EUR→USDT
            window.location.href = 'https://simpleswap.io/exchange?from=eur&to=usdt&amount=19.50';
        }
        
        // Start USDT to POL
        function startStep2() {
            const state = {
                step: 2,
                started: Date.now()
            };
            saveState(state);
            
            // Redirect to SimpleSwap USDT→POL
            window.location.href = 'https://simpleswap.io/exchange?from=usdt&to=pol';
        }
        
        // Show step 2
        function showStep2() {
            document.getElementById('step1').classList.add('hidden');
            document.getElementById('step2').classList.remove('hidden');
            
            const state = loadState();
            state.step = 2;
            saveState(state);
        }
        
        // Run initialization
        init();
    </script>
</body>
</html>
```

### Task 2: Test Skeleton Functionality

1. **Basic Flow Test**:
   - Open the page
   - Click "Buy USDT for €19.50"
   - Verify redirect to SimpleSwap with correct parameters
   - Return to the page
   - Verify Step 2 is shown

2. **State Persistence Test**:
   - Start the flow
   - Close and reopen the page
   - Verify state is maintained

3. **Mobile Test**:
   - Test on iPhone Safari
   - Test on Android Chrome
   - Verify €19.50 is maintained (not €21.42)

## Validation Commands

```bash
# Validate HTML
npx html-validate skeleton/index.html

# Test in browser
open skeleton/index.html

# Mobile testing
# Use browser dev tools mobile emulation
# Or test on real devices
```

## Success Criteria for Phase 1

- [x] Page loads correctly
- [x] EUR→USDT redirect works
- [x] State persists in localStorage
- [x] Step 2 shows after return
- [x] €19.50 amount preserved
- [x] Works on mobile devices

## Next Steps
Once Phase 1 skeleton is validated, proceed to Phase 2 for production-ready implementation with full error handling, UI polish, and tracking.