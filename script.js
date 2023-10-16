//initializing firebase connection
const firebaseConfig = {
  apiKey: "AIzaSyDb52-cXRjle4f0xr9Qg68ygjjg48t58sM",
  authDomain: "cpeg470-5c5b8.firebaseapp.com",
  databaseURL: "https://cpeg470-5c5b8-default-rtdb.firebaseio.com",
  projectId: "cpeg470-5c5b8",
  storageBucket: "cpeg470-5c5b8.appspot.com",
  messagingSenderId: "1007464137429",
  appId: "1:1007464137429:web:284b0bc17c5f2e956ad85c",
  measurementId: "G-6N2H8G0R2Y",
};

firebase.initializeApp(firebaseConfig);

function createNewUser() {
  const email = document.getElementById("newUser").value;
  const password = document.getElementById("newPass").value;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // User registered successfully
      const user = userCredential.user;
      const uid = user.uid; // Get the UID of the newly created user
      const data = {
        email: email,
      };

      // Save the user's email under the "Users" node with the UID as the key
      firebase
        .database()
        .ref("Users")
        .child(uid)
        .set(data)
        .then(() => {
          console.log("User registered and data saved:", user);
        })
        .catch((error) => {
          console.error("Error saving user data:", error);
        });
    })
    .catch((error) => {
      // Handle errors here
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Registration error:", errorCode, errorMessage);
    });
}

function login() {
  const email = document.getElementById("loginUser").value;
  const password = document.getElementById("loginPass").value;

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // User logged in successfully
      const user = userCredential.user;
      console.log("User logged in:", user);
      window.location.href = "homepage.html";
    })
    .catch((error) => {
      // Handle errors here
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Login error:", errorCode, errorMessage);
    });
}

function logOut() {
  firebase
    .auth()
    .signOut()
    .then(function () {
      // Sign-out successful.
      console.log("User signed out.");
      window.location.href = "index.html";
    })
    .catch(function (error) {
      // An error happened.
      console.error("Logout error:", error);
    });
}

function resetPass() {
  const email = document.getElementById("ForgotUser").value;
  firebase
    .auth()
    .sendPasswordResetEmail(email)
    .then(function () {
      // Password reset email sent successfully
      console.log("Password reset email sent.");
      alert(
        "Password reset email sent. Check your email to reset your password."
      );
    })
    .catch(function (error) {
      // Handle errors here
      var errorCode = error.code;
      var errorMessage = error.message;
      console.error("Password reset error:", errorCode, errorMessage);
      alert("Password reset error: " + errorMessage);
    });
}

//handling the navigation bar
const navLinks = document.querySelectorAll(".topnav a");

// Loop through each link and add a click event listener
navLinks.forEach((link) => {
  link.addEventListener("click", function () {
    // Remove the "active" class from all links
    navLinks.forEach((link) => {
      link.classList.remove("active");
    });

    // Add the "active" class to the clicked link
    this.classList.add("active");
  });
});

document
  .querySelector(".create-tournament-link")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the link from navigating
    openPopup();
  });
function openPopup() {
  var popup = document.getElementById("createTournamentForm");
  if (popup.style.display === "none") {
    popup.style.display = "block";
  } else {
    popup.style.display = "none";
  }
}

const tournamentsList = document.getElementById("tournaments-list");

