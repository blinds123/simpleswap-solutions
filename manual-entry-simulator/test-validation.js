const { chromium, webkit, devices } = require('playwright');

// Test configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:8080/';
const REGIONS = ['US', 'CA', 'AU'];
const DEVICES = [
    { name: 'iPhone 13', device: devices['iPhone 13'] },
    { name: 'Pixel 5', device: devices['Pixel 5'] },
    { name: 'iPad Pro', device: devices['iPad Pro 11'] }
];

async function runTest(browserType, device, region, testNumber) {
    const browser = await browserType.launch({ headless: false });
    const context = await browser.newContext({
        ...device.device,
        locale: region === 'US' ? 'en-US' : region === 'CA' ? 'en-CA' : 'en-AU',
        timezoneId: region === 'US' ? 'America/New_York' : region === 'CA' ? 'America/Toronto' : 'Australia/Sydney'
    });
    
    const page = await context.newPage();
    
    try {
        console.log(`[Test ${testNumber}] ${device.name} - ${region} - Starting...`);
        
        // Navigate to our solution
        await page.goto(TEST_URL);
        
        // Wait for redirect to SimpleSwap
        await page.waitForURL(/simpleswap\.io/, { timeout: 10000 });
        
        const finalUrl = page.url();
        console.log(`[Test ${testNumber}] Redirected to: ${finalUrl}`);
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Check for Mercuryo
        const hasMercuryo = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            return text.includes('mercuryo') || text.includes('mercury');
        });
        
        // Check for correct price
        const hasCorrectPrice = await page.evaluate(() => {
            const text = document.body.innerText;
            return text.includes('19.50') || text.includes('19,50');
        });
        
        // Take screenshot
        await page.screenshot({ 
            path: `./test-results/${device.name.replace(/\s/g, '-')}-${region}-${testNumber}.png`,
            fullPage: true 
        });
        
        console.log(`[Test ${testNumber}] Results:`, {
            device: device.name,
            region,
            mercuryo: hasMercuryo,
            correctPrice: hasCorrectPrice,
            success: hasMercuryo && hasCorrectPrice
        });
        
        return hasMercuryo && hasCorrectPrice;
        
    } catch (error) {
        console.error(`[Test ${testNumber}] Error:`, error.message);
        return false;
    } finally {
        await browser.close();
    }
}

async function runAllTests() {
    console.log('Manual Entry Simulator - Validation Tests');
    console.log('========================================');
    
    const results = [];
    let testNumber = 1;
    
    // Create results directory
    const fs = require('fs');
    if (!fs.existsSync('./test-results')) {
        fs.mkdirSync('./test-results');
    }
    
    // Run tests for each device and region
    for (const device of DEVICES) {
        for (const region of REGIONS) {
            // Test with Chromium
            const chromeResult = await runTest(chromium, device, region, testNumber++);
            results.push({ browser: 'Chrome', device: device.name, region, success: chromeResult });
            
            // Test with WebKit (Safari)
            const webkitResult = await runTest(webkit, device, region, testNumber++);
            results.push({ browser: 'Safari', device: device.name, region, success: webkitResult });
            
            // Add delay between tests
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`Total Tests: ${totalCount}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${totalCount - successCount}`);
    console.log(`Success Rate: ${(successCount / totalCount * 100).toFixed(1)}%`);
    
    // Detailed results
    console.log('\nDetailed Results:');
    results.forEach(r => {
        console.log(`${r.success ? '✅' : '❌'} ${r.browser} - ${r.device} - ${r.region}`);
    });
    
    // 5/5 consecutive success check
    const last5 = results.slice(-5);
    const consecutive5Success = last5.every(r => r.success);
    
    console.log(`\nLast 5 Tests All Successful: ${consecutive5Success ? '✅ YES' : '❌ NO'}`);
}

// Run tests
runAllTests().catch(console.error);