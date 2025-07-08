/**
 * Main Checkout Controller
 * Orchestrates the entire EUR→USDT→POL flow
 */
class CheckoutController {
    constructor() {
        // Initialize components
        this.flow = new BridgeFlowManager();
        this.ui = new UIComponents();
        this.errorHandler = new ErrorHandler();
        
        // Connect components
        this.errorHandler.setUI(this.ui);
        
        // Bind methods to preserve context
        this.startStep1 = this.startStep1.bind(this);
        this.startStep2 = this.startStep2.bind(this);
        this.toggleStep2Button = this.toggleStep2Button.bind(this);
        this.reset = this.reset.bind(this);
        this.clearError = this.clearError.bind(this);
        
        console.log('🚀 Checkout Controller initialized');
        
        // Initialize the flow
        this.init();
    }
    
    init() {
        try {
            // Get current state
            const state = this.flow.getState();
            console.log('📋 Initial state:', state);
            
            // Show current step
            this.ui.showStep(state.currentStep);
            
            // Track initialization
            window.tracker.track('checkout_initialized', {
                step: state.currentStep,
                returning: state.isReturning,
                device: state.device,
                sessionId: state.sessionId
            });
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Check for returning user from SimpleSwap
            this.handleReturningUser(state);
            
            // Show device info
            this.updateDeviceDisplay();
            
            console.log('✅ Checkout initialization complete');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.errorHandler.handle(error, 'Failed to initialize checkout');
        }
    }
    
    setupEventListeners() {
        // Listen for flow state changes
        window.addEventListener('flowStateChanged', (e) => {
            console.log('🔄 Flow state changed:', e.detail.state);
            this.handleStateChange(e.detail.state);
        });
        
        // Listen for browser navigation
        window.addEventListener('popstate', (e) => {
            console.log('🔙 Browser navigation detected');
            this.handleNavigation(e);
        });
        
        // Listen for network status changes
        window.addEventListener('online', () => {
            console.log('🌐 Network restored');
            this.handleNetworkRestored();
        });
        
        window.addEventListener('offline', () => {
            console.log('🌐 Network lost');
            this.handleNetworkLost();
        });
        
        // Listen for keyboard shortcuts (for debugging)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'd':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.showDebugInfo();
                        }
                        break;
                    case 'r':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.reset();
                        }
                        break;
                }
            }
        });
    }
    
    handleReturningUser(state) {
        // Check if user is returning from SimpleSwap
        const referrer = document.referrer;
        const isFromSimpleSwap = referrer.includes('simpleswap.io');
        
        if (isFromSimpleSwap) {
            console.log('👋 Welcome back from SimpleSwap!');
            
            if (state.currentStep === 1 && state.step1StartTime && !state.step1CompleteTime) {
                // User completed EUR→USDT, show step 2
                this.completeStep1();
            } else if (state.currentStep === 3 && state.step2StartTime && !state.step2CompleteTime) {
                // User completed USDT→POL, show success
                this.completeStep2();
            }
        }
    }
    
    handleStateChange(state) {
        // Update UI based on state change
        this.ui.showStep(state.currentStep);
        
        // Handle specific state transitions
        if (state.isReturning) {
            this.ui.showSuccessAnimation();
        }
    }
    
    handleNavigation(event) {
        // Handle browser back/forward buttons
        const state = this.flow.getState();
        this.ui.showStep(state.currentStep);
    }
    
    handleNetworkRestored() {
        this.ui.showSuccess('Connection restored!');
        
        // Retry any failed operations
        const state = this.flow.getState();
        if (state.currentStep === 1 && state.step1StartTime && !state.step1CompleteTime) {
            // User might have been interrupted during step 1
            this.ui.showError('Reconnected! Click the button to retry if needed.');
        }
    }
    
    handleNetworkLost() {
        this.ui.showError('Connection lost. Please check your internet connection.');
    }
    
    updateDeviceDisplay() {
        const deviceElement = document.getElementById('deviceType');
        if (deviceElement) {
            const state = this.flow.getState();
            deviceElement.textContent = `Device: ${state.device}`;
        }
    }
    
    // Main flow methods
    startStep1() {
        try {
            console.log('🚀 Starting Step 1: EUR → USDT');
            
            // Validate prerequisites
            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }
            
            // Show loading state
            this.ui.showLoading('Preparing EUR → USDT exchange...');
            
            // Track step 1 start
            window.tracker.trackStep1Start(19.50);
            
            // Animate button for user feedback
            const button = document.querySelector('.primary-button');
            if (button) {
                this.ui.animateButton(button);
            }
            
            // Get redirect URL from flow manager
            const redirectUrl = this.flow.startEurToUsdt();
            
            console.log('🔗 Redirecting to:', redirectUrl);
            
            // Small delay for user feedback
            setTimeout(() => {
                // Perform redirect
                window.location.href = redirectUrl;
            }, 1000);
            
        } catch (error) {
            console.error('❌ Step 1 failed:', error);
            this.ui.hideLoading();
            
            this.errorHandler.handle(error, 'Failed to start EUR → USDT exchange', {
                step: 1,
                retryCallback: () => this.startStep1(),
                manualCallback: () => {
                    const url = this.flow.getStep1Url();
                    window.open(url, '_blank');
                }
            });
        }
    }
    
    completeStep1() {
        try {
            console.log('✅ Step 1 completed: EUR → USDT');
            
            // Update flow state
            this.flow.updateState({
                currentStep: 2,
                step1CompleteTime: Date.now(),
                isReturning: true
            });
            
            // Calculate duration
            const state = this.flow.getState();
            const duration = state.step1CompleteTime - state.step1StartTime;
            
            // Track completion
            window.tracker.trackStep1Complete(duration);
            
            // Update UI
            this.ui.showStep(2);
            this.ui.showSuccessAnimation();
            
            console.log(`⏱️ Step 1 duration: ${duration}ms`);
            
        } catch (error) {
            console.error('❌ Step 1 completion failed:', error);
            this.errorHandler.handle(error, 'Failed to complete Step 1');
        }
    }
    
    toggleStep2Button() {
        try {
            const checkbox = document.getElementById('confirmReceipt');
            const button = document.getElementById('step2Button');
            
            if (!checkbox || !button) {
                console.warn('⚠️ Step 2 elements not found');
                return;
            }
            
            if (checkbox.checked) {
                button.disabled = false;
                button.classList.add('enabled');
                
                // Track confirmation
                window.tracker.track('usdt_confirmed', {
                    timestamp: Date.now()
                });
                
                console.log('✅ USDT receipt confirmed');
                
            } else {
                button.disabled = true;
                button.classList.remove('enabled');
            }
            
        } catch (error) {
            console.error('❌ Toggle Step 2 button failed:', error);
            this.errorHandler.handle(error, 'Button toggle failed');
        }
    }
    
    startStep2() {
        try {
            console.log('🔄 Starting Step 2: USDT → POL');
            
            // Validate prerequisites
            const checkbox = document.getElementById('confirmReceipt');
            if (!checkbox?.checked) {
                throw new Error('USDT receipt not confirmed');
            }
            
            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }
            
            // Show loading state
            this.ui.showLoading('Preparing USDT → POL conversion...');
            
            // Track step 2 start
            window.tracker.trackStep2Start();
            
            // Animate button
            const button = document.getElementById('step2Button');
            if (button) {
                this.ui.animateButton(button);
            }
            
            // Get redirect URL from flow manager
            const redirectUrl = this.flow.startUsdtToPol();
            
            console.log('🔗 Redirecting to:', redirectUrl);
            
            // Small delay for user feedback
            setTimeout(() => {
                // Perform redirect
                window.location.href = redirectUrl;
            }, 1000);
            
        } catch (error) {
            console.error('❌ Step 2 failed:', error);
            this.ui.hideLoading();
            
            if (error.message.includes('not confirmed')) {
                this.ui.showError('Please confirm you have received your USDT first.');
            } else {
                this.errorHandler.handle(error, 'Failed to start USDT → POL conversion', {
                    step: 2,
                    retryCallback: () => this.startStep2(),
                    manualCallback: () => {
                        const url = this.flow.getStep2Url();
                        window.open(url, '_blank');
                    }
                });
            }
        }
    }
    
    completeStep2() {
        try {
            console.log('🎉 Step 2 completed: USDT → POL');
            
            // Update flow state
            this.flow.updateState({
                currentStep: 3,
                step2CompleteTime: Date.now()
            });
            
            // Complete the entire flow
            this.flow.completeFlow();
            
            // Calculate durations
            const state = this.flow.getState();
            const step2Duration = state.step2CompleteTime - state.step2StartTime;
            const totalDuration = state.step2CompleteTime - state.step1StartTime;
            
            // Track completion
            window.tracker.trackStep2Complete(step2Duration);
            window.tracker.trackFlowComplete(totalDuration);
            
            // Update UI
            this.ui.showStep(3);
            this.ui.showSuccessAnimation();
            
            console.log(`⏱️ Step 2 duration: ${step2Duration}ms`);
            console.log(`⏱️ Total duration: ${totalDuration}ms`);
            console.log('🎯 Checkout flow completed successfully!');
            
        } catch (error) {
            console.error('❌ Step 2 completion failed:', error);
            this.errorHandler.handle(error, 'Failed to complete Step 2');
        }
    }
    
    reset() {
        try {
            console.log('🔄 Resetting checkout flow');
            
            // Confirm with user
            if (!confirm('Are you sure you want to start over? This will clear your progress.')) {
                return;
            }
            
            // Track reset
            window.tracker.track('flow_reset_manual', {
                step: this.flow.getState().currentStep,
                timestamp: Date.now()
            });
            
            // Reset flow manager
            this.flow.reset();
            
            // Reset UI
            this.ui.showStep(1);
            this.ui.hideError();
            
            // Reset step 2 checkbox
            const checkbox = document.getElementById('confirmReceipt');
            if (checkbox) {
                checkbox.checked = false;
                this.toggleStep2Button();
            }
            
            console.log('✅ Checkout flow reset complete');
            
        } catch (error) {
            console.error('❌ Reset failed:', error);
            this.errorHandler.handle(error, 'Failed to reset checkout');
        }
    }
    
    clearError() {
        this.errorHandler.clearError();
    }
    
    // Debug and utility methods
    showDebugInfo() {
        const debugInfo = {
            flow: this.flow.getDebugInfo(),
            ui: {
                currentStep: this.ui.getCurrentStep(),
                elements: Object.keys(this.ui.elements)
            },
            errors: this.errorHandler.getErrorStats(),
            tracker: window.tracker.getDebugInfo(),
            browser: {
                userAgent: navigator.userAgent,
                online: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled,
                language: navigator.language,
                platform: navigator.platform
            }
        };
        
        console.group('🔍 Debug Information');
        console.log('Flow State:', debugInfo.flow);
        console.log('UI State:', debugInfo.ui);
        console.log('Error Stats:', debugInfo.errors);
        console.log('Tracker Info:', debugInfo.tracker);
        console.log('Browser Info:', debugInfo.browser);
        console.groupEnd();
        
        // Also show metrics in a nice format
        this.showMetrics();
        
        return debugInfo;
    }
    
    showMetrics() {
        const metrics = window.tracker.getMetrics();
        
        console.group('📊 Checkout Metrics');
        console.log('Overview:', metrics.overview);
        console.log('Device Breakdown:', metrics.deviceBreakdown);
        console.log('Timing Data:', metrics.timingData);
        console.log('Error Analysis:', metrics.errorAnalysis);
        console.groupEnd();
        
        return metrics;
    }
    
    forceStep(stepNumber) {
        console.log(`🎯 Forcing step ${stepNumber}`);
        
        this.flow.updateState({
            currentStep: stepNumber
        });
        
        this.ui.showStep(stepNumber);
    }
    
    simulateError(message = 'Test error') {
        const error = new Error(message);
        this.errorHandler.handle(error, 'Simulated error for testing');
    }
    
    getState() {
        return {
            flow: this.flow.getState(),
            ui: this.ui.getCurrentStep(),
            errors: this.errorHandler.getErrors().length
        };
    }
}

// Initialize checkout when DOM is loaded
let checkout;
document.addEventListener('DOMContentLoaded', () => {
    try {
        checkout = new CheckoutController();
        
        // Make globally available for debugging and external access
        window.checkout = checkout;
        
        console.log('🎉 Checkout system ready!');
        
    } catch (error) {
        console.error('💥 Failed to initialize checkout:', error);
        
        // Show fallback message
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #f5f5f5;
                font-family: -apple-system, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 400px;
                ">
                    <h1 style="color: #e74c3c; margin-bottom: 16px;">Initialization Failed</h1>
                    <p style="color: #7f8c8d; margin-bottom: 24px;">
                        Unable to start the checkout system. Please refresh the page or try again later.
                    </p>
                    <button onclick="window.location.reload()" style="
                        background: #00d4aa;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    ">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckoutController;
}