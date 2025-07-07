// Quantum Service Worker - Advanced Control Layer
const CACHE_NAME = 'quantum-v1';
const QUANTUM_CONFIG = {
    amount: '19.50',
    from: 'eur',
    to: 'pol',
    provider: 'mercuryo'
};

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
                '/quantum-engine.js'
            ]);
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Intercept and modify requests
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Intercept SimpleSwap requests
    if (url.hostname.includes('simpleswap.io')) {
        // Modify the request to ensure our parameters
        if (url.pathname.includes('/exchange')) {
            url.searchParams.set('from', QUANTUM_CONFIG.from);
            url.searchParams.set('to', QUANTUM_CONFIG.to);
            url.searchParams.set('amount', QUANTUM_CONFIG.amount);
            url.searchParams.set('provider', QUANTUM_CONFIG.provider);
            
            const modifiedRequest = new Request(url.toString(), {
                method: event.request.method,
                headers: new Headers({
                    ...event.request.headers,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'X-Requested-With': 'QuantumCheckout',
                    'X-Lock-Amount': QUANTUM_CONFIG.amount
                }),
                mode: 'cors',
                credentials: 'include'
            });
            
            event.respondWith(fetch(modifiedRequest));
            return;
        }
    }
    
    // Default fetch behavior
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

// Message handling for advanced control
self.addEventListener('message', event => {
    if (event.data.type === 'EXECUTE_QUANTUM') {
        // Execute quantum checkout
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'QUANTUM_REDIRECT',
                        url: `https://simpleswap.io/exchange?${new URLSearchParams(QUANTUM_CONFIG)}`
                    });
                });
            })
        );
    }
});

// Background sync for resilience
self.addEventListener('sync', event => {
    if (event.tag === 'quantum-checkout') {
        event.waitUntil(executeQuantumCheckout());
    }
});

async function executeQuantumCheckout() {
    // Advanced checkout logic with multiple fallbacks
    const strategies = [
        // Desktop spoofed request
        () => fetch('https://simpleswap.io/exchange', {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                'Content-Type': 'application/json',
                'X-Desktop-Mode': 'true'
            },
            body: JSON.stringify(QUANTUM_CONFIG)
        }),
        
        // Widget API request
        () => fetch('https://simpleswap.io/api/widget/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...QUANTUM_CONFIG,
                widget: true,
                lockAmount: true
            })
        }),
        
        // Direct exchange creation
        () => fetch('https://simpleswap.io/api/exchange/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...QUANTUM_CONFIG,
                fixed: true,
                skipValidation: true
            })
        })
    ];
    
    // Try each strategy
    for (const strategy of strategies) {
        try {
            const response = await strategy();
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            console.log('Strategy failed, trying next...');
        }
    }
    
    throw new Error('All strategies failed');
}