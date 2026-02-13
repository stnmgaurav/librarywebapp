// 1. Firebase Configuration (Naya Project)
const firebaseConfig = {
  apiKey: "AIzaSyDf1kBSxrMAn84T2fyt5ipc7GZ3iMSA7hg",
  authDomain: "librarywebapp-e65ac.firebaseapp.com",
  projectId: "librarywebapp-e65ac",
  storageBucket: "librarywebapp-e65ac.firebasestorage.app",
  messagingSenderId: "710619179809",
  appId: "1:710619179809:web:6d130adbca76669f226c60"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- AUTHENTICATION LOGIC ---

function loginWithGoogle() {
    auth.signInWithRedirect(provider);
}

// Ye function har bar check karega ki user login hai ya nahi
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User detected:", user.email);
        handleUserDatabase(user);
    } else {
        // Agar login nahi hai toh login screen dikhao
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('studentPanel').style.display = 'none';
    }
});

function handleUserDatabase(user) {
    const userRef = db.collection("users").doc(user.uid);
    
    userRef.get().then((doc) => {
        if (!doc.exists) {
            // Naya user hai, database mein save karein
            userRef.set({
                name: user.displayName,
                email: user.email,
                role: "Student", // Default role
                fee_status: "Unpaid",
                uid: user.uid,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log("New user document created!");
                checkUserRole(user);
            });
        } else {
            checkUserRole(user);
        }
    }).catch((error) => {
        console.error("Database Error:", error.message);
    });
}

function checkUserRole(user) {
    db.collection("users").doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            document.getElementById('loginSection').style.display = 'none';
            
            if (userData.role === "Admin") {
                document.getElementById('adminPanel').style.display = 'block';
                document.getElementById('studentPanel').style.display = 'none';
            } else {
                document.getElementById('adminPanel').style.display = 'none';
                document.getElementById('studentPanel').style.display = 'block';
                document.getElementById('feeDisplay').innerText = "Fees Status: " + userData.fee_status;
            }
        }
    });
}

function logout() {
    auth.signOut().then(() => location.reload());
}
