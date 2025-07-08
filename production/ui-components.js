/**
 * UI Components Manager
 * Handles all UI updates and animations
 */
class UIComponents {
    constructor() {
        this.currentStep = 1;
        this.elements = this.cacheElements();
        this.setupEventListeners();
        this.updateDeviceInfo();
    }
    
    cacheElements() {
        return {
            steps: document.querySelectorAll('.checkout-step'),
            progressSteps: document.querySelectorAll('.progress-step'),
            progressLines: document.querySelectorAll('.progress-line'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            errorContainer: document.getElementById('errorContainer'),
            errorText: document.getElementById('errorText'),
            deviceType: document.getElementById('deviceType'),
            step2Button: document.getElementById('step2Button'),
            confirmCheckbox: document.getElementById('confirmReceipt')
        };
    }
    
    setupEventListeners() {
        // Listen for state changes
        window.addEventListener('flowStateChanged', (e) => {
            this.handleStateChange(e.detail.state);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateDeviceInfo();
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateDeviceInfo();
            }, 100);
        });
    }
    
    handleStateChange(state) {
        console.log('🎨 UI updating for state change:', state);
        
        // Update step display
        this.showStep(state.currentStep);
        
        // Handle returning user
        if (state.isReturning && state.currentStep === 2) {
            this.showSuccessAnimation();
        }
    }
    
    showStep(stepNumber) {
        console.log(`🎯 Showing step ${stepNumber}`);
        
        // Validate step number
        if (stepNumber < 1 || stepNumber > 3) {
            console.error('Invalid step number:', stepNumber);
            return;
        }
        
        // Hide all steps
        this.elements.steps.forEach(step => {
            step.classList.remove('active');
        });
        
        // Show target step with animation
        const targetStep = document.getElementById(`step${stepNumber}`);
        if (targetStep) {
            // Small delay for smooth transition
            setTimeout(() => {
                targetStep.classList.add('active');
                
                // Scroll to top on mobile
                if (window.innerWidth <= 640) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);
        }
        
        // Update progress indicator
        this.updateProgressIndicator(stepNumber);
        
        // Update flow diagrams
        this.updateFlowDiagrams(stepNumber);
        
        this.currentStep = stepNumber;
        
        // Track step view
        if (window.tracker) {
            window.tracker.track('step_viewed', {
                step: stepNumber,
                timestamp: Date.now()
            });
        }
    }
    
    updateProgressIndicator(stepNumber) {
        this.elements.progressSteps.forEach((step, index) => {
            const stepNum = index + 1;
            
            // Remove all classes first
            step.classList.remove('active', 'completed');
            
            if (stepNum < stepNumber) {
                step.classList.add('completed');
            } else if (stepNum === stepNumber) {
                step.classList.add('active');
            }
        });
        
        // Update progress lines
        this.elements.progressLines.forEach((line, index) => {
            if (index < stepNumber - 1) {
                line.classList.add('completed');
            } else {
                line.classList.remove('completed');
            }
        });
    }
    
    updateFlowDiagrams(stepNumber) {
        const diagrams = document.querySelectorAll('.flow-diagram');
        
        diagrams.forEach(diagram => {
            const steps = diagram.querySelectorAll('.flow-step');
            const arrows = diagram.querySelectorAll('.flow-arrow');
            
            steps.forEach((step, index) => {
                const stepIndex = index + 1;
                
                // Remove all classes
                step.classList.remove('current', 'completed', 'inactive');
                
                if (stepIndex < stepNumber) {
                    step.classList.add('completed');
                } else if (stepIndex === stepNumber) {
                    step.classList.add('current');
                } else {
                    step.classList.add('inactive');
                }
            });
            
            arrows.forEach((arrow, index) => {
                arrow.classList.remove('completed', 'inactive');
                
                if (index < stepNumber - 1) {
                    arrow.classList.add('completed');
                } else if (index >= stepNumber) {
                    arrow.classList.add('inactive');
                }
            });
        });
    }
    
    showLoading(message = 'Preparing your checkout...') {
        const overlay = this.elements.loadingOverlay;
        const text = overlay.querySelector('p');
        
        if (text) {
            text.textContent = message;
        }
        
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Track loading
        if (window.tracker) {
            window.tracker.track('loading_shown', { message });
        }
    }
    
    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Track loading end
        if (window.tracker) {
            window.tracker.track('loading_hidden');
        }
    }
    
    showSuccessAnimation() {
        const successMessage = document.querySelector('.success-message');
        if (successMessage) {
            // Add animation class with delay
            setTimeout(() => {
                successMessage.classList.add('animate-in');
            }, 300);
        }
        
        // Confetti effect on completion
        if (this.currentStep === 3) {
            this.showConfetti();
        }
    }
    
    showConfetti() {
        // Simple confetti effect using CSS animations
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        
        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${this.getRandomColor()};
                top: -10px;
                left: ${Math.random() * 100}%;
                animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
                animation-delay: ${Math.random() * 3}s;
            `;
            confettiContainer.appendChild(confetti);
        }
        
        // Add confetti styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes confetti-fall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(confettiContainer);
        
        // Clean up after animation
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
            document.head.removeChild(style);
        }, 6000);
    }
    
    getRandomColor() {
        const colors = ['#00d4aa', '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    showError(message, type = 'error') {
        console.log('❌ Showing error:', message);
        
        this.elements.errorText.textContent = message;
        this.elements.errorContainer.classList.remove('hidden');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideError();
        }, 10000);
        
        // Track error display
        if (window.tracker) {
            window.tracker.track('error_displayed', {
                message,
                type,
                timestamp: Date.now()
            });
        }
    }
    
    hideError() {
        this.elements.errorContainer.classList.add('hidden');
    }
    
    showSuccess(message) {
        // Create temporary success message
        const successEl = document.createElement('div');
        successEl.className = 'success-toast';
        successEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #d4edda;
            color: #155724;
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            z-index: 1001;
            animation: slide-down 0.3s ease-out;
        `;
        successEl.textContent = message;
        
        document.body.appendChild(successEl);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            successEl.style.animation = 'slide-up 0.3s ease-out forwards';
            setTimeout(() => {
                if (document.body.contains(successEl)) {
                    document.body.removeChild(successEl);
                }
            }, 300);
        }, 3000);
    }
    
    updateDeviceInfo() {
        if (this.elements.deviceType) {
            const info = this.getDeviceInfo();
            this.elements.deviceType.textContent = `${info.type} | ${info.size}`;
        }
    }
    
    getDeviceInfo() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const ua = navigator.userAgent.toLowerCase();
        
        let type = 'Desktop';
        if (/iphone|ipod/.test(ua)) type = 'iPhone';
        else if (/ipad/.test(ua)) type = 'iPad';
        else if (/android/.test(ua)) type = 'Android';
        else if (width <= 640) type = 'Mobile';
        
        let size = 'Large';
        if (width <= 640) size = 'Small';
        else if (width <= 1024) size = 'Medium';
        
        return { type, size: `${width}x${height}` };
    }
    
    toggleStep2Button() {
        const checkbox = this.elements.confirmCheckbox;
        const button = this.elements.step2Button;
        
        if (!checkbox || !button) return;
        
        if (checkbox.checked) {
            button.disabled = false;
            button.classList.add('enabled');
            
            // Animate button
            button.style.transform = 'scale(1.02)';
            setTimeout(() => {
                button.style.transform = '';
            }, 200);
        } else {
            button.disabled = true;
            button.classList.remove('enabled');
        }
    }
    
    animateButton(buttonElement) {
        if (!buttonElement) return;
        
        buttonElement.classList.add('clicked');
        buttonElement.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            buttonElement.classList.remove('clicked');
            buttonElement.style.transform = '';
        }, 300);
    }
    
    // Utility methods
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    getCurrentStep() {
        return this.currentStep;
    }
    
    // Debug methods
    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.outline = '2px solid red';
            element.style.outlineOffset = '2px';
            
            setTimeout(() => {
                element.style.outline = '';
                element.style.outlineOffset = '';
            }, 2000);
        }
    }
    
    getElementInfo(selector) {
        const element = document.querySelector(selector);
        if (element) {
            const rect = element.getBoundingClientRect();
            return {
                visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
                bounds: rect,
                classes: Array.from(element.classList),
                text: element.textContent.trim()
            };
        }
        return null;
    }
}

// CSS for slide animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-up {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Make globally available
window.UIComponents = UIComponents;