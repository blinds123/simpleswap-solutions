/**
 * Metrics Tracker
 * Comprehensive analytics and success tracking
 */
class MetricsTracker {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.events = [];
        this.startTime = Date.now();
        this.device = this.detectDevice();
        this.batchSize = 10;
        this.maxEvents = 100;
        
        // Initialize tracking
        this.track('session_start', {
            device: this.device,
            referrer: document.referrer,
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: this.getViewport(),
            timestamp: this.startTime
        });
        
        // Set up automatic tracking
        this.setupAutoTracking();
        this.setupPerformanceTracking();
    }
    
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('tracker_session_id');
        if (!sessionId) {
            sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('tracker_session_id', sessionId);
        }
        return sessionId;
    }
    
    detectDevice() {
        const ua = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;
        
        // Detailed device detection
        if (/iphone/.test(ua)) return 'iphone';
        if (/ipad/.test(ua)) return 'ipad';
        if (/android/.test(ua)) {
            if (/mobile/.test(ua)) return 'android_phone';
            return 'android_tablet';
        }
        if (/mobile|phone/.test(ua)) return 'other_mobile';
        if (width <= 640) return 'small_screen';
        if (width <= 1024) return 'tablet';
        
        // Desktop detection
        if (/mac/.test(ua)) return 'mac';
        if (/win/.test(ua)) return 'windows';
        if (/linux/.test(ua)) return 'linux';
        
        return 'unknown';
    }
    
    getViewport() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            ratio: window.devicePixelRatio || 1,
            orientation: window.screen?.orientation?.type || 'unknown'
        };
    }
    
    setupAutoTracking() {
        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            this.track('visibility_change', {
                hidden: document.hidden,
                duration: Date.now() - this.startTime
            });
            
            if (document.hidden) {
                this.flush(); // Save events when tab becomes hidden
            }
        });
        
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.track('session_end', {
                duration: Date.now() - this.startTime,
                eventCount: this.events.length
            });
            this.flush();
        });
        
        // Track page focus/blur
        window.addEventListener('focus', () => {
            this.track('page_focus', {
                duration: Date.now() - this.startTime
            });
        });
        
        window.addEventListener('blur', () => {
            this.track('page_blur', {
                duration: Date.now() - this.startTime
            });
        });
        
        // Track viewport changes
        window.addEventListener('resize', () => {
            this.track('viewport_change', {
                viewport: this.getViewport()
            });
        });
        
        // Track orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.track('orientation_change', {
                    viewport: this.getViewport(),
                    orientation: window.screen?.orientation?.type
                });
            }, 100);
        });
        
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Track milestone scrolls
                if (scrollPercent >= 25 && maxScroll < 25) {
                    this.track('scroll_milestone', { percent: 25 });
                } else if (scrollPercent >= 50 && maxScroll < 50) {
                    this.track('scroll_milestone', { percent: 50 });
                } else if (scrollPercent >= 75 && maxScroll < 75) {
                    this.track('scroll_milestone', { percent: 75 });
                } else if (scrollPercent >= 90 && maxScroll < 90) {
                    this.track('scroll_milestone', { percent: 90 });
                }
            }
        });
        
        // Track clicks on important elements
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Track button clicks
            if (target.tagName === 'BUTTON' || target.closest('button')) {
                const button = target.tagName === 'BUTTON' ? target : target.closest('button');
                this.track('button_click', {
                    text: button.textContent.trim(),
                    className: button.className,
                    id: button.id,
                    disabled: button.disabled
                });
            }
            
            // Track link clicks
            if (target.tagName === 'A' || target.closest('a')) {
                const link = target.tagName === 'A' ? target : target.closest('a');
                this.track('link_click', {
                    href: link.href,
                    text: link.textContent.trim(),
                    external: !link.href.includes(window.location.hostname)
                });
            }
        });
        
        // Track form interactions
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.track('checkbox_change', {
                    id: e.target.id,
                    checked: e.target.checked,
                    name: e.target.name
                });
            }
        });
    }
    
    setupPerformanceTracking() {
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.track('page_performance', {
                        loadTime: navigation.loadEventEnd - navigation.fetchStart,
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                        firstPaint: this.getFirstPaint(),
                        largestContentfulPaint: this.getLCP()
                    });
                }
            }, 1000);
        });
        
        // Track Core Web Vitals
        this.trackWebVitals();
    }
    
    getFirstPaint() {
        const fpEntry = performance.getEntriesByName('first-paint')[0];
        return fpEntry ? fpEntry.startTime : null;
    }
    
    getLCP() {
        return new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                resolve(lastEntry.startTime);
            });
            
            try {
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, 5000);
            } catch (e) {
                resolve(null);
            }
        });
    }
    
    trackWebVitals() {
        // Cumulative Layout Shift
        let clsValue = 0;
        let clsEntries = [];
        
        try {
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        clsEntries.push(entry);
                    }
                }
            });
            
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            
            // Report CLS after 5 seconds
            setTimeout(() => {
                clsObserver.disconnect();
                this.track('web_vitals', {
                    metric: 'CLS',
                    value: clsValue,
                    rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
                });
            }, 5000);
        } catch (e) {
            console.log('CLS tracking not supported');
        }
        
        // First Input Delay
        try {
            const fidObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const fid = entry.processingStart - entry.startTime;
                    this.track('web_vitals', {
                        metric: 'FID',
                        value: fid,
                        rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
                    });
                    
                    fidObserver.disconnect();
                    break;
                }
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.log('FID tracking not supported');
        }
    }
    
    track(eventName, properties = {}) {
        const event = {
            name: eventName,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            properties: {
                ...properties,
                device: this.device,
                pageUrl: window.location.href,
                sessionDuration: Date.now() - this.startTime,
                eventSequence: this.events.length + 1
            }
        };
        
        this.events.push(event);
        
        // Log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('📊 Track:', eventName, properties);
        }
        
        // Send immediately for critical events
        if (this.isCriticalEvent(eventName)) {
            this.sendEvent(event);
        }
        
        // Batch send
        if (this.events.length >= this.batchSize) {
            this.flush();
        }
        
        // Prevent memory issues
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.batchSize);
        }
    }
    
    isCriticalEvent(eventName) {
        const criticalEvents = [
            'session_start',
            'step1_started',
            'step1_completed',
            'step2_started',
            'step2_completed',
            'flow_completed',
            'error_occurred',
            'checkout_abandoned',
            'session_end'
        ];
        return criticalEvents.includes(eventName);
    }
    
    sendEvent(event) {
        // Store in localStorage for persistence
        try {
            const stored = localStorage.getItem('checkout_analytics') || '[]';
            const analytics = JSON.parse(stored);
            analytics.push(event);
            
            // Keep only last 200 events
            if (analytics.length > 200) {
                analytics.splice(0, analytics.length - 200);
            }
            
            localStorage.setItem('checkout_analytics', JSON.stringify(analytics));
        } catch (e) {
            console.error('Failed to store analytics:', e);
        }
        
        // In production, this would also send to analytics service
        // fetch('/analytics', { method: 'POST', body: JSON.stringify(event) });
    }
    
    flush() {
        // Send all pending events
        this.events.forEach(event => this.sendEvent(event));
        this.events = [];
    }
    
    // Success rate calculations
    getMetrics() {
        try {
            const stored = localStorage.getItem('checkout_analytics') || '[]';
            const analytics = JSON.parse(stored);
            
            // Calculate success metrics
            const sessions = [...new Set(analytics.map(e => e.sessionId))];
            const checkoutsStarted = analytics.filter(e => e.name === 'step1_started').length;
            const step1Completed = analytics.filter(e => e.name === 'step1_completed').length;
            const step2Completed = analytics.filter(e => e.name === 'step2_completed').length;
            const flowsCompleted = analytics.filter(e => e.name === 'flow_completed').length;
            const errors = analytics.filter(e => e.name === 'error_occurred').length;
            
            // Device breakdown
            const deviceBreakdown = this.getDeviceBreakdown(analytics);
            
            // Timing analysis
            const timingData = this.getTimingAnalysis(analytics);
            
            // Error analysis
            const errorAnalysis = this.getErrorAnalysis(analytics);
            
            return {
                overview: {
                    totalSessions: sessions.length,
                    checkoutsStarted,
                    step1Completed,
                    step2Completed,
                    flowsCompleted,
                    errors,
                    successRate: checkoutsStarted > 0 ? ((flowsCompleted / checkoutsStarted) * 100).toFixed(1) : '0',
                    step1CompletionRate: checkoutsStarted > 0 ? ((step1Completed / checkoutsStarted) * 100).toFixed(1) : '0',
                    step2CompletionRate: step1Completed > 0 ? ((step2Completed / step1Completed) * 100).toFixed(1) : '0',
                    errorRate: checkoutsStarted > 0 ? ((errors / checkoutsStarted) * 100).toFixed(1) : '0'
                },
                deviceBreakdown,
                timingData,
                errorAnalysis,
                recentEvents: analytics.slice(-10)
            };
        } catch (e) {
            console.error('Failed to calculate metrics:', e);
            return {
                overview: {
                    totalSessions: 0,
                    checkoutsStarted: 0,
                    successRate: '0',
                    errorRate: '0'
                },
                deviceBreakdown: {},
                timingData: {},
                errorAnalysis: {},
                recentEvents: []
            };
        }
    }
    
    getDeviceBreakdown(analytics) {
        const devices = {};
        const deviceSuccessRates = {};
        
        analytics.forEach(event => {
            const device = event.properties.device;
            if (!devices[device]) {
                devices[device] = {
                    total: 0,
                    started: 0,
                    completed: 0
                };
            }
            
            devices[device].total++;
            
            if (event.name === 'step1_started') {
                devices[device].started++;
            } else if (event.name === 'flow_completed') {
                devices[device].completed++;
            }
        });
        
        // Calculate success rates per device
        Object.keys(devices).forEach(device => {
            const data = devices[device];
            deviceSuccessRates[device] = {
                ...data,
                successRate: data.started > 0 ? ((data.completed / data.started) * 100).toFixed(1) : '0'
            };
        });
        
        return deviceSuccessRates;
    }
    
    getTimingAnalysis(analytics) {
        const timings = {
            step1Durations: [],
            step2Durations: [],
            totalDurations: []
        };
        
        // Group events by session
        const sessions = {};
        analytics.forEach(event => {
            if (!sessions[event.sessionId]) {
                sessions[event.sessionId] = [];
            }
            sessions[event.sessionId].push(event);
        });
        
        // Calculate durations
        Object.values(sessions).forEach(sessionEvents => {
            const step1Start = sessionEvents.find(e => e.name === 'step1_started');
            const step1Complete = sessionEvents.find(e => e.name === 'step1_completed');
            const step2Start = sessionEvents.find(e => e.name === 'step2_started');
            const step2Complete = sessionEvents.find(e => e.name === 'step2_completed');
            
            if (step1Start && step1Complete) {
                timings.step1Durations.push(step1Complete.timestamp - step1Start.timestamp);
            }
            
            if (step2Start && step2Complete) {
                timings.step2Durations.push(step2Complete.timestamp - step2Start.timestamp);
            }
            
            if (step1Start && step2Complete) {
                timings.totalDurations.push(step2Complete.timestamp - step1Start.timestamp);
            }
        });
        
        // Calculate averages
        return {
            averageStep1Duration: this.average(timings.step1Durations),
            averageStep2Duration: this.average(timings.step2Durations),
            averageTotalDuration: this.average(timings.totalDurations),
            medianStep1Duration: this.median(timings.step1Durations),
            medianStep2Duration: this.median(timings.step2Durations),
            medianTotalDuration: this.median(timings.totalDurations)
        };
    }
    
    getErrorAnalysis(analytics) {
        const errors = analytics.filter(e => e.name === 'error_occurred');
        const errorTypes = {};
        const errorsByDevice = {};
        
        errors.forEach(error => {
            const type = error.properties.type || 'Unknown';
            const device = error.properties.device;
            
            errorTypes[type] = (errorTypes[type] || 0) + 1;
            
            if (!errorsByDevice[device]) {
                errorsByDevice[device] = 0;
            }
            errorsByDevice[device]++;
        });
        
        return {
            totalErrors: errors.length,
            errorTypes,
            errorsByDevice,
            recentErrors: errors.slice(-5).map(e => ({
                time: new Date(e.timestamp).toLocaleString(),
                type: e.properties.type,
                message: e.properties.userMessage || e.properties.message,
                device: e.properties.device
            }))
        };
    }
    
    average(arr) {
        return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    }
    
    median(arr) {
        if (arr.length === 0) return 0;
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? 
            Math.round((sorted[mid - 1] + sorted[mid]) / 2) : 
            sorted[mid];
    }
    
    // Helper methods for specific tracking
    trackCheckoutStart() {
        this.track('checkout_started', {
            timestamp: Date.now(),
            device: this.device
        });
    }
    
    trackStep1Start(amount) {
        this.track('step1_started', {
            amount,
            timestamp: Date.now()
        });
    }
    
    trackStep1Complete(duration) {
        this.track('step1_completed', {
            duration,
            timestamp: Date.now()
        });
    }
    
    trackStep2Start() {
        this.track('step2_started', {
            timestamp: Date.now()
        });
    }
    
    trackStep2Complete(duration) {
        this.track('step2_completed', {
            duration,
            timestamp: Date.now()
        });
    }
    
    trackFlowComplete(totalDuration) {
        this.track('flow_completed', {
            totalDuration,
            timestamp: Date.now()
        });
    }
    
    trackError(error, context) {
        this.track('error_occurred', {
            type: error.name,
            message: error.message,
            context,
            timestamp: Date.now()
        });
    }
    
    trackAbandonment(step, reason) {
        this.track('checkout_abandoned', {
            step,
            reason,
            timestamp: Date.now()
        });
    }
    
    // Debug and utility methods
    exportData() {
        const data = {
            events: this.events,
            stored: localStorage.getItem('checkout_analytics'),
            metrics: this.getMetrics(),
            sessionInfo: {
                sessionId: this.sessionId,
                device: this.device,
                startTime: this.startTime,
                duration: Date.now() - this.startTime
            }
        };
        
        console.log('📊 Analytics Export:', data);
        return data;
    }
    
    clearData() {
        this.events = [];
        try {
            localStorage.removeItem('checkout_analytics');
        } catch (e) {
            console.error('Failed to clear analytics:', e);
        }
    }
    
    getDebugInfo() {
        return {
            sessionId: this.sessionId,
            device: this.device,
            eventCount: this.events.length,
            sessionDuration: Date.now() - this.startTime,
            metrics: this.getMetrics()
        };
    }
}

// Create global instance
window.tracker = new MetricsTracker();

// Make class available globally for debugging
window.MetricsTracker = MetricsTracker;