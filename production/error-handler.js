/**
 * Error Handler
 * Comprehensive error handling and recovery system
 */
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 20;
        this.ui = null;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        this.setupGlobalErrorHandling();
    }
    
    setUI(uiComponents) {
        this.ui = uiComponents;
    }
    
    setupGlobalErrorHandling() {
        // Catch JavaScript errors
        window.addEventListener('error', (event) => {
            this.handle(event.error || new Error(event.message), 'JavaScript Error');
        });
        
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handle(new Error(event.reason), 'Unhandled Promise Rejection');
        });
        
        // Network status monitoring
        window.addEventListener('online', () => {
            this.handleNetworkRestored();
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkLost();
        });
    }
    
    handle(error, userMessage = 'An error occurred', context = {}) {
        // Log to console in development
        if (window.location.hostname === 'localhost') {
            console.error('Checkout Error:', error, context);
        }
        
        // Store error for analysis
        this.logError('checkout_error', error, context);
        
        // Increment error count for this type
        const errorKey = this.getErrorKey(error);
        const attempts = this.retryAttempts.get(errorKey) || 0;
        this.retryAttempts.set(errorKey, attempts + 1);
        
        // Show user-friendly message
        const shouldRetry = attempts < this.maxRetries;
        const message = this.getUserMessage(error, userMessage, shouldRetry);
        
        if (this.ui) {
            this.ui.showError(message);
        }
        
        // Track error
        if (window.tracker) {
            window.tracker.track('error_occurred', {
                type: error.name || 'UnknownError',
                message: error.message,
                userMessage: userMessage,
                context: context,
                retryAttempt: attempts,
                canRetry: shouldRetry
            });
        }
        
        // Handle specific error types
        this.handleSpecificError(error, context);
        
        // Auto-retry for certain errors
        if (shouldRetry && this.shouldAutoRetry(error)) {
            this.scheduleRetry(error, context);
        }
    }
    
    getErrorKey(error) {
        return `${error.name || 'Error'}_${error.message}`;
    }
    
    getUserMessage(error, defaultMessage, canRetry) {
        // Network errors
        if (error.name === 'NetworkError' || !navigator.onLine) {
            return canRetry ? 
                'Connection lost. Retrying automatically...' : 
                'Please check your internet connection and try again.';
        }
        
        // Storage errors
        if (error.message.includes('localStorage') || error.message.includes('storage')) {
            return canRetry ? 
                'Storage issue detected. Attempting to fix...' : 
                'Browser storage is full. Please clear some data and refresh.';
        }
        
        // SimpleSwap specific errors
        if (error.message.includes('simpleswap') || error.message.includes('exchange')) {
            return canRetry ? 
                'SimpleSwap connection issue. Retrying...' : 
                'Unable to connect to SimpleSwap. Please try again later.';
        }
        
        // Permission errors
        if (error.name === 'SecurityError' || error.message.includes('permission')) {
            return 'Security restriction detected. Please ensure cookies and storage are enabled.';
        }
        
        // Generic error with retry option
        if (canRetry) {
            return `${defaultMessage} Retrying automatically...`;
        }
        
        return defaultMessage;
    }
    
    handleSpecificError(error, context) {
        switch (error.name) {
            case 'NetworkError':
                this.handleNetworkError(error, context);
                break;
                
            case 'SecurityError':
                this.handleSecurityError(error, context);
                break;
                
            case 'QuotaExceededError':
                this.handleStorageError(error, context);
                break;
                
            default:
                if (error.message.includes('SimpleSwap')) {
                    this.handleSimpleSwapError(error, context);
                }
                break;
        }
    }
    
    handleNetworkError(error, context) {
        console.log('🌐 Handling network error');
        
        // Check if really offline
        if (!navigator.onLine) {
            this.showOfflineMessage();
            return;
        }
        
        // Test connectivity
        this.testConnectivity().then(isOnline => {
            if (!isOnline) {
                this.showOfflineMessage();
            } else {
                // Network is fine, might be server issue
                this.handleServerError(error, context);
            }
        });
    }
    
    async testConnectivity() {
        try {
            const response = await fetch('https://httpbin.org/status/200', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch (e) {
            return false;
        }
    }
    
    showOfflineMessage() {
        if (this.ui) {
            this.ui.showError('You appear to be offline. Please check your connection.');
        }
        
        // Listen for when back online
        const onlineHandler = () => {
            if (this.ui) {
                this.ui.hideError();
                this.ui.showSuccess('Connection restored!');
            }
            window.removeEventListener('online', onlineHandler);
        };
        
        window.addEventListener('online', onlineHandler);
    }
    
    handleNetworkRestored() {
        console.log('🌐 Network restored');
        
        // Clear network-related retry attempts
        for (const [key, value] of this.retryAttempts.entries()) {
            if (key.includes('Network')) {
                this.retryAttempts.delete(key);
            }
        }
        
        // Track recovery
        if (window.tracker) {
            window.tracker.track('network_restored');
        }
    }
    
    handleNetworkLost() {
        console.log('🌐 Network lost');
        
        if (window.tracker) {
            window.tracker.track('network_lost');
        }
    }
    
    handleSecurityError(error, context) {
        console.log('🔒 Handling security error');
        
        if (this.ui) {
            this.ui.showError('Security settings prevent operation. Please enable cookies and local storage.');
        }
        
        // Provide helpful instructions
        this.showSecurityHelp();
    }
    
    showSecurityHelp() {
        // Create help overlay
        const help = document.createElement('div');
        help.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            width: 90%;
        `;
        
        help.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #e74c3c;">Security Settings Help</h3>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
                To use this checkout, please:
            </p>
            <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px;">
                <li>Enable cookies in your browser</li>
                <li>Allow local storage</li>
                <li>Disable incognito/private mode</li>
            </ul>
            <button onclick="this.parentElement.remove()" style="
                background: #00d4aa;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                width: 100%;
            ">Got it</button>
        `;
        
        document.body.appendChild(help);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (document.body.contains(help)) {
                document.body.removeChild(help);
            }
        }, 15000);
    }
    
    handleStorageError(error, context) {
        console.log('💾 Handling storage error');
        
        // Try to free up space
        this.cleanupStorage();
        
        if (this.ui) {
            this.ui.showError('Storage is full. Cleaning up and retrying...');
        }
        
        // Retry after cleanup
        setTimeout(() => {
            if (context.retryCallback) {
                context.retryCallback();
            }
        }, 1000);
    }
    
    cleanupStorage() {
        try {
            console.log('🧹 Cleaning up storage');
            
            // Clear old checkout data
            const keysToCheck = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                keysToCheck.push(key);
            }
            
            keysToCheck.forEach(key => {
                if (key.startsWith('simpleswap_') || key.startsWith('checkout_')) {
                    try {
                        const data = localStorage.getItem(key);
                        const parsed = JSON.parse(data);
                        
                        // Remove if older than 7 days
                        if (parsed.timestamp && Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
                            localStorage.removeItem(key);
                            console.log('🗑️ Removed old data:', key);
                        }
                    } catch (e) {
                        // Invalid JSON, remove it
                        localStorage.removeItem(key);
                    }
                }
            });
            
            // Clear error logs if too many
            const errors = JSON.parse(localStorage.getItem('checkout_errors') || '[]');
            if (errors.length > 50) {
                const recent = errors.slice(-10);
                localStorage.setItem('checkout_errors', JSON.stringify(recent));
            }
            
        } catch (e) {
            console.error('Failed to cleanup storage:', e);
        }
    }
    
    handleSimpleSwapError(error, context) {
        console.log('🔄 Handling SimpleSwap error');
        
        // Check if it's a redirect issue
        if (error.message.includes('redirect') || error.message.includes('navigation')) {
            this.handleRedirectError(error, context);
            return;
        }
        
        // Generic SimpleSwap error
        if (this.ui) {
            this.ui.showError('SimpleSwap connection issue. Retrying in a moment...');
        }
        
        // Schedule retry
        this.scheduleRetry(error, context, 3000);
    }
    
    handleRedirectError(error, context) {
        console.log('↪️ Handling redirect error');
        
        if (this.ui) {
            this.ui.showError('Redirect blocked. Click the button to continue manually.');
        }
        
        // Provide manual continuation option
        this.showManualContinuation(context);
    }
    
    showManualContinuation(context) {
        // Add manual button to current step
        const currentStep = document.querySelector('.checkout-step.active');
        if (currentStep) {
            const existing = currentStep.querySelector('.manual-continue');
            if (existing) return; // Already exists
            
            const button = document.createElement('button');
            button.className = 'secondary-button manual-continue';
            button.innerHTML = `
                <span>Continue Manually</span>
                <svg width="20" height="20" viewBox="0 0 20 20">
                    <path fill="currentColor" d="M12.95 10.7l-5.65 5.65a1 1 0 01-1.41-1.41L10.83 10 5.89 5.06a1 1 0 011.41-1.41l5.65 5.65a1 1 0 010 1.4z"/>
                </svg>
            `;
            
            button.onclick = () => {
                if (context.manualCallback) {
                    context.manualCallback();
                }
                button.remove();
            };
            
            currentStep.appendChild(button);
        }
    }
    
    handleServerError(error, context) {
        console.log('🖥️ Handling server error');
        
        if (this.ui) {
            this.ui.showError('Server temporarily unavailable. Retrying...');
        }
        
        // Exponential backoff retry
        const attempt = this.retryAttempts.get(this.getErrorKey(error)) || 0;
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        
        this.scheduleRetry(error, context, delay);
    }
    
    shouldAutoRetry(error) {
        // Auto-retry for these error types
        const retryableErrors = [
            'NetworkError',
            'TypeError', // Often network-related
            'AbortError'
        ];
        
        return retryableErrors.includes(error.name) || 
               error.message.includes('fetch') ||
               error.message.includes('network');
    }
    
    scheduleRetry(error, context, delay = 2000) {
        const errorKey = this.getErrorKey(error);
        const attempts = this.retryAttempts.get(errorKey) || 0;
        
        if (attempts >= this.maxRetries) {
            console.log('❌ Max retries reached for:', errorKey);
            return;
        }
        
        console.log(`⏱️ Scheduling retry ${attempts + 1}/${this.maxRetries} in ${delay}ms`);
        
        setTimeout(() => {
            if (context.retryCallback) {
                try {
                    context.retryCallback();
                } catch (retryError) {
                    this.handle(retryError, 'Retry failed', context);
                }
            }
        }, delay);
    }
    
    logError(type, error, context = {}) {
        const errorEntry = {
            type,
            name: error.name || 'UnknownError',
            message: error.message || error.toString(),
            stack: error.stack,
            context,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            online: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled
        };
        
        this.errors.push(errorEntry);
        
        // Limit stored errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Store persistently for analysis
        try {
            const stored = localStorage.getItem('checkout_errors') || '[]';
            const allErrors = JSON.parse(stored);
            allErrors.push(errorEntry);
            
            // Keep only last 100 errors
            if (allErrors.length > 100) {
                allErrors.splice(0, allErrors.length - 100);
            }
            
            localStorage.setItem('checkout_errors', JSON.stringify(allErrors));
        } catch (e) {
            console.error('Failed to store error:', e);
        }
        
        // Send critical errors immediately
        if (this.isCriticalError(error)) {
            this.reportCriticalError(errorEntry);
        }
    }
    
    isCriticalError(error) {
        const criticalPatterns = [
            'SecurityError',
            'TypeError: Cannot read',
            'ReferenceError',
            'Failed to fetch',
            'NetworkError',
            'QuotaExceededError'
        ];
        
        return criticalPatterns.some(pattern => 
            error.name === pattern || error.message?.includes(pattern)
        );
    }
    
    reportCriticalError(errorEntry) {
        console.error('🚨 CRITICAL ERROR:', errorEntry);
        
        // In production, this would send to error tracking service
        // For now, just store locally with high priority
        try {
            const critical = localStorage.getItem('critical_errors') || '[]';
            const errors = JSON.parse(critical);
            errors.push(errorEntry);
            
            // Keep only last 10 critical errors
            if (errors.length > 10) {
                errors.shift();
            }
            
            localStorage.setItem('critical_errors', JSON.stringify(errors));
        } catch (e) {
            console.error('Failed to store critical error:', e);
        }
    }
    
    showError(message) {
        if (this.ui) {
            this.ui.showError(message);
        }
    }
    
    clearError() {
        if (this.ui) {
            this.ui.hideError();
        }
    }
    
    getErrors() {
        return [...this.errors];
    }
    
    getCriticalErrors() {
        try {
            return JSON.parse(localStorage.getItem('critical_errors') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    getErrorStats() {
        const errors = this.getErrors();
        const stats = {
            total: errors.length,
            byType: {},
            recent: errors.slice(-5),
            criticalCount: this.getCriticalErrors().length
        };
        
        errors.forEach(error => {
            stats.byType[error.name] = (stats.byType[error.name] || 0) + 1;
        });
        
        return stats;
    }
    
    reset() {
        this.errors = [];
        this.retryAttempts.clear();
        
        // Clear stored errors
        try {
            localStorage.removeItem('checkout_errors');
            localStorage.removeItem('critical_errors');
        } catch (e) {
            console.error('Failed to clear error storage:', e);
        }
    }
}

// Make globally available
window.ErrorHandler = ErrorHandler;