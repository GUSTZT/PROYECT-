
// ==========================================
// NEXUS LIBRARY - SCRIPT PRINCIPAL
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// FIREBASE
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyCNmjHP0Xw9Q-qV5gW20uRbRzIuloyamwU",
  authDomain: "nexus-library-f73cd.firebaseapp.com",
  projectId: "nexus-library-f73cd",
  storageBucket: "nexus-library-f73cd.firebasestorage.app",
  messagingSenderId: "65743064410",
  appId: "1:65743064410:web:dd5a801b4bdf3598acf763",
  measurementId: "G-MDRQDMRFQL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

let currentUser = null;
let authMode = "login";
let unsubscribeBooks = null;

// ==========================================
// PORTADAS DE LIBROS - OPEN LIBRARY
// ==========================================

const bookCovers = {
  "Noches blancas": "9780140448955",
  "El principito": "9780156012195",
  "Meditaciones": "9780812968255",
  "Historia de la filosofía": "9780671739164",
  "Cien años de soledad": "9780060883287",
  "La casa de los espíritus": "9780553383805",
  "Don Quijote de la Mancha": "9780060934347",
  "Tres hombres en una barca": "9780140437504",
  "Berserk": "9781593070205",
  "Death Note": "9781421501680",
  "Drácula": "9780141439846",
  "Frankenstein": "9780141439471",
  "Dune": "9780441172719",
  "1984": "9780451524935",
  "Sapiens": "9780062316097",
  "Armas, gérmenes y acero": "9780393317558",
  "Cómo leer un libro": "9780671212094",
  "Los 7 hábitos": "9781982137274",
  "Hábitos atómicos": "9780735211292",
  "El poder del ahora": "9781577314806"
};

