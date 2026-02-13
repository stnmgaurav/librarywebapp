// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyDf1kBSxrMAn84T2fyt5ipc7GZ3iMSA7hg",
  authDomain: "librarywebapp-e65ac.firebaseapp.com",
  projectId: "librarywebapp-e65ac",
  storageBucket: "librarywebapp-e65ac.firebasestorage.app",
  messagingSenderId: "710619179809",
  appId: "1:710619179809:web:6d130adbca76669f226c60"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

let html5QrCode;


// ================= LOGIN =================

function loginWithGoogle() {
    auth.signInWithPopup(provider)
        .catch(error => console.error(error));
}

auth.onAuthStateChanged((user) => {
    if (user) {
        handleUser(user);
    } else {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('studentPanel').style.display = 'none';
}


// ================= USER HANDLE =================

function handleUser(user) {

    const userRef = db.collection("users").doc(user.uid);

    userRef.get().then((doc) => {

        // ADMIN EMAIL
        if (user.email === "gauravsinghrajpoot2019@gmail.com") {

            if (!doc.exists) {
                userRef.set({
                    name: user.displayName,
                    email: user.email,
                    mobile: "",
                    role: "Admin",
                    approved: true,
                    fee_status: "Paid",
                    uid: user.uid,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => loadAdminPanel());
            } else {
                loadAdminPanel();
            }

        } else {

            if (!doc.exists) {

                userRef.set({
                    name: user.displayName,
                    email: user.email,
                    mobile: "",
                    role: "Student",
                    approved: false,
                    fee_status: "Unpaid",
                    uid: user.uid,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    loadStudentPanel({
                        approved: false,
                        fee_status: "Unpaid"
                    });
                });

            } else {
                loadStudentPanel(doc.data());
            }
        }
    });
}


// ================= ADMIN PANEL =================

function loadAdminPanel() {

    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('studentPanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';

    loadStudents();
    loadTodayPresentCount();
}

function loadStudents() {

    const tableBody = document.getElementById("studentListBody");
    tableBody.innerHTML = "";

    db.collection("users")
      .where("role", "==", "Student")
      .get()
      .then((snapshot) => {

          snapshot.forEach((doc) => {

              const data = doc.data();

              const row = `
                <tr>
                    <td>${data.name}</td>
                    <td>
                        <input type="text" id="mobile-${doc.id}"
                               value="${data.mobile || ''}"
                               placeholder="Mobile Number">
                    </td>
                    <td>
                        <select id="fee-${doc.id}">
                            <option value="Paid" ${data.fee_status === "Paid" ? "selected" : ""}>Paid</option>
                            <option value="Unpaid" ${data.fee_status === "Unpaid" ? "selected" : ""}>Unpaid</option>
                        </select>
                    </td>
                    <td>
                        <button onclick="approveStudent('${doc.id}')">
                            ${data.approved ? "Update" : "Approve"}
                        </button>
                    </td>
                </tr>
              `;

              tableBody.innerHTML += row;
          });

      });
}

function approveStudent(uid) {

    const mobileValue = document.getElementById("mobile-" + uid).value;
    const feeValue = document.getElementById("fee-" + uid).value;

    if (!mobileValue) {
        alert("Enter mobile number");
        return;
    }

    db.collection("users").doc(uid).update({
        mobile: mobileValue,
        approved: true,
        fee_status: feeValue
    }).then(() => {
        alert("Student Updated ✅");
        loadStudents();
    });
}

function loadTodayPresentCount() {

    const today = new Date().toISOString().split("T")[0];

    db.collection("attendance")
      .where("date", "==", today)
      .where("checkOut", "!=", "")
      .get()
      .then(snapshot => {
          document.getElementById("totalPresent").innerText =
              "Total Present Today: " + snapshot.size;
      });
}


// ================= STUDENT PANEL =================

function loadStudentPanel(userData) {

    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('studentPanel').style.display = 'block';

    const feeText = document.getElementById("feeDisplay");
    const scanner = document.getElementById("reader");

    if (!userData.approved) {

        feeText.innerText = "Waiting for admin approval ❌";
        scanner.style.display = "none";

    } else if (userData.fee_status !== "Paid") {

        feeText.innerText = "Please pay fees to mark attendance ❌";
        scanner.style.display = "none";

    } else {

        feeText.innerText = "Fees Paid ✅ You can mark attendance";
        scanner.style.display = "block";

        const user = auth.currentUser;
        if (user) {
            loadTodayHours(user.uid);
            loadHistory(user.uid);
        }
    }
}


// ================= QR ATTENDANCE =================

function startScanner() {

    const user = auth.currentUser;
    if (!user) return;

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        () => {
            markAttendance(user.uid);
        }
    );
}

function markAttendance(uid) {

    const today = new Date();
    const dateString = today.toISOString().split("T")[0];
    const timeString = today.toLocaleTimeString();

    db.collection("attendance")
      .where("uid", "==", uid)
      .where("date", "==", dateString)
      .get()
      .then((snapshot) => {

          if (snapshot.empty) {

              db.collection("attendance").add({
                  uid: uid,
                  date: dateString,
                  checkIn: timeString,
                  checkOut: "",
                  totalHours: "",
                  created_at: firebase.firestore.FieldValue.serverTimestamp()
              }).then(() => {
                  alert("Check-In Successful ✅");
                  stopScanner();
                  loadTodayHours(uid);
                  loadHistory(uid);
              });

          } else {

              const doc = snapshot.docs[0];
              const data = doc.data();

              if (!data.checkOut) {

                  const checkInTime = new Date(`${dateString} ${data.checkIn}`);
                  const checkOutTime = new Date();

                  const diffMs = checkOutTime - checkInTime;
                  const hours = (diffMs / (1000 * 60 * 60)).toFixed(2);

                  db.collection("attendance").doc(doc.id).update({
                      checkOut: timeString,
                      totalHours: hours
                  }).then(() => {
                      alert("Check-Out Successful ✅");
                      stopScanner();
                      loadTodayHours(uid);
                      loadHistory(uid);
                  });

              } else {
                  alert("Attendance already completed today ✅");
                  stopScanner();
              }
          }
      });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        });
    }
}


// ================= STUDENT HISTORY =================

function loadTodayHours(uid) {

    const today = new Date().toISOString().split("T")[0];

    db.collection("attendance")
      .where("uid", "==", uid)
      .where("date", "==", today)
      .get()
      .then(snapshot => {

          if (!snapshot.empty) {
              const data = snapshot.docs[0].data();

              document.getElementById("todayHours").innerText =
                  `Today: ${data.checkIn || "-"} → ${data.checkOut || "-"} | Hours: ${data.totalHours || "In Progress"}`;
          }
      });
}

function loadHistory(uid) {

    const table = document.getElementById("historyBody");
    table.innerHTML = "";

    db.collection("attendance")
      .where("uid", "==", uid)
      .orderBy("created_at", "desc")
      .limit(10)
      .get()
      .then(snapshot => {

          snapshot.forEach(doc => {

              const data = doc.data();

              const row = `
                <tr>
                  <td>${data.date}</td>
                  <td>${data.checkIn || "-"}</td>
                  <td>${data.checkOut || "-"}</td>
                  <td>${data.totalHours || "-"}</td>
                </tr>
              `;

              table.innerHTML += row;
          });
      });
}


// ================= LOGOUT =================

function logout() {
    auth.signOut().then(() => location.reload());
}
