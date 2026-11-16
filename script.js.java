
document.addEventListener("DOMContentLoaded", () => {

    // COMPROBAR FIREBASE
    if (typeof firebase === "undefined") {
        alert("Error: Firebase no se ha cargado. Revisa tu conexión.");
        return;
    }

    // CONFIGURACIÓN
    const firebaseConfig = {
        apiKey: "AIzaSyCNmjHP0Xw9Q-qV5gW20uRbRzIuloyamwU",
        authDomain: "nexus-library-f73cd.firebaseapp.com",
        projectId: "nexus-library-f73cd",
        storageBucket: "nexus-library-f73cd.firebasestorage.app",
        messagingSenderId: "65743064410",
        appId: "1:65743064410:web:dd5a801b4bdf3598acf763",
        measurementId: "G-MDRQDMRFQL"
    };

    // INICIAR FIREBASE
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    // INICIAR SESIÓN
    loginBtn.addEventListener("click", async () => {

        const email = prompt("Introduce tu correo electrónico:");
        if (!email) return;

        const password = prompt("Introduce tu contraseña:");
        if (!password) return;

        try {
            await auth.signInWithEmailAndPassword(
                email.trim(),
                password
            );

            alert("¡Bienvenido a NEXUS LIBRARY!");

        } catch (error) {
            alert("Error al iniciar sesión: " + error.message);
        }
    });

    // CREAR CUENTA
    registerBtn.addEventListener("click", async () => {

        const name = prompt("Introduce tu nombre:");
        if (!name) return;

        const email = prompt("Introduce tu correo:");
        if (!email) return;

        const password = prompt("Crea una contraseña de mínimo 6 caracteres:");
        if (!password) return;

        try {
            const result = await auth.createUserWithEmailAndPassword(
                email.trim(),
                password
            );

            await result.user.updateProfile({
                displayName: name.trim()
            });

            alert("¡Cuenta creada correctamente!");

        } catch (error) {
            alert("Error al registrarte: " + error.message);
        }
    });

    // CERRAR SESIÓN
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Cerrar sesión";
    logoutBtn.style.display = "none";

    document.querySelector(".user-actions").appendChild(logoutBtn);

    logoutBtn.addEventListener("click", async () => {
        try {
            await auth.signOut();
            alert("Sesión cerrada correctamente.");
        } catch (error) {
            alert(error.message);
        }
    });

    // ESTADO DE LA CUENTA
    auth.onAuthStateChanged(user => {

        loginBtn.style.display = user ? "none" : "inline-block";
        registerBtn.style.display = user ? "none" : "inline-block";
        logoutBtn.style.display = user ? "inline-block" : "none";

        if (user) {
            console.log("Usuario conectado:", user.email);
        }
    });

    console.log("NEXUS LIBRARY iniciado correctamente.");

});
