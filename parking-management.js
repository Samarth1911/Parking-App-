// ==========================================
// PARKING MANAGEMENT SYSTEM - JAVASCRIPT
// parking-management.js
// ==========================================

// Configuration
const CONFIG = {
    ARDUINO_CONNECTION_URL: 'ws://192.168.1.100:8080', // Replace with your ESP32 IP address
    TOTAL_SLOTS: 3,
    TIMER_DURATION: 3600, // 1 hour in seconds
    SLOT_CHECK_INTERVAL: 1000, // Check every second
    RECONNECT_INTERVAL: 5000 // Reconnect after 5 seconds
};

// State Management
const state = {
    userSlot: null,
    bookedSlotId: null,
    timeRemaining: 0,
    timerStarted: false,
    isVehicleDetected: false,
    arduinoConnected: false,
    allSlots: [],
    timerInterval: null,
    websocket: null
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('parkingUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Load user's booking
    loadUserBooking();
    
    // Initialize slots
    initializeSlots();
    
    // Connect to Arduino
    connectToArduino();
    
    // Setup event listeners
    setupEventListeners();
}

// ==========================================
// SLOT MANAGEMENT
// ==========================================

function initializeSlots() {
    const slotGrid = document.getElementById('slotGrid');
    slotGrid.innerHTML = '';
    
    state.allSlots = [];
    
    for (let i = 1; i <= CONFIG.TOTAL_SLOTS; i++) {
        const slot = {
            id: i,
            isBooked: false,
            isOccupied: false,
            bookedBy: null
        };
        
        state.allSlots.push(slot);
        
        const slotElement = createSlotElement(slot);
        slotGrid.appendChild(slotElement);
    }
}

function createSlotElement(slot) {
    const div = document.createElement('div');
    div.id = `slot-${slot.id}`;
    div.className = `relative p-4 rounded-lg border-2 transition-all cursor-pointer ${getSlotClass(slot)}`;
    
    div.innerHTML = `
        <div class="text-center">
            <div class="text-2xl font-bold mb-1">P${slot.id}</div>
            <div class="text-xs font-semibold">${getSlotStatus(slot)}</div>
        </div>
    `;
    
    return div;
}

function getSlotClass(slot) {
    if (slot.id === state.bookedSlotId) {
        if (state.isVehicleDetected) {
            return 'bg-green-100 border-green-500 slot-occupied';
        }
        return 'bg-blue-100 border-blue-500';
    }
    if (slot.isOccupied) {
        return 'bg-red-100 border-red-400';
    }
    if (slot.isBooked) {
        return 'bg-yellow-100 border-yellow-400';
    }
    return 'bg-gray-100 border-gray-300';
}

function getSlotStatus(slot) {
    if (slot.id === state.bookedSlotId) {
        return state.isVehicleDetected ? 'YOUR SLOT (OCCUPIED)' : 'YOUR SLOT';
    }
    if (slot.isOccupied) return 'OCCUPIED';
    if (slot.isBooked) return 'BOOKED';
    return 'AVAILABLE';
}

function updateSlotDisplay(slotId) {
    const slot = state.allSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    const slotElement = document.getElementById(`slot-${slotId}`);
    if (slotElement) {
        slotElement.className = `relative p-4 rounded-lg border-2 transition-all cursor-pointer ${getSlotClass(slot)}`;
        slotElement.querySelector('.text-xs').textContent = getSlotStatus(slot);
    }
}

// ==========================================
// USER BOOKING MANAGEMENT
// ==========================================

function loadUserBooking() {
    // Get latest booking from storage
    const bookings = JSON.parse(localStorage.getItem('parkingBookings') || '[]');
    
    if (bookings.length > 0) {
        const latestBooking = bookings[bookings.length - 1];
        
        // Assign a slot (random for demo, should be from booking system)
        state.bookedSlotId = Math.floor(Math.random() * CONFIG.TOTAL_SLOTS) + 1;
        state.timeRemaining = CONFIG.TIMER_DURATION;
        
        // Update UI
        document.getElementById('yourSlotId').textContent = `P${state.bookedSlotId}`;
        document.getElementById('locationName').textContent = latestBooking.spotName;
        document.getElementById('bookingTime').textContent = new Date(latestBooking.date).toLocaleTimeString();
        
        // Mark slot as booked
        const slot = state.allSlots.find(s => s.id === state.bookedSlotId);
        if (slot) {
            slot.isBooked = true;
            slot.bookedBy = 'current_user';
        }
        
        updateSlotDisplay(state.bookedSlotId);
        updateTimerDisplay();
    } else {
        // No booking found
        document.getElementById('yourSlotCard').innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-600 mb-4">No active booking found</p>
                <a href="dashboard.html" class="text-blue-600 hover:text-blue-700 font-semibold">
                    Go to Dashboard to Book
                </a>
            </div>
        `;
    }
}

// ==========================================
// TIMER MANAGEMENT
// ==========================================

function startTimer() {
    if (state.timerStarted) return;
    
    state.timerStarted = true;
    updateSlotStatus('Vehicle Detected - Timer Running');
    
    state.timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateTimerDisplay();
        
        if (state.timeRemaining <= 0) {
            handleTimerEnd();
        } else if (state.timeRemaining === 300) {
            // 5 minutes warning
            showNotification(
                'Time Warning',
                'Only 5 minutes remaining in your parking slot!',
                [{ text: 'OK', color: 'blue', handler: closeNotification }],
                'orange'
            );
        }
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    state.timerStarted = false;
}

function updateTimerDisplay() {
    const hours = Math.floor(state.timeRemaining / 3600);
    const minutes = Math.floor((state.timeRemaining % 3600) / 60);
    const seconds = state.timeRemaining % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timeRemaining').textContent = timeString;
}

function handleTimerEnd() {
    stopTimer();
    
    const slotAvailable = !checkIfOtherVehicleWaiting();
    
    if (slotAvailable) {
        showTimerEndPopup(
            'Thank you for using Reserve and Park! Your parking time has ended. Would you like to extend your booking?',
            true
        );
    } else {
        showTimerEndPopup(
            'Thank you for using Reserve and Park! Your parking time has ended. Please vacate the slot as soon as possible.',
            false
        );
    }
}

function checkIfOtherVehicleWaiting() {
    // In production, check with backend if there are pending bookings
    return Math.random() > 0.5; // Random for demo
}

// ==========================================
// ARDUINO COMMUNICATION
// ==========================================

function connectToArduino() {
    updateConnectionStatus('connecting', 'Connecting to ESP32...');
    
    try {
        // Create WebSocket connection to ESP32
        state.websocket = new WebSocket(CONFIG.ARDUINO_CONNECTION_URL);
        
        state.websocket.onopen = function() {
            state.arduinoConnected = true;
            updateConnectionStatus('connected', 'ESP32 Connected');
            console.log('Connected to ESP32');
            
            // Send slot ID to Arduino
            if (state.bookedSlotId) {
                sendToArduino({ command: 'SET_SLOT', slotId: state.bookedSlotId });
            }
        };
        
        state.websocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleArduinoMessage(data);
            } catch (error) {
                console.error('Error parsing Arduino message:', error);
            }
        };
        
        state.websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
            updateConnectionStatus('error', 'Connection Error');
        };
        
        state.websocket.onclose = function() {
            state.arduinoConnected = false;
            updateConnectionStatus('disconnected', 'ESP32 Disconnected');
            console.log('Disconnected from ESP32. Reconnecting...');
            
            // Attempt to reconnect after delay
            setTimeout(connectToArduino, CONFIG.RECONNECT_INTERVAL);
        };
        
    } catch (error) {
        console.error('Failed to connect to ESP32:', error);
        updateConnectionStatus('error', 'Connection Failed');
        
        // Retry connection after delay
        setTimeout(connectToArduino, CONFIG.RECONNECT_INTERVAL);
    }
}

function sendToArduino(data) {
    if (state.websocket && state.websocket.readyState === WebSocket.OPEN) {
        const jsonData = JSON.stringify(data);
        state.websocket.send(jsonData);
        console.log('Sent to ESP32:', jsonData);
    } else {
        console.warn('WebSocket not connected. Cannot send data.');
    }
}

function handleArduinoMessage(data) {
    console.log('Arduino message:', data);
    
    switch(data.event) {
        case 'VEHICLE_DETECTED':
            handleVehicleDetection(data.slotId);
            break;
        case 'VEHICLE_LEFT':
            handleVehicleLeft(data.slotId);
            break;
        case 'SENSOR_ERROR':
            handleSensorError(data.slotId);
            break;
        case 'SLOT_ASSIGNED':
            console.log('Slot assignment confirmed:', data.slotId);
            break;
        case 'SLOT_RELEASED':
            console.log('Slot released:', data.slotId);
            break;
        case 'CONNECTED':
            console.log('ESP32 connection confirmed:', data.message);
            break;
        case 'STATUS_REPORT':
            console.log('ESP32 Status:', data);
            break;
        default:
            console.log('Unknown event from ESP32:', data.event);
    }
}

function handleVehicleDetection(slotId) {
    if (slotId !== state.bookedSlotId) {
        // Wrong slot detected
        console.log('Vehicle detected in different slot:', slotId);
        return;
    }
    
    state.isVehicleDetected = true;
    updateSlotStatus('Vehicle Detected');
    updateSensorStatus('Vehicle Present');
    updateSlotDisplay(slotId);
    
    // Request approval from user
    showNotification(
        'Vehicle Detected',
        `A vehicle has been detected at your parking slot P${slotId}. Is this your vehicle?`,
        [
            { 
                text: 'Yes, It\'s Mine', 
                color: 'green', 
                handler: () => approveVehicle(slotId) 
            },
            { 
                text: 'No, Not Mine', 
                color: 'red', 
                handler: () => rejectVehicle(slotId) 
            }
        ],
        'blue'
    );
}

function approveVehicle(slotId) {
    closeNotification();
    
    const slot = state.allSlots.find(s => s.id === slotId);
    if (slot) {
        slot.isOccupied = true;
        updateSlotDisplay(slotId);
    }
    
    updateSlotStatus('Vehicle Parked - Timer Active');
    updateSensorStatus('Approved');
    startTimer();
    
    showNotification(
        'Parking Confirmed',
        'Your vehicle has been confirmed. Timer has started. Enjoy your parking!',
        [{ text: 'OK', color: 'blue', handler: closeNotification }],
        'green'
    );
}

function rejectVehicle(slotId) {
    closeNotification();
    
    state.isVehicleDetected = false;
    updateSlotDisplay(slotId);
    updateSensorStatus('Unauthorized Vehicle');
    
    // Send alert to security
    sendSecurityAlert(slotId);
    
    showEmergencyAlert(
        `⚠️ UNAUTHORIZED VEHICLE DETECTED at Slot P${slotId}!\n\nSecurity has been notified. Please contact security immediately if you see any suspicious activity.`
    );
}

function handleVehicleLeft(slotId) {
    if (slotId === state.bookedSlotId) {
        const slot = state.allSlots.find(s => s.id === slotId);
        if (slot) {
            slot.isOccupied = false;
        }
        
        state.isVehicleDetected = false;
        updateSlotDisplay(slotId);
        updateSensorStatus('Vehicle Left');
        
        if (state.timerStarted && state.timeRemaining > 0) {
            showNotification(
                'Vehicle Left Early',
                'Your vehicle has left the parking slot before the timer ended. Would you like to end the session?',
                [
                    { text: 'End Session', color: 'red', handler: endSession },
                    { text: 'Keep Running', color: 'blue', handler: closeNotification }
                ],
                'orange'
            );
        }
    }
}

function handleSensorError(slotId) {
    showNotification(
        'Sensor Alert',
        `There seems to be an issue with the sensor at Slot P${slotId}. Please contact support if you experience any problems.`,
        [{ text: 'OK', color: 'blue', handler: closeNotification }],
        'orange'
    );
}

function sendSecurityAlert(slotId) {
    // In production, send alert to backend/security system
    console.log(`SECURITY ALERT: Unauthorized vehicle at Slot ${slotId}`);
    
    // Send to Arduino to trigger alarm
    sendToArduino({ command: 'TRIGGER_ALARM', slotId: slotId });
}

// ==========================================
// UI UPDATE FUNCTIONS
// ==========================================

function updateSlotStatus(status) {
    document.getElementById('slotStatus').textContent = status;
}

function updateSensorStatus(status) {
    document.getElementById('sensorStatus').textContent = status;
}

function updateConnectionStatus(status, text) {
    const dot = document.getElementById('connectionDot');
    const textEl = document.getElementById('connectionText');
    
    textEl.textContent = text;
    
    dot.className = 'w-3 h-3 rounded-full';
    if (status === 'connected') {
        dot.classList.add('bg-green-500');
    } else if (status === 'connecting') {
        dot.classList.add('bg-yellow-500');
    } else {
        dot.classList.add('bg-red-500');
    }
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

function showNotification(title, message, buttons, headerColor = 'blue') {
    const popup = document.getElementById('notificationPopup');
    const header = document.getElementById('popupHeader');
    const titleEl = document.getElementById('popupTitle');
    const messageEl = document.getElementById('popupMessage');
    const buttonsContainer = document.getElementById('popupButtons');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    header.className = `bg-${headerColor}-600 text-white p-4`;
    
    buttonsContainer.innerHTML = '';
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.className = `flex-1 bg-${btn.color}-600 text-white py-2 rounded-lg font-semibold hover:bg-${btn.color}-700 transition`;
        button.onclick = btn.handler;
        buttonsContainer.appendChild(button);
    });
    
    popup.classList.remove('hidden');
}

function closeNotification() {
    document.getElementById('notificationPopup').classList.add('hidden');
}

function showEmergencyAlert(message) {
    document.getElementById('emergencyMessage').textContent = message;
    document.getElementById('emergencyPopup').classList.remove('hidden');
}

function closeEmergencyAlert() {
    document.getElementById('emergencyPopup').classList.add('hidden');
}

function showTimerEndPopup(message, canExtend) {
    document.getElementById('timerEndMessage').textContent = message;
    
    const extendBtn = document.getElementById('extendTimingBtn');
    if (canExtend) {
        extendBtn.classList.remove('hidden');
    } else {
        extendBtn.classList.add('hidden');
    }
    
    document.getElementById('timerEndPopup').classList.remove('hidden');
}

function closeTimerEndPopup() {
    document.getElementById('timerEndPopup').classList.add('hidden');
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Emergency alert close
    document.getElementById('closeEmergencyBtn').addEventListener('click', closeEmergencyAlert);
    
    // Timer end popup buttons
    document.getElementById('extendTimingBtn').addEventListener('click', () => {
        closeTimerEndPopup();
        extendParkingTime();
    });
    
    document.getElementById('completeBookingBtn').addEventListener('click', () => {
        closeTimerEndPopup();
        endSession();
    });
    
    // Extend time button
    document.getElementById('extendTimeBtn').addEventListener('click', () => {
        extendParkingTime();
    });
}

function extendParkingTime() {
    showNotification(
        'Extend Parking Time',
        'How much additional time would you like?',
        [
            { text: '30 Min (₹20)', color: 'blue', handler: () => addTime(1800, 20) },
            { text: '1 Hour (₹35)', color: 'blue', handler: () => addTime(3600, 35) },
            { text: 'Cancel', color: 'gray', handler: closeNotification }
        ],
        'purple'
    );
}

function addTime(seconds, amount) {
    closeNotification();
    
    // Process payment (simplified for demo)
    state.timeRemaining += seconds;
    updateTimerDisplay();
    
    if (!state.timerStarted) {
        startTimer();
    }
    
    showNotification(
        'Time Extended',
        `Your parking time has been extended. Amount paid: ₹${amount}`,
        [{ text: 'OK', color: 'blue', handler: closeNotification }],
        'green'
    );
}

function endSession() {
    stopTimer();
    
    const slot = state.allSlots.find(s => s.id === state.bookedSlotId);
    if (slot) {
        slot.isBooked = false;
        slot.isOccupied = false;
        slot.bookedBy = null;
    }
    
    updateSlotDisplay(state.bookedSlotId);
    
    // Send command to Arduino to release slot
    sendToArduino({ command: 'RELEASE_SLOT', slotId: state.bookedSlotId });
    
    showNotification(
        'Session Ended',
        'Thank you for using Reserve and Park! Your session has been completed successfully.',
        [{ 
            text: 'Return to Dashboard', 
            color: 'blue', 
            handler: () => window.location.href = 'dashboard.html' 
        }],
        'green'
    );
}

// ==========================================
// WINDOW UNLOAD - CLEANUP
// ==========================================

window.addEventListener('beforeunload', function() {
    if (state.websocket && state.websocket.readyState === WebSocket.OPEN) {
        state.websocket.close();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        state,
        handleArduinoMessage,
        approveVehicle,
        rejectVehicle,
        sendToArduino,
        connectToArduino
    };
}