function loadTournamentContent(tournamentKey) {
  // Fetch tournament data based on the tournamentKey
  var tournamentRef = firebase.database().ref("tourneys/" + tournamentKey);
  tournamentRef.once("value", (snapshot) => {
    var tournamentData = snapshot.val();

    // Update the content in your HTML with the tournament details
    document.getElementById("tournaments-list").innerHTML = `
      <h2>${tournamentData.name}</h2>
      <p>${tournamentData.description}</p>
      <h3>Contestants:</h3>
      <ul id="contestants-list"></ul> 
      <div>
       <button onclick="joinTourney('${tournamentKey}')">Join</button>
       </div>
    `;

    // Retrieve and display the list of contestants
    var contestantsList = document.getElementById("contestants-list");
    var contestants = tournamentData.competitors;

    // Fetch user emails from the "Users" node
    var usersRef = firebase.database().ref("Users");

    for (var contestantId in contestants) {
      //console.log(contestantId);
      if (contestants.hasOwnProperty(contestantId)) {
        //console.log(contestantId);
        // Check if the contestantId exists in the "Users" node
        usersRef.child(contestantId).once("value", (userSnapshot) => {
          if (userSnapshot.exists()) {
            //console.log(contestantId);
            var userRef = firebase.database().ref("Users/" + contestantId);
            var user = userSnapshot.val();
            var email = user.email;
            //console.log(email);// Assuming "email" is the property in your user object
            var contestantElement = document.createElement("li");
            contestantElement.textContent = email;
            contestantsList.appendChild(contestantElement);
          } else {
            // Handle the case where the contestantId doesn't exist in "Users"
            console.log("Contestant ID not found in Users:", contestantId);
          }
        });
      }
    }
  });
}

function joinTourney(tournamentKey) {
  // Check if the contestant is already in the tournament
  var tournamentRef = firebase.database().ref("tourneys/" + tournamentKey);
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      var contestantId = user.uid;
      tournamentRef.once("value", (snapshot) => {
        var tournamentData = snapshot.val();
        var contestants = tournamentData.competitors;

        if (contestants.hasOwnProperty(contestantId)) {
          // The contestant is already in the tournament
          console.log("Contestant is already in the tournament:", contestantId);
        } else {
          // The contestant is not in the tournament, so add them
          tournamentRef.child("competitors").update({
            [contestantId]: true,
          });

          console.log("Contestant added to the tournament:", contestantId);
        }
      });
    }
  });
}

function displayTournaments() {
  // Reference to the 'tournaments' collection in Firebase
  const tournamentsRef = firebase.database().ref("tourneys");

  // Clear the existing list before adding new tournaments
  tournamentsList.innerHTML = "";

  // Listen for changes in the 'tournaments' collection
  tournamentsRef.on("value", (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const tournament = childSnapshot.val();
      const tournamentId = childSnapshot.key;

      // Create HTML elements for each tournament with links
      const tournamentElement = document.createElement("div");
      tournamentElement.innerHTML = `
        <div class="tournament">
          <a href="#/tournament/${tournamentId}">
            <h2>${tournament.name}</h2>
          </a>
          <p>${tournament.description}</p>
        </div>
      `;

      tournamentsList.appendChild(tournamentElement);

      // Add an event listener to the tournament link for client-side routing
      // Add an event listener to the tournament link for client-side routing
      const tournamentLink = tournamentElement.querySelector("a");
      tournamentLink.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent the default link behavior

        // Extract the tournamentKey from the URL hash
        const tournamentKey = tournamentLink.getAttribute("href").substring(13); // Remove "#/tournament/"

        // Programmatically update the URL hash
        window.location.hash = "/tournament/" + tournamentKey;

        // Call the loadTournamentContent function to load the tournament details
        loadTournamentContent(tournamentKey);
      });
    });
  });
}

displayTournaments();

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
  } else {
    // No user is signed in.
  }
});

function createTournament() {
  //console.log("hello");
  // Get the tournament name and description from the input fields
  var name = document.getElementById("nameTourney").value;
  var description = document.getElementById("descTourney").value;

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      var userId = user.uid;
      // User is signed in.

      // Generate a unique key for the new tournament
      var newTournamentRef = firebase.database().ref("tourneys").push();

      // The key for the new tournament is generated and can be retrieved like this:
      var tournamentKey = newTournamentRef.key;

      // Create a new tournament entry in the database
      console.log(userId);
      const newTournament = {
        name: name,
        description: description,
        creator: userId,
        tournamentKey: tournamentKey,
        competitors: {
          [userId]: true, // Use the user's ID as the key and set the value to true
          // Add more competitors as needed
        },
        // Add more tournament data as needed
      };

      // Set the tournament data under the generated key
      newTournamentRef.set(newTournament);

      // Redirect or perform any other actions after creating the tournament
      alert("Tournament created with key: " + tournamentKey);
      // You can redirect the user to the tournament's registration page or another page here.
    } else {
      // No user is signed in.
    }
  });
}
