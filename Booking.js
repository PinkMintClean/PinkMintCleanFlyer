// A very quick, simple, and self-contained booking.js file to handle form submissions.
// This code is commented extensively to explain what each part does.

// THIS IS YOUR UNIQUE FIREBASE CONFIGURATION. IT HAS BEEN ADDED HERE.
// DO NOT SHARE THIS INFORMATION WITH ANYONE.
const firebaseConfig = {
  apiKey: "AIzaSyAm-vPcE7dU9V487JBvkdgk4X0vvx-6QFI",
  authDomain: "pinkmint-1c83f.firebaseapp.com",
  projectId: "pinkmint-1c83f",
  storageBucket: "pinkmint-1c83f.firebasestorage.app",
  messagingSenderId: "42703485247",
  appId: "1:42703485247:web:f7d346673d6f9c572d3b8a",
  measurementId: "G-16TYE6L7N3"
};


// ----------------------------------------------------------------------------------
// You do not need to change anything below this line. This is the logic for your form.
// ----------------------------------------------------------------------------------

// Import the necessary Firebase functions from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Initialize Firebase with your unique configuration
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get a reference to the form element from the HTML file.
const form = document.getElementById('bookingForm');

// Get a reference to the message box element to display success or error messages.
const messageBox = document.getElementById('messageBox');

/**
 * Displays a message to the user in the message box.
 * @param {string} text The message to display.
 * @param {string} type The type of message ('success' or 'error').
 */
function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    if (type === 'success') {
        messageBox.style.backgroundColor = '#4CAF50'; // Green background for success
    } else {
        messageBox.style.backgroundColor = '#f44336'; // Red background for error
    }

    // Hide the message after 5 seconds
    setTimeout(() => {
        messageBox.style.display = 'none';
        messageBox.textContent = '';
    }, 5000);
}

// Add an event listener to the form to handle the submission.
form.addEventListener('submit', async (e) => {
    // Prevent the default form submission behavior, which would reload the page.
    e.preventDefault();

    // Show a loading message while the data is being sent.
    showMessage("Submitting your request...", 'info');

    try {
        // Get all the form data.
        const formData = {
            firstName: form.firstName.value,
            lastName: form.lastName.value,
            email: form.email.value,
            phone: form.phone.value,
            address: form.address.value,
            city: form.city.value,
            state: form.state.value,
            zip: form.zip.value,
            service: form.service.value,
            date: form.date.value,
            time: form.time.value,
            message: form.message.value,
            createdAt: new Date() // Add a timestamp for when the booking was created.
        };

        // Add the new booking data to the 'bookings' collection in your Firestore database.
        // It will automatically create the 'bookings' collection if it doesn't exist.
        const docRef = await addDoc(collection(db, "bookings"), formData);

        // Clear the form fields after a successful submission.
        form.reset();

        // Show a success message to the user.
        showMessage("Your booking has been submitted successfully!", 'success');

        console.log("Document written with ID: ", docRef.id);

    } catch (error) {
        // If there's an error, log it to the console and show an error message.
        console.error("Error adding document: ", error);
        showMessage("Something went wrong. Please try again.", 'error');
    }
});
