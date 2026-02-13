// 🔥 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDf1kBSxrMAn84T2fyt5ipc7GZ3iMSA7hg",
  authDomain: "librarywebapp-e65ac.firebaseapp.com",
  projectId: "librarywebapp-e65ac",
  storageBucket: "librarywebapp-e65ac.firebasestorage.app",
  messagingSenderId: "710619179809",
  appId: "1:710619179809:web:6d130adbca76669f226c60"
};

// 🔥 Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();


// ================= AUTH SECTION =================

// ✅ Google Login (Popup – stable)
function loginWithGoogle() {
    auth.signInWithPopup(provider)
        .catch(error => console.error("Login Error:", error.message));
}

// ✅ Auth State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User detected:", user.email);
        handleUserDatabase(user);
    } else {
        showLogin();
    }
});

// ✅ Show Login Screen
function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('studentPanel').style.display = 'none';
}

// ✅ Handle User Database + Auto Admin Detect
function handleUserDatabase(user) {

    const userRef = db.collection("users").doc(user.uid);

    userRef.get().then((doc) => {

        let role;

        // 🔥 YOUR ADMIN EMAIL
        if (user.email === "gauravsinghrajpoot2019@gmail.com") {
            role = "Admin";
        } else {
            role = "Student";
        }

        if (!doc.exists) {
            // New user create
            userRef.set({
                name: user.displayName,
                email: user.email,
                role: role,
                fee_status: "Unpaid",
                uid: user.uid,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log("New user created");
                checkUserRoleFromData({
                    role: role,
                    fee_status: "Unpaid"
                });
            });

        } else {
            // Existing user
            checkUserRoleFromData(doc.data());
        }

    }).catch((error) => {
        console.error("Database Error:", error.message);
    });
}


// ✅ Role Based UI Control
function checkUserRoleFromData(userData) {

    document.getElementById('loginSection').style.display = 'none';

    if (userData.role === "Admin") {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('studentPanel').style.display = 'none';
    } else {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('studentPanel').style.display = 'block';
        document.getElementById('feeDisplay').innerText =
            "Fees Status: " + userData.fee_status;
    }
}


// ✅ Logout
function logout() {
    auth.signOut().then(() => {
        location.reload();
    });
}
