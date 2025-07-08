/**
 * Bridge Flow Manager
 * Manages the EUR→USDT→POL flow state and logic
 */
class BridgeFlowManager {
    constructor() {
        this.storageKey = 'simpleswap_bridge_flow_v2';
        this.state = this.loadState();
        this.setupEventListeners();
    }
    
    getDefaultState() {
        return {
            currentStep: 1,
            sessionId: this.generateSessionId(),
            eurAmount: 19.50,
            step1StartTime: null,
            step1CompleteTime: null,
            step2StartTime: null,
            step2CompleteTime: null,
            isReturning: false,
            errorCount: 0,
            device: this.detectDevice(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            url: window.location.href,
            timestamp: Date.now()
        };
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate state integrity
                if (this.isValidState(parsed)) {
                    // Check if state is not too old (7 days)
                    const maxAge = 7 * 24 * 60 * 60 * 1000;
                    if (Date.now() - parsed.timestamp < maxAge) {
                        return parsed;
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load state:', e);
            this.logError('state_load_error', e);
        }
        return this.getDefaultState();
    }
    
    saveState() {
        try {
            this.state.timestamp = Date.now();
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save state:', e);
            this.logError('state_save_error', e);
            // Fallback to sessionStorage
            try {
                sessionStorage.setItem(this.storageKey, JSON.stringify(this.state));
            } catch (e2) {
                console.error('Storage completely failed:', e2);
                this.logError('storage_failure', e2);
            }
        }
    }
    
    isValidState(state) {
        return state && 
               typeof state.currentStep === 'number' &&
               state.currentStep >= 1 && 
               state.currentStep <= 3 &&
               typeof state.eurAmount === 'number' &&
               state.sessionId &&
               state.timestamp;
    }
    
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const device = this.detectDevice();
        return `${device}_${timestamp}_${random}`;
    }
    
    detectDevice() {
        const ua = navigator.userAgent.toLowerCase();
        
        // iOS devices
        if (/iphone|ipod/.test(ua)) return 'iphone';
        if (/ipad/.test(ua)) return 'ipad';
        
        // Android devices
        if (/android/.test(ua)) {
            if (/mobile/.test(ua)) return 'android_phone';
            return 'android_tablet';
        }
        
        // Other mobile
        if (/mobile|phone/.test(ua)) return 'other_mobile';
        
        // Desktop
        if (/mac/.test(ua)) return 'mac';
        if (/win/.test(ua)) return 'windows';
        if (/linux/.test(ua)) return 'linux';
        
        return 'unknown';
    }
    
    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveState();
            } else {
                // Check if we need to update state on focus
                this.checkForUpdates();
            }
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
        
