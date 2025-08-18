import React, { useState, useEffect, useCallback } from 'react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- Global variables provided by the Canvas environment ---
// This is the placeholder for your Firebase configuration. You will replace this
// with the unique code from your Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyAm-VpCE7D0V94B7JBVxkgK4X0Vvx-6QF1",
  authDomain: "pinkmint-1c83f.firebaseapp.com",
  projectId: "pinkmint-1c83f",
  storageBucket: "pinkmint-1c83f.appspot.com",
  messagingSenderId: "42703485247",
  appId: "1:42703485247:web:f7d46673d6f9c572d3b8a"
};

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Define cleaning packages and their prices with detailed descriptions.
const packages = [
  { 
    name: 'Standard Cleaning', 
    price: 150, 
    description: 'Perfect for regular maintenance. Includes a full bathroom and kitchen reset, along with dusting, vacuuming, and trash removal in all bedrooms, living areas, and hallways.' 
  },
  { 
    name: 'Deep Cleaning', 
    price: 250, 
    description: 'An extensive, comprehensive cleaning for a refreshed, like-new space. We tackle hidden grime and buildup in every room, leaving no detail untouched.' 
  },
  { 
    name: 'Move In/Out Cleaning', 
    price: 350, 
    description: 'A comprehensive, top-to-bottom clean designed to prepare a home for new tenants or restore it to a spotless state after move-out.' 
  },
];

// Define add-on services and their prices
const addOns = [
  { name: 'Inside Refrigerator', price: 25 },
  { name: 'Inside Oven', price: 25 },
  { name: 'Interior Windows', price: 30 },
  { name: 'Carpet Cleaning', price: 50 },
  { name: 'Laundry', price: 20 },
];

