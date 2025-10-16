// Import Firebase SDK (Modular v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCK_dbQqEwjjGhX7dIFM_gHtxi6rqlgS1s",
  authDomain: "fir-project-7b760.firebaseapp.com",
  databaseURL: "https://fir-project-7b760-default-rtdb.firebaseio.com",
  projectId: "fir-project-7b760",
  storageBucket: "fir-project-7b760.firebasestorage.app",
  messagingSenderId: "455468965561",
  appId: "1:455468965561:web:420f2edf66acd880318568",
  measurementId: "G-5D5V0RC8TC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Form and Table Elements
const form = document.getElementById("contactForm");
const dataTable = document.getElementById("dataTable").querySelector("tbody");

// Submit Form - Add Data
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();

  if (firstName && lastName && email) {
    const newContactRef = push(ref(db, "contacts"));
    set(newContactRef, { firstName, lastName, email });
    form.reset();
  }
});

// Fetch Data in Real-Time
onValue(ref(db, "contacts"), (snapshot) => {
  dataTable.innerHTML = "";
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    const id = childSnapshot.key;

    const row = `
      <tr>
        <td data-label="First Name">${data.firstName}</td>
        <td data-label="Last Name">${data.lastName}</td>
        <td data-label="Email">${data.email}</td>
        <td data-label="Actions">
          <button class="edit-btn" data-id="${id}">Edit</button>
          <button class="delete-btn" data-id="${id}">Delete</button>
        </td>
      </tr>
    `;
    dataTable.innerHTML += row;
  });

  // Edit Functionality - All Fields At Once
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const row = btn.closest("tr");
      const fName = row.children[0].textContent;
      const lName = row.children[1].textContent;
      const email = row.children[2].textContent;

      row.innerHTML = `
        <td><input type="text" id="editFirst" value="${fName}"></td>
        <td><input type="text" id="editLast" value="${lName}"></td>
        <td><input type="email" id="editEmail" value="${email}"></td>
        <td>
          <button class="save-btn" data-id="${id}">Save</button>
          <button class="cancel-btn">Cancel</button>
        </td>
      `;

      row.querySelector(".save-btn").addEventListener("click", () => {
        const newF = row.querySelector("#editFirst").value.trim();
        const newL = row.querySelector("#editLast").value.trim();
        const newE = row.querySelector("#editEmail").value.trim();

        if (newF && newL && newE) {
          update(ref(db, "contacts/" + id), {
            firstName: newF,
            lastName: newL,
            email: newE,
          });
        }
      });

      row.querySelector(".cancel-btn").addEventListener("click", () => {
        row.innerHTML = `
          <td data-label="First Name">${fName}</td>
          <td data-label="Last Name">${lName}</td>
          <td data-label="Email">${email}</td>
          <td data-label="Actions">
            <button class="edit-btn" data-id="${id}">Edit</button>
            <button class="delete-btn" data-id="${id}">Delete</button>
          </td>
        `;
      });
    });
  });

  // Delete Functionality
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Are you sure you want to delete this contact?")) {
        remove(ref(db, "contacts/" + id));
      }
    });
  });
});