function placeholderCover(title) {
  const safeTitle = String(title || "NEXUS")
    .replace(/[<>&"]/g, "");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
      <rect width="100%" height="100%" fill="#171012"/>
      <rect x="18" y="18" width="364" height="564" rx="12"
        fill="none" stroke="#e50914" stroke-width="4"/>
      <text x="200" y="270" fill="#e50914" font-size="34"
        text-anchor="middle" font-family="Arial" font-weight="bold">NEXUS</text>
      <text x="200" y="325" fill="white" font-size="21"
        text-anchor="middle" font-family="Arial">${safeTitle}</text>
      <text x="200" y="540" fill="#999" font-size="17"
        text-anchor="middle" font-family="Arial">LIBRARY</text>
    </svg>
  `;

  return "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(svg);
}

function loadBookCovers() {
  $$("img[data-book-query]").forEach(img => {
    const title = img.alt
      .replace("Portada de ", "")
      .trim();

    const isbn = bookCovers[title];

    img.onerror = () => {
      img.onerror = null;
      img.src = placeholderCover(title);
    };

    if (!isbn) {
      img.src = placeholderCover(title);
      return;
    }

    img.src =
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  });
}

// ==========================================
// LIBROS DESTACADOS
// ==========================================

function createFeaturedBooks() {
  const container = $("#featuredBooks");
  if (!container) return;

  container.innerHTML = "";

  const selected = [
    "Berserk",
    "Noches blancas",
    "Meditaciones",
    "Cien años de soledad"
  ];

  selected.forEach(title => {
    const original = [...$$(".catalog-section .book-card")].find(card =>
      card.querySelector("h4")?.textContent.trim() === title
    );

    if (original) {
      container.appendChild(original.cloneNode(true));
    }
  });
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function showScreen(screenId) {
  $$(".screen").forEach(screen => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  $$(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.go === screenId
    );
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-go]");

  if (button) {
    showScreen(button.dataset.go);
  }
});

// ==========================================
// CATEGORÍAS Y BÚSQUEDA
// ==========================================

let activeCategory = "Todos";

function filterBooks() {
  const search = ($("#searchInput")?.value || "")
    .toLowerCase()
    .trim();

  let visibleCount = 0;

  $$(".catalog-section").forEach(section => {
    const category = section.querySelector("h3")
      ?.textContent.trim();

    const categoryMatches =
      activeCategory === "Todos" ||
      category === activeCategory;

    let hasVisible = false;

    section.querySelectorAll(".book-card").forEach(card => {
      const matches = card.textContent
        .toLowerCase()
        .includes(search);

      const visible = categoryMatches && matches;

      card.style.display = visible ? "" : "none";

      if (visible) {
        hasVisible = true;
        visibleCount++;
      }
    });

    section.style.display = hasVisible ? "" : "none";
  });

  if ($("#noResults")) {
    $("#noResults").hidden = visibleCount > 0;
  }
}

$$("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    $$(".filter-button").forEach(filter => {
      filter.classList.toggle(
        "active",
        filter.dataset.category === activeCategory
      );
    });

    showScreen("explorar");
    filterBooks();
  });
});

$("#searchInput")?.addEventListener("input", filterBooks);

// ==========================================
// FAVORITOS
// ==========================================

function getFavorites() {
  try {
    return JSON.parse(
      localStorage.getItem("nexusFavorites")
    ) || [];
  } catch {
    return [];
  }
}

function refreshFavorites() {
  const favorites = getFavorites();

  $$(".save-book").forEach(button => {
    const saved = favorites.includes(button.dataset.save);

    button.classList.toggle("saved", saved);
    button.textContent = saved ? "♥" : "♡";
  });

  const container = $("#favoriteBooks");
  if (!container) return;

  container.innerHTML = "";

  favorites.forEach(title => {
    const original = [...$$(".catalog-section .book-card")].find(card =>
      card.querySelector("h4")?.textContent.trim() === title
    );

    if (original) {
      container.appendChild(original.cloneNode(true));
    }
  });

  loadBookCovers();
}

document.addEventListener("click", event => {
  const button = event.target.closest(".save-book");
  if (!button) return;

  const title = button.dataset.save;
  let favorites = getFavorites();

  if (favorites.includes(title)) {
    favorites = favorites.filter(item => item !== title);
  } else {
    favorites.push(title);
  }

  localStorage.setItem(
    "nexusFavorites",
    JSON.stringify(favorites)
  );

  refreshFavorites();
});

// ==========================================
// AUTENTICACIÓN
// ==========================================

function openAuthModal() {
  $("#authModal").hidden = false;
  $("#authMessage").textContent = "";
}

function closeAuthModal() {
  $("#authModal").hidden = true;
}

$("#authButton")?.addEventListener("click", openAuthModal);
$("#profileAuthButton")?.addEventListener("click", openAuthModal);
$("#closeAuthModal")?.addEventListener("click", closeAuthModal);

$("#authModal")?.addEventListener("click", event => {
  if (event.target.id === "authModal") {
    closeAuthModal();
  }
});

function updateAuthMode() {
  const login = authMode === "login";

  $("#authTitle").textContent =
    login ? "Iniciar sesión" : "Crear cuenta";

  $("#authSubmit").textContent =
    login ? "Entrar" : "Registrarme";

  $("#toggleAuthMode").textContent =
    login
      ? "¿No tienes cuenta? Regístrate"
      : "¿Ya tienes cuenta? Inicia sesión";

  $("#authMessage").textContent = "";
}

$("#toggleAuthMode")?.addEventListener("click", () => {
  authMode = authMode === "login" ? "register" : "login";
  updateAuthMode();
});

$("#authForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const message = $("#authMessage");

  message.textContent = "Procesando...";

  try {
    if (authMode === "register") {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
    } else {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    }

    message.textContent = "Operación completada correctamente.";

    setTimeout(closeAuthModal, 700);

  } catch (error) {
    console.error(error);

    const messages = {
      "auth/email-already-in-use":
        "Este correo ya está registrado.",
      "auth/invalid-email":
        "El correo no es válido.",
      "auth/weak-password":
        "La contraseña debe tener al menos 6 caracteres.",
      "auth/invalid-credential":
        "Correo o contraseña incorrectos.",
      "auth/network-request-failed":
        "Revisa tu conexión a internet."
    };

    message.textContent =
      messages[error.code] ||
      "No se pudo completar la operación.";
  }
});

// ==========================================
// PERFIL Y CIERRE DE SESIÓN
// ==========================================

function updateProfile(user) {
  if (user) {
    const email = user.email || "Usuario Nexus";

    $("#profileName").textContent = email.split("@")[0];
    $("#profileEmail").textContent = email;
    $("#profileAvatar").textContent =
      email.charAt(0).toUpperCase();

    $("#authButton").textContent = "Mi cuenta";
    $("#profileAuthButton").hidden = true;
    $("#logoutButton").hidden = false;

  } else {
    $("#profileName").textContent = "Invitado";
    $("#profileEmail").textContent =
      "Inicia sesión para acceder a tu cuenta.";

    $("#profileAvatar").textContent = "N";
    $("#authButton").textContent = "Iniciar sesión";
    $("#profileAuthButton").hidden = false;
    $("#logoutButton").hidden = true;
  }
}

$("#logoutButton")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showScreen("inicio");
  } catch (error) {
    console.error(error);
    alert("No se pudo cerrar sesión.");
  }
});

// ==========================================
// MIS PUBLICACIONES
// ==========================================

function renderMyBooks(books) {
  const container = $("#myBooks");
  if (!container) return;

  container.innerHTML = "";

  if (books.length === 0) {
    container.textContent =
      "Todavía no has publicado libros.";
    return;
  }

  books.forEach(book => {
    const card = document.createElement("article");
    card.className = "book-card";

    const image = document.createElement("img");
    image.src = placeholderCover(book.title);
    image.alt = "Portada de " + book.title;

    const info = document.createElement("div");
    info.className = "book-info";

    const title = document.createElement("h4");
    title.textContent = book.title;

    const author = document.createElement("p");
    author.textContent = book.author;

    const category = document.createElement("span");
    category.textContent = book.category;

    const file = document.createElement("p");
    file.textContent = book.fileName
      ? "Archivo: " + book.fileName
      : "Sin archivo";

    info.append(title, author, category, file);
    card.append(image, info);
    container.appendChild(card);
  });
}

function listenToMyBooks(user) {
  if (unsubscribeBooks) {
    unsubscribeBooks();
    unsubscribeBooks = null;
  }

  if (!user) {
    renderMyBooks([]);
    return;
  }

  const booksQuery = query(
    collection(db, "books"),
    where("ownerId", "==", user.uid)
  );

  unsubscribeBooks = onSnapshot(
    booksQuery,
    snapshot => {
      const books = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderMyBooks(books);
    },
    error => {
      console.error(error);
      $("#myBooks").textContent =
        "No se pudieron cargar tus publicaciones.";
    }
  );
}

// ==========================================
// PUBLICAR LIBROS
// ==========================================

$("#publishForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const message = $("#publishMessage");

  if (!currentUser) {
    message.textContent =
      "Primero debes iniciar sesión.";
    openAuthModal();
    return;
  }

  const file = $("#bookFile").files[0];

  if (!file) {
    message.textContent =
      "Selecciona un archivo PDF o EPUB.";
    return;
  }

  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (!["pdf", "epub"].includes(extension)) {
    message.textContent =
      "Solo se permiten archivos PDF o EPUB.";
    return;
  }

  const book = {
    title: $("#bookTitle").value.trim(),
    author: $("#bookAuthor").value.trim(),
    category: $("#bookCategory").value,
    description: $("#bookDescription").value.trim(),
    fileName: file.name,
    fileType: extension,
    ownerId: currentUser.uid,
    createdAt: serverTimestamp()
  };

  message.textContent = "Publicando información...";

  try {
    await addDoc(collection(db, "books"), book);

    message.textContent =
      "¡Libro registrado correctamente en Nexus!";

    $("#publishForm").reset();

  } catch (error) {
    console.error(error);

    message.textContent =
      "No se pudo publicar. Revisa Firebase.";
  }
});

// ==========================================
// LECTOR PDF Y EPUB
// ==========================================

function openReader(title, fileUrl, type) {
  showScreen("lector");

  $("#readerTitle").textContent = title;

  const reader = $("#readerContent");
  reader.innerHTML = "";

  if (type === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.src = fileUrl;
    reader.appendChild(iframe);

  } else if (type === "epub") {
    if (typeof ePub !== "function") {
      reader.textContent =
        "No se pudo cargar el lector EPUB.";
      return;
    }

    const viewer = document.createElement("div");
    viewer.style.height = "75vh";
    viewer.style.background = "#fff";

    reader.appendChild(viewer);

    const book = ePub(fileUrl);

    book.renderTo(viewer, {
      width: "100%",
      height: "100%"
    }).display();

  } else {
    reader.textContent =
      "Formato no compatible.";
  }
}

$("#closeReader")?.addEventListener("click", () => {
  showScreen("mis-libros");
});

// ==========================================
// INICIO
// ==========================================

onAuthStateChanged(auth, user => {
  currentUser = user;
  updateProfile(user);
  listenToMyBooks(user);
});

createFeaturedBooks();
refreshFavorites();
loadBookCovers();
