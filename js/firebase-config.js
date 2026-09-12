/* ==========================================================
   FIREBASE CONFIG - initializes the app and exposes `db` (Firestore) globally
   for js/main.js to use. Loaded before main.js in index.html.
   ========================================================== */

var firebaseConfig = {
    apiKey: "AIzaSyA2oyzAZJw1Qz_5g1FLz2ILaf4d5FYusBs",
    authDomain: "phuongtrangwedding-ffd3e.firebaseapp.com",
    projectId: "phuongtrangwedding-ffd3e",
    storageBucket: "phuongtrangwedding-ffd3e.firebasestorage.app",
    messagingSenderId: "822873981669",
    appId: "1:822873981669:web:b14d004689057052548a0c",
    measurementId: "G-ZT509PWHH1"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();