        // Handle storage events (multiple tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    const newState = JSON.parse(e.newValue);
                    if (this.isValidState(newState)) {
                        this.state = newState;
                        // Notify UI of state change
                        this.notifyStateChange();
                    }
                } catch (error) {
                    console.error('Failed to sync state:', error);
                }
            }
        });
    }
    
    checkForUpdates() {
        // Check if returning from SimpleSwap
        if (this.isReturningFromSimpleSwap()) {
            this.handleReturn();
        }
    }
    
    isReturningFromSimpleSwap() {
        const referrer = document.referrer;
        const isFromSimpleSwap = referrer.includes('simpleswap.io');
        const wasInProgress = this.state.step1StartTime && !this.state.step1CompleteTime;
        
        return isFromSimpleSwap && wasInProgress;
    }
    
    handleReturn() {
        console.log('🔄 Detected return from SimpleSwap');
        
        this.state.isReturning = true;
        
        if (this.state.currentStep === 1) {
            // Returning from EUR→USDT
            this.state.currentStep = 2;
            this.state.step1CompleteTime = Date.now();
            
            // Track successful step 1
            if (window.tracker) {
                window.tracker.track('step1_completed', {
                    duration: this.state.step1CompleteTime - this.state.step1StartTime,
                    device: this.state.device
                });
            }
        }
        
        this.saveState();
        this.notifyStateChange();
    }
    
    notifyStateChange() {
        // Dispatch custom event for UI updates
        const event = new CustomEvent('flowStateChanged', {
            detail: { state: this.getState() }
        });
        window.dispatchEvent(event);
    }
    
    startEurToUsdt() {
        console.log('🚀 Starting EUR→USDT conversion');
        
        this.state.currentStep = 1;
        this.state.step1StartTime = Date.now();
        this.state.isReturning = false;
        
        // Track start
        if (window.tracker) {
            window.tracker.track('step1_started', {
                amount: this.state.eurAmount,
                device: this.state.device,
                sessionId: this.state.sessionId
            });
        }
        
        this.saveState();
        return this.getStep1Url();
    }
    
    startUsdtToPol() {
        console.log('🔄 Starting USDT→POL conversion');
        
        this.state.currentStep = 3;
        this.state.step2StartTime = Date.now();
        
        // Track step 2 start
        if (window.tracker) {
            window.tracker.track('step2_started', {
                device: this.state.device,
                sessionId: this.state.sessionId
            });
        }
        
        this.saveState();
        return this.getStep2Url();
    }
    
    completeFlow() {
        console.log('✅ Flow completed successfully');
        
        this.state.step2CompleteTime = Date.now();
        
        // Track completion
        if (window.tracker) {
            const totalDuration = this.state.step2CompleteTime - this.state.step1StartTime;
            window.tracker.track('flow_completed', {
                totalDuration,
                step1Duration: this.state.step1CompleteTime - this.state.step1StartTime,
                step2Duration: this.state.step2CompleteTime - this.state.step2StartTime,
                device: this.state.device,
                sessionId: this.state.sessionId
            });
        }
        
        this.saveState();
    }
    
    getStep1Url() {
        // Build URL with tracking params
        const params = new URLSearchParams({
            from: 'eur',
            to: 'usdt',
            amount: this.state.eurAmount.toString(),
            ref: this.state.sessionId
        });
        
        // Add device hint for potential routing
        params.set('device', this.state.device);
        
        return `https://simpleswap.io/exchange?${params.toString()}`;
    }
    
    getStep2Url() {
        const params = new URLSearchParams({
            from: 'usdt',
            to: 'pol',
            ref: this.state.sessionId
        });
        
        params.set('device', this.state.device);
        
        return `https://simpleswap.io/exchange?${params.toString()}`;
    }
    
    getState() {
        return { ...this.state };
    }
    
    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.saveState();
        this.notifyStateChange();
    }
    
    incrementError() {
        this.state.errorCount++;
        this.saveState();
        
        // Track error
        if (window.tracker) {
            window.tracker.track('flow_error', {
                errorCount: this.state.errorCount,
                currentStep: this.state.currentStep,
                device: this.state.device
            });
        }
    }
    
    reset() {
        console.log('🔄 Resetting flow');
        
        // Track reset
        if (window.tracker) {
            window.tracker.track('flow_reset', {
                step: this.state.currentStep,
                device: this.state.device,
                sessionId: this.state.sessionId
            });
        }
        
        // Clear storage
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.storageKey);
        
        // Reset state
        this.state = this.getDefaultState();
        this.saveState();
        this.notifyStateChange();
    }
    
    logError(type, error) {
        const errorEntry = {
            type,
            message: error.message || error,
            stack: error.stack,
            timestamp: Date.now(),
            state: this.getState(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Bridge Flow Error:', errorEntry);
        
        // Store error for later analysis
        try {
            const errors = JSON.parse(localStorage.getItem('bridge_flow_errors') || '[]');
            errors.push(errorEntry);
            
            // Keep only last 10 errors
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            
            localStorage.setItem('bridge_flow_errors', JSON.stringify(errors));
        } catch (e) {
            console.error('Failed to store error:', e);
        }
    }
    
    getErrors() {
        try {
            return JSON.parse(localStorage.getItem('bridge_flow_errors') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    getDebugInfo() {
        return {
            state: this.getState(),
            errors: this.getErrors(),
            storageSize: this.getStorageSize(),
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };
    }
    
    getStorageSize() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            
            return {
                used: total,
                available: true
            };
        } catch (e) {
            return {
                used: 0,
                available: false,
                error: e.message
            };
        }
    }
}

// Make globally available for debugging
window.BridgeFlowManager = BridgeFlowManager;