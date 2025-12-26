// ==========================================
// FIREBASE INTEGRATION
// firebase-config.js
// ==========================================

/**
 * Firebase Configuration
 * Replace with your actual Firebase project credentials
 */
const firebaseConfig = {
  apiKey: "AIzaSyCCRcNZ1Zuy-1xAzljlx1kCOphfpYNNZOg",
  authDomain: "reserve-and-park.firebaseapp.com",
  databaseURL: "https://reserve-and-park-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "reserve-and-park",
  storageBucket: "reserve-and-park.firebasestorage.app",
  messagingSenderId: "513760177610",
  appId: "1:513760177610:web:9e82833ec56d497a68f333",
  measurementId: "G-WV3XPRTNQG"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database();

// ==========================================
// FIREBASE AUTHENTICATION FUNCTIONS
// ==========================================

const FirebaseAuth = {
    /**
     * Sign up new user with email and password
     */
    signUp: async function(name, email, password) {
        try {
            // Create user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update user profile with name
            await user.updateProfile({
                displayName: name
            });

            // Create user data in Realtime Database
            const userData = {
                uid: user.uid,
                name: name,
                email: email,
                provider: 'email',
                createdAt: new Date().toISOString(),
                emailVerified: user.emailVerified,
                phoneNumber: null,
                photoURL: null
            };

            // Save to database
            await database.ref('users/' + user.uid).set(userData);

            console.log('User created successfully:', userData);
            return { success: true, user: userData };

        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign in existing user with email and password
     */
    signIn: async function(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Fetch user data from database
            const snapshot = await database.ref('users/' + user.uid).once('value');
            const userData = snapshot.val();

            if (!userData) {
                throw new Error('User data not found in database');
            }

            // Update last login time
            await database.ref('users/' + user.uid).update({
                lastLogin: new Date().toISOString()
            });

            console.log('User signed in successfully:', userData);
            return { success: true, user: userData };

        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign in with Google
     */
    signInWithGoogle: async function() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            const user = result.user;

            // Check if user already exists in database
            const snapshot = await database.ref('users/' + user.uid).once('value');
            let userData;

            if (snapshot.exists()) {
                // User exists, update last login
                userData = snapshot.val();
                await database.ref('users/' + user.uid).update({
                    lastLogin: new Date().toISOString()
                });
            } else {
                // New user, create entry
                userData = {
                    uid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    provider: 'google',
                    createdAt: new Date().toISOString(),
                    emailVerified: user.emailVerified,
                    phoneNumber: user.phoneNumber,
                    photoURL: user.photoURL
                };
                await database.ref('users/' + user.uid).set(userData);
            }

            console.log('Google sign in successful:', userData);
            return { success: true, user: userData };

        } catch (error) {
            console.error('Google sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign out current user
     */
    signOut: async function() {
        try {
            await auth.signOut();
            console.log('User signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current user
     */
    getCurrentUser: function() {
        return auth.currentUser;
    },

    /**
     * Send password reset email
     */
    resetPassword: async function(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true, message: 'Password reset email sent' };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ==========================================
// FIREBASE DATABASE FUNCTIONS - BOOKINGS
// ==========================================

const FirebaseBookings = {
    /**
     * Create a new booking
     */
    createBooking: async function(userId, bookingData) {
        try {
            const bookingRef = database.ref('bookings/' + userId).push();
            const bookingId = bookingRef.key;

            const booking = {
                bookingId: bookingId,
                userId: userId,
                spotName: bookingData.spotName,
                spotAddress: bookingData.spotAddress,
                slotId: bookingData.slotId,
                location: bookingData.location,
                amount: bookingData.amount,
                transactionId: bookingData.transactionId,
                bookingDate: bookingData.date || new Date().toISOString(),
                status: 'active', // active, completed, cancelled
                createdAt: new Date().toISOString()
            };

            await bookingRef.set(booking);

            console.log('Booking created:', booking);
            return { success: true, booking: booking };

        } catch (error) {
            console.error('Create booking error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all bookings for a user
     */
    getUserBookings: async function(userId) {
        try {
            const snapshot = await database.ref('bookings/' + userId).once('value');
            const bookings = [];

            snapshot.forEach((childSnapshot) => {
                bookings.push(childSnapshot.val());
            });

            // Sort by date (newest first)
            bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log('Fetched bookings:', bookings.length);
            return { success: true, bookings: bookings };

        } catch (error) {
            console.error('Get bookings error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current active booking
     */
    getCurrentBooking: async function(userId) {
        try {
            const snapshot = await database.ref('bookings/' + userId)
                .orderByChild('status')
                .equalTo('active')
                .once('value');

            let currentBooking = null;

            snapshot.forEach((childSnapshot) => {
                const booking = childSnapshot.val();
                if (!currentBooking || new Date(booking.createdAt) > new Date(currentBooking.createdAt)) {
                    currentBooking = booking;
                }
            });

            return { success: true, booking: currentBooking };

        } catch (error) {
            console.error('Get current booking error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update booking status
     */
    updateBookingStatus: async function(userId, bookingId, status) {
        try {
            await database.ref('bookings/' + userId + '/' + bookingId).update({
                status: status,
                updatedAt: new Date().toISOString()
            });

            console.log('Booking status updated:', bookingId, status);
            return { success: true };

        } catch (error) {
            console.error('Update booking status error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Complete a booking
     */
    completeBooking: async function(userId, bookingId) {
        try {
            await database.ref('bookings/' + userId + '/' + bookingId).update({
                status: 'completed',
                completedAt: new Date().toISOString()
            });

            console.log('Booking completed:', bookingId);
            return { success: true };

        } catch (error) {
            console.error('Complete booking error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get booking history (previous bookings)
     */
    getBookingHistory: async function(userId) {
        try {
            const snapshot = await database.ref('bookings/' + userId)
                .orderByChild('status')
                .equalTo('completed')
                .once('value');

            const history = [];

            snapshot.forEach((childSnapshot) => {
                history.push(childSnapshot.val());
            });

            // Sort by date (newest first)
            history.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

            console.log('Fetched booking history:', history.length);
            return { success: true, bookings: history };

        } catch (error) {
            console.error('Get booking history error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ==========================================
// FIREBASE DATABASE FUNCTIONS - USER DATA
// ==========================================

const FirebaseUsers = {
    /**
     * Get user data by UID
     */
    getUserData: async function(userId) {
        try {
            const snapshot = await database.ref('users/' + userId).once('value');
            const userData = snapshot.val();

            if (!userData) {
                throw new Error('User not found');
            }

            return { success: true, user: userData };

        } catch (error) {
            console.error('Get user data error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update user profile
     */
    updateUserProfile: async function(userId, updates) {
        try {
            await database.ref('users/' + userId).update({
                ...updates,
                updatedAt: new Date().toISOString()
            });

            console.log('User profile updated:', userId);
            return { success: true };

        } catch (error) {
            console.error('Update user profile error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user statistics
     */
    getUserStats: async function(userId) {
        try {
            const bookingsResult = await FirebaseBookings.getUserBookings(userId);
            
            if (!bookingsResult.success) {
                throw new Error('Failed to fetch bookings');
            }

            const bookings = bookingsResult.bookings;
            const stats = {
                totalBookings: bookings.length,
                activeBookings: bookings.filter(b => b.status === 'active').length,
                completedBookings: bookings.filter(b => b.status === 'completed').length,
                totalSpent: bookings.reduce((sum, b) => sum + (b.amount || 0), 0)
            };

            return { success: true, stats: stats };

        } catch (error) {
            console.error('Get user stats error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ==========================================
// AUTH STATE OBSERVER
// ==========================================

auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.uid);
        // Store user info in localStorage for quick access
        database.ref('users/' + user.uid).once('value').then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                localStorage.setItem('parkingUser', JSON.stringify(userData));
            }
        });
    } else {
        console.log('User is signed out');
        localStorage.removeItem('parkingUser');
    }
});

// ==========================================
// EXPORT FOR USE IN OTHER FILES
// ==========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FirebaseAuth,
        FirebaseBookings,
        FirebaseUsers,
        auth,
        database
    };
}

// Make available globally
window.FirebaseAuth = FirebaseAuth;
window.FirebaseBookings = FirebaseBookings;
window.FirebaseUsers = FirebaseUsers;