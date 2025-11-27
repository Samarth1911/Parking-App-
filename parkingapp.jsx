import React, { useState, useEffect } from 'react';
import { MapPin, Car, Clock, CreditCard, Mail, Menu, X, LogOut, Navigation } from 'lucide-react';

const ParkingApp = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showReceipt, setShowReceipt] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Mock parking spots data
  const parkingSpots = [
    { id: 1, name: 'City Center Mall', address: 'MG Road', type: 'paid', price: 50, available: 45, total: 100, distance: '0.5 km' },
    { id: 2, name: 'Phoenix Market', address: 'Camp Area', type: 'paid', price: 40, available: 23, total: 80, distance: '1.2 km' },
    { id: 3, name: 'Public Parking Lot', address: 'Shivaji Nagar', type: 'free', price: 0, available: 12, total: 50, distance: '0.8 km' },
    { id: 4, name: 'Metro Station P1', address: 'Kharadi', type: 'paid', price: 30, available: 67, total: 150, distance: '2.1 km' },
    { id: 5, name: 'Hospital Parking', address: 'Deccan', type: 'free', price: 0, available: 8, total: 30, distance: '1.5 km' },
  ];

  // Login handlers
  const handleManualLogin = () => {
    if (loginEmail && loginPassword) {
      setUser({ name: 'Demo User', email: loginEmail });
      setCurrentPage('dashboard');
    }
  };

  const handleGoogleLogin = () => {
    setUser({ name: 'Google User', email: 'user@gmail.com' });
    setCurrentPage('dashboard');
  };

  // Get location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          alert('Location detected successfully!');
        },
        (error) => {
          alert('Using demo location: Pune, Maharashtra');
          setLocation({ lat: 18.5204, lng: 73.8567 });
        }
      );
    } else {
      alert('Using demo location: Pune, Maharashtra');
      setLocation({ lat: 18.5204, lng: 73.8567 });
    }
  };

  // Search parking
  const handleSearch = () => {
    if (city && area) {
      setCurrentPage('spots');
    }
  };

  // Book parking
  const handleBooking = (spot) => {
    if (spot.type === 'free') {
      confirmBooking(spot, null);
    } else {
      setSelectedSpot(spot);
      setCurrentPage('payment');
    }
  };

  // Payment handler (mock Razorpay)
  const handlePayment = () => {
    const booking = {
      id: Date.now(),
      spot: selectedSpot,
      date: new Date().toLocaleString(),
      transactionId: 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      amount: selectedSpot.price
    };
    confirmBooking(selectedSpot, booking);
  };

  const confirmBooking = (spot, booking) => {
    const newBooking = booking || {
      id: Date.now(),
      spot: spot,
      date: new Date().toLocaleString(),
      transactionId: 'FREE-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      amount: 0
    };
    
    setBookings([...bookings, newBooking]);
    setShowReceipt(newBooking);
    setCurrentPage('receipt');
  };

  const logout = () => {
    setUser(null);
    setCurrentPage('login');
    setLocation(null);
    setCity('');
    setArea('');
  };

  // Login Page
  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="mb-4">
              <img 
                src="logo.png" 
                alt="Reserve and Park" 
                className="w-32 h-32 mx-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Reserve and Park</h1>
            <p className="text-blue-600 mt-2 font-medium">Smart Parking, Simplified.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handleManualLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Sign In
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  if (currentPage === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <img 
                  src="https://i.ibb.co/HVZy8pK/reserve-and-park-logo.png" 
                  alt="Reserve and Park" 
                  className="w-10 h-10"
                />
                <span className="text-xl font-bold text-gray-800">Reserve and Park</span>
              </div>
              <button onClick={logout} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h2>
            <p className="text-gray-600 mt-2">Find your perfect parking spot</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Navigation className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Your Location</h3>
              </div>
              <button
                onClick={getUserLocation}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
              >
                {location ? 'Location Detected ✓' : 'Get My Location'}
              </button>
              {location && (
                <p className="mt-3 text-sm text-gray-600">
                  📍 Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold">Search Parking</h3>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter City (e.g., Pune)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Enter Area (e.g., Kharadi)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSearch}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
                >
                  Find Parking Spots
                </button>
              </div>
            </div>
          </div>

          {bookings.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Your Bookings</h3>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{booking.spot.name}</p>
                        <p className="text-sm text-gray-600">{booking.date}</p>
                        <p className="text-sm text-gray-500">ID: {booking.transactionId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {booking.amount === 0 ? 'FREE' : `₹${booking.amount}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Parking Spots List
  if (currentPage === 'spots') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button onClick={() => setCurrentPage('dashboard')} className="text-blue-600 hover:text-blue-700 font-semibold">
                ← Back
              </button>
              <span className="text-xl font-bold text-gray-800">Available Spots</span>
              <button onClick={logout} className="text-gray-600 hover:text-gray-800">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Parking in {city}, {area}</h2>
            <p className="text-gray-600">Found {parkingSpots.length} parking spots nearby</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parkingSpots.map((spot) => (
              <div key={spot.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className={`h-2 ${spot.type === 'free' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{spot.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      spot.type === 'free' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {spot.type === 'free' ? 'FREE' : `₹${spot.price}/hr`}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{spot.address}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {spot.distance} away
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4" />
                      <span className={spot.available < 20 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                        {spot.available}/{spot.total} available
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBooking(spot)}
                    disabled={spot.available === 0}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      spot.available === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : spot.type === 'free'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {spot.available === 0 ? 'Full' : 'Book Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Payment Page
  if (currentPage === 'payment' && selectedSpot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
              <CreditCard className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Complete Payment</h2>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">{selectedSpot.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{selectedSpot.address}</p>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount to Pay:</span>
              <span className="text-2xl font-bold text-blue-600">₹{selectedSpot.price}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Card Number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="MM/YY"
                className="px-4 py-3 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="CVV"
                className="px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 mb-3"
          >
            Pay ₹{selectedSpot.price}
          </button>
          <button
            onClick={() => setCurrentPage('spots')}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition duration-200"
          >
            Cancel
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            🔒 Secured by Razorpay (Demo Mode)
          </p>
        </div>
      </div>
    );
  }

  // Receipt Page
  if (currentPage === 'receipt' && showReceipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Booking Confirmed!</h2>
            <p className="text-gray-600 mt-2">Your parking spot has been reserved</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-center border-b pb-2">Receipt</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-semibold text-right">{showReceipt.spot.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="text-right">{showReceipt.spot.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="text-right">{showReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm">{showReceipt.transactionId}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-gray-800 font-semibold">Amount Paid:</span>
                <span className="text-2xl font-bold text-green-600">
                  {showReceipt.amount === 0 ? 'FREE' : `₹${showReceipt.amount}`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Receipt Sent!</p>
                <p className="text-xs text-blue-700 mt-1">
                  A copy has been emailed to {user?.email}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentPage('dashboard')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ParkingApp;