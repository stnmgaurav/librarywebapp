const firebaseConfig = {
  apiKey: "AIzaSyDf1kBSxrMAn84T2fyt5ipc7GZ3iMSA7hg",
  authDomain: "librarywebapp-e65ac.firebaseapp.com",
  projectId: "librarywebapp-e65ac",
  storageBucket: "librarywebapp-e65ac.firebasestorage.app",
  messagingSenderId: "710619179809",
  appId: "1:710619179809:web:6d130adbca76669f226c60"
};

// Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- Auth Functions ---
function loginWithGoogle() {
    auth.signInWithRedirect(provider);
}

function logout() {
    auth.signOut().then(() => location.reload());
}

// Watch Login State
auth.onAuthStateChanged((user) => {
    if (user) {
        handleUserEntry(user);
    } else {
        document.getElementById('loginSection').style.display = 'block';
    }
});

function handleUserEntry(user) {
    const userRef = db.collection("users").doc(user.uid);
    userRef.get().then((doc) => {
        if (!doc.exists) {
            userRef.set({
                name: user.displayName,
                email: user.email,
                role: "Student",
                fee_status: "Unpaid"
            }).then(() => location.reload());
        } else {
            showPanel(doc.data());
        }
    });
}

function showPanel(userData) {
    document.getElementById('loginSection').style.display = 'none';
    if (userData.role === "Admin") {
        document.getElementById('adminPanel').style.display = 'block';
        loadStudents();
    } else {
        document.getElementById('studentPanel').style.display = 'block';
        document.getElementById('feeDisplay').innerText = "Fees: " + userData.fee_status;
    }
}

// --- Admin Logic ---
function addStudent() {
    const name = document.getElementById('studentName').value;
    const email = document.getElementById('studentEmail').value;
    const fee = document.getElementById('feeStatus').value;
    
    if(name && email) {
        db.collection("users").add({
            name: name,
            email: email,
            role: "Student",
            fee_status: fee
        }).then(() => alert("Student Added!"));
    }
}

function loadStudents() {
    db.collection("users").where("role", "==", "Student").onSnapshot(snap => {
        const body = document.getElementById('studentListBody');
        body.innerHTML = "";
        snap.forEach(doc => {
            const s = doc.data();
            body.innerHTML += `<tr><td>${s.name}</td><td>${s.fee_status}</td><td><button onclick="deleteUser('${doc.id}')">X</button></td></tr>`;
        });
    });
}

function deleteUser(id) {
    if(confirm("Delete?")) db.collection("users").doc(id).delete();
}