const App = () => {
  // State for Firebase services and user data
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  // State for booking form
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [homeType, setHomeType] = useState('');
  const [floorType, setFloorType] = useState('');
  const [numBedrooms, setNumBedrooms] = useState('');
  const [numBathrooms, setNumBathrooms] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [specifics, setSpecifics] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // State for UI feedback
  const [isBooking, setIsBooking] = useState(false);
  const [message, setMessage] = useState('');

  // --- Firebase Initialization and Authentication ---
  // This useEffect hook handles the initial setup of Firebase and user authentication.
  useEffect(() => {
    try {
      if (!firebaseConfig.apiKey) {
        console.error('Firebase config not found. Please add your config from the Firebase console.');
        return;
      }

      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);
      setDb(firestoreDb);
      setAuth(firebaseAuth);

      // Listen for authentication state changes to get the user ID.
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // Sign in anonymously if no user is found.
          await signInAnonymously(firebaseAuth);
        }
        setIsAuthReady(true);
      });

      // Attempt to sign in with the provided custom token, or anonymously if none exists.
      const signIn = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(firebaseAuth, initialAuthToken);
          } else {
            await signInAnonymously(firebaseAuth);
          }
        } catch (error) {
          console.error("Error during authentication:", error);
          setMessage("Authentication failed. Please refresh the page.");
        }
      };
      signIn();

      return () => unsubscribe();
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      setMessage("Could not connect to the booking system. Please try again later.");
    }
  }, []);

  // --- Logic for Price Calculation ---
  // This useEffect hook recalculates the total price whenever the selected package or add-ons change.
  useEffect(() => {
    let currentTotal = 0;
    if (selectedPackage) {
      currentTotal += selectedPackage.price;
    }
    selectedAddOns.forEach(addOn => {
      currentTotal += addOn.price;
    });
    setTotalPrice(currentTotal);
  }, [selectedPackage, selectedAddOns]);

  const handlePackageChange = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleAddOnChange = (addOn) => {
    setSelectedAddOns(prevAddOns => {
      if (prevAddOns.includes(addOn)) {
        return prevAddOns.filter(item => item !== addOn);
      } else {
        return [...prevAddOns, addOn];
      }
    });
  };

  // --- Booking Submission Logic ---
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsBooking(true);
    setMessage('');

    if (!isAuthReady || !db || !userId) {
      setMessage("Booking system not ready. Please wait a moment and try again.");
      setIsBooking(false);
      return;
    }

    if (!selectedPackage) {
      setMessage("Please select a cleaning package to proceed.");
      setIsBooking(false);
      return;
    }
    
    // Construct the booking data object to be saved.
    const bookingData = {
      clientName,
      clientEmail,
      homeDetails: {
        homeType,
        floorType,
        numBedrooms,
        numBathrooms,
        squareFootage,
      },
      specifics,
      selectedPackage: selectedPackage.name,
      packagePrice: selectedPackage.price,
      selectedAddOns: selectedAddOns.map(ao => ao.name),
      addOnPrices: selectedAddOns.map(ao => ao.price),
      totalPrice,
      timestamp: serverTimestamp(),
      appId,
      userId,
    };

    try {
      // Define the collection path based on the app and user ID for proper data security.
      const collectionPath = `/artifacts/${appId}/users/${userId}/bookings`;
      // Add the new document to the 'bookings' collection in Firestore.
      await addDoc(collection(db, collectionPath), bookingData);
      setMessage("Booking successfully submitted! We'll be in touch shortly.");
      // Reset form fields after successful submission.
      setSelectedPackage(null);
      setSelectedAddOns([]);
      setClientName('');
      setClientEmail('');
      setHomeType('');
      setFloorType('');
      setNumBedrooms('');
      setNumBathrooms('');
      setSquareFootage('');
      setSpecifics('');
    } catch (error) {
      console.error("Error writing document to Firestore:", error);
      setMessage("Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="bg-[#f7f7f7] min-h-screen py-8 font-['Poppins']">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        <header className="border-b-2 border-pink-500 pb-4 mb-8 text-center">
          <h1 className="font-['Playfair_Display'] text-4xl text-fuchsia-600 font-bold mb-2">Book Your Pink Mint Clean</h1>
          <p className="text-gray-600">Select your package, get an instant quote, and let us handle the rest. We believe in providing the most detailed and transparent experience for our clients.</p>
        </header>

        {/* --- Deposit Warning --- */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-8" role="alert">
          <p className="font-bold">Important Note on Deposits:</p>
          <p className="text-sm">A non-refundable consultation fee of [$XX] is required to finalize your booking and secure your service date. This will be collected after your submission has been reviewed.</p>
        </div>

        <form onSubmit={handleBookingSubmit} className="space-y-8">
          
          {/* --- Detailed Explanations for Upgrades --- */}
          <div className="space-y-4 text-gray-700">
            <h2 className="text-2xl font-['Playfair_Display'] text-pink-600 font-bold">✨ What We Do Best</h2>
            <p>We go beyond a basic clean to provide a true upgrade. Every package includes a full **kitchen reset** and **bathroom reset**.</p>
            <p className="pl-4 border-l-2 border-fuchsia-500">
              <span className="font-semibold text-fuchsia-600">Kitchen Upgrade:</span> A thorough wipe down of all appliances, countertops, sink, and cabinets (exterior). We treat the kitchen with extra care.
            </p>
            <p className="pl-4 border-l-2 border-fuchsia-500">
              <span className="font-semibold text-fuchsia-600">Bathroom Upgrade:</span> A deep clean of all surfaces, including the tub, shower, sink, and toilet. We focus on sanitizing and polishing.
            </p>
          </div>

          {/* --- Package Selection Section --- */}
          <div>
            <h2 className="text-2xl font-['Playfair_Display'] text-pink-600 font-bold mb-4">1. Select a Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <div
                  key={pkg.name}
                  onClick={() => handlePackageChange(pkg)}
                  className={`p-6 border-2 rounded-xl transition-all duration-300 cursor-pointer 
                  ${selectedPackage && selectedPackage.name === pkg.name ? 'border-fuchsia-500 bg-purple-50 shadow-md' : 'border-gray-200 bg-white hover:border-pink-300'}`}
                >
                  <h3 className="font-semibold text-xl text-fuchsia-600 mb-1">{pkg.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{pkg.description}</p>
                  <span className="text-2xl font-bold text-pink-500">${pkg.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* --- Add-Ons Section --- */}
          <div>
            <h2 className="text-2xl font-['Playfair_Display'] text-pink-600 font-bold mb-4">2. Add-On Services</h2>
            <p className="text-gray-700 mb-4">Please select any additional services you would like to include with your booking.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addOns.map(addOn => (
                <div
                  key={addOn.name}
                  onClick={() => handleAddOnChange(addOn)}
                  className={`p-4 border-2 rounded-xl transition-all duration-300 cursor-pointer 
                  ${selectedAddOns.includes(addOn) ? 'border-fuchsia-500 bg-purple-50 shadow-md' : 'border-gray-200 bg-white hover:border-pink-300'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg text-gray-700">{addOn.name}</span>
                    <span className="font-bold text-pink-500">${addOn.price}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* --- Specific Laundry Details --- */}
            {selectedAddOns.some(ao => ao.name === 'Laundry') && (
              <div className="mt-4 p-4 rounded-lg bg-fuchsia-50 border-2 border-fuchsia-200 text-fuchsia-800">
                <p className="font-semibold mb-1">Important Note on Laundry Service:</p>
                <p className="text-sm">We are happy to assist with laundry, but please note that the service is limited to **no more than 2 loads of laundry** per booking. We do not provide folding or hanging services at this time.</p>
              </div>
            )}
          </div>

          {/* --- Booking Details Form --- */}
          <div>
            <h2 className="text-2xl font-['Playfair_Display'] text-pink-600 font-bold mb-4">3. Tell Us About Your Home</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-gray-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="clientEmail" className="block text-gray-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  id="clientEmail"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                      <label htmlFor="numBedrooms" className="block text-gray-700 font-medium mb-1">Bedrooms</label>
                      <input
                          type="number"
                          id="numBedrooms"
                          value={numBedrooms}
                          onChange={(e) => setNumBedrooms(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                          required
                      />
                  </div>
                  <div>
                      <label htmlFor="numBathrooms" className="block text-gray-700 font-medium mb-1">Bathrooms</label>
                      <input
                          type="number"
                          id="numBathrooms"
                          value={numBathrooms}
                          onChange={(e) => setNumBathrooms(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                          required
                      />
                  </div>
                  <div className="sm:col-span-2">
                      <label htmlFor="squareFootage" className="block text-gray-700 font-medium mb-1">Square Footage</label>
                      <input
                          type="number"
                          id="squareFootage"
                          value={squareFootage}
                          onChange={(e) => setSquareFootage(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                          required
                      />
                  </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="homeType" className="block text-gray-700 font-medium mb-1">Type of Home</label>
                  <select id="homeType" value={homeType} onChange={(e) => setHomeType(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-200">
                    <option value="">Select...</option>
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Condo">Condo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="floorType" className="block text-gray-700 font-medium mb-1">Type of Floors</label>
                  <select id="floorType" value={floorType} onChange={(e) => setFloorType(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-200">
                    <option value="">Select...</option>
                    <option value="Hardwood">Hardwood</option>
                    <option value="Carpet">Carpet</option>
                    <option value="Tile">Tile</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="specifics" className="block text-gray-700 font-medium mb-1">Specifics (Product Preference, etc.)</label>
                <textarea
                  id="specifics"
                  value={specifics}
                  onChange={(e) => setSpecifics(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                  placeholder="Tell us about any special requests, pet information, or product preferences."
                ></textarea>
              </div>
            </div>
          </div>

          {/* --- Summary and Book Button --- */}
          <div className="text-center">
            <h2 className="text-3xl font-bold font-['Playfair_Display'] text-fuchsia-700 mb-2">Total: ${totalPrice}</h2>
            <p className="text-sm text-gray-500 mb-4">This is an estimated price. A final quote will be provided after your consultation.</p>
            <button
              type="submit"
              disabled={isBooking || !selectedPackage || !clientName || !clientEmail || !homeType || !floorType || !numBedrooms || !numBathrooms || !squareFootage}
              className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-white transition-all duration-300
              ${isBooking || !selectedPackage || !clientName || !clientEmail || !homeType || !floorType || !numBedrooms || !numBathrooms || !squareFootage
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-pink-500 hover:bg-pink-600 shadow-lg hover:shadow-xl'}`}
            >
              {isBooking ? 'Booking...' : 'Book Now'}
            </button>
            
            {message && (
              <div className="mt-4 p-4 rounded-lg bg-fuchsia-100 text-fuchsia-800 font-medium">
                {message}
              </div>
            )}
            
            {userId && (
              <div className="mt-4 text-sm text-gray-400">
                User ID: {userId}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
