// Function to handle the form submission and save data to Firebase
async function handleFormSubmit(event) {
  event.preventDefault(); // Prevents the default form submission behavior

  // Show the loading spinner and hide the form
  document.getElementById('loadingSpinner').classList.remove('hidden');
  document.getElementById('bookingForm').classList.add('hidden');

  // Get the form elements
  const clientName = document.getElementById('name').value;
  const clientEmail = document.getElementById('email').value;
  const clientPhone = document.getElementById('phone').value;
  const clientAddress = document.getElementById('address').value;
  const clientMessage = document.getElementById('message').value;

  // Initialize Firebase App and Firestore
  const firebaseConfig = {
    apiKey: "AIzaSyAm-VpCE7D0V94B7JBVxkgK4X0Vvx-6QF1",
    authDomain: "pinkmint-1c83f.firebaseapp.com",
    projectId: "pinkmint-1c83f",
    storageBucket: "pinkmint-1c83f.appspot.com",
    messagingSenderId: "42703485247",
    appId: "1:42703485247:web:f7d46673d6f9c572d3b8a"
  };

  try {
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(app);
    const auth = firebase.auth(app);

    let userId = null;
    let unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        userId = user.uid;
      } else {
        auth.signInAnonymously();
      }
    });

    // Wait for the auth state to be ready
    await new Promise(resolve => {
      const waitForAuth = setInterval(() => {
        if (userId || auth.currentUser) {
          clearInterval(waitForAuth);
          resolve();
        }
      }, 100);
    });

    // Create a new document in Firestore with the form data
    const docRef = await db.collection("bookings").add({
      clientName: clientName,
      clientEmail: clientEmail,
      clientPhone: clientPhone,
      clientAddress: clientAddress,
      clientMessage: clientMessage,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: userId
    });

    // Success message
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.remove('hidden');
    
    // Reset the form
    document.getElementById('bookingForm').reset();

  } catch (error) {
    console.error("Error writing document: ", error);
    // Error message
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.classList.remove('hidden');

  } finally {
    // Hide the loading spinner
    document.getElementById('loadingSpinner').classList.add('hidden');
  }
}

// Add an event listener to the form's submit event
document.getElementById('bookingForm').addEventListener('submit', handleFormSubmit);

