const loginForm = document.getElementById("loginForm");
const loginHeading = document.getElementById("loginHeading");
const loginDescription = document.getElementById("loginDescription");
const loginEyebrow = document.getElementById("loginEyebrow");
const loginSubmit = document.getElementById("loginSubmit");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const confirmPassword = document.getElementById("confirmPassword");
const confirmPasswordField = document.getElementById("confirmPasswordField");
const loginError = document.getElementById("loginError");
const signInTab = document.getElementById("signInTab");
const signUpTab = document.getElementById("signUpTab");
const localAppUrl = "http://localhost:3010";

let authMode = "sign-in";
let isAuthenticating = false;

function redirectToAppServerIfNeeded() {
    const isFilePage = window.location.protocol === "file:";
    const isLocalStaticServer = ["localhost", "127.0.0.1"].includes(window.location.hostname)
        && window.location.port !== "3010";

    if (isFilePage || isLocalStaticServer) {
        window.location.replace(`${localAppUrl}/login`);
        return true;
    }

    return false;
}

function setAuthMode(mode) {
    authMode = mode;
    const isSignUp = mode === "sign-up";

    loginEyebrow.textContent = isSignUp ? "NEW ACCOUNT" : "ACCOUNT";
    loginHeading.textContent = isSignUp ? "Create account" : "Sign in";
    loginDescription.textContent = isSignUp
        ? "Create an account to use the OCR tool."
        : "Use your account to open the app.";
    loginSubmit.innerHTML = isSignUp
        ? "Create account"
        : "Sign in";
    loginPassword.autocomplete = isSignUp ? "new-password" : "current-password";
    loginPassword.placeholder = isSignUp ? "Create a password" : "Enter your password";
    loginPassword.minLength = 8;
    confirmPasswordField.classList.toggle("hidden", !isSignUp);
    confirmPassword.required = isSignUp;
    confirmPassword.value = "";
    loginError.classList.add("hidden");
    loginError.textContent = "";
    signInTab.classList.toggle("active", !isSignUp);
    signUpTab.classList.toggle("active", isSignUp);
    signInTab.setAttribute("aria-selected", String(!isSignUp));
    signUpTab.setAttribute("aria-selected", String(isSignUp));
}

function displayLoginError(message) {
    loginError.textContent = message;
    loginError.classList.remove("hidden");
}

async function readApiResponse(response) {
    let result;
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("json")) {
        await response.text();
        throw new Error(
            `The server returned a non-JSON response (HTTP ${response.status}). `
            + "Run the app with `npm run dev` and open http://localhost:3010."
        );
    }

    try {
        result = await response.json();
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(
                `The server returned invalid JSON (HTTP ${response.status}). `
                + "Check the Node.js backend and try again."
            );
        }

        throw error;
    }

    if (!response.ok) {
        throw new Error(result.error || "The request could not be completed.");
    }

    return result;
}

signInTab.addEventListener("click", () => setAuthMode("sign-in"));
signUpTab.addEventListener("click", () => setAuthMode("sign-up"));

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isAuthenticating) {
        return;
    }

    loginError.classList.add("hidden");

    if (authMode === "sign-up" && loginPassword.value !== confirmPassword.value) {
        displayLoginError("Those passwords do not match. Please check them and try again.");
        confirmPassword.focus();
        return;
    }

    isAuthenticating = true;
    loginSubmit.disabled = true;
    loginSubmit.textContent = authMode === "sign-up" ? "Creating account..." : "Signing in...";

    try {
        const response = await fetch(`/api/auth/${authMode === "sign-up" ? "register" : "login"}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
                email: loginEmail.value,
                password: loginPassword.value
            })
        });
        await readApiResponse(response);
        loginForm.reset();
        window.location.replace("/");
    } catch (error) {
        displayLoginError(error instanceof TypeError
            ? "Could not reach the server. Check your connection and try again."
            : error.message);
    } finally {
        isAuthenticating = false;
        loginSubmit.disabled = false;
        loginSubmit.innerHTML = authMode === "sign-up"
            ? "Create account"
            : "Sign in";
    }
});

async function redirectIfSignedIn() {
    try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (response.ok) {
            window.location.replace("/");
        }
    } catch (error) {
        displayLoginError("Could not reach the server. Check your connection and try again.");
        console.error("Could not check existing session:", error);
    }
}

if (!redirectToAppServerIfNeeded()) {
    setAuthMode("sign-in");
    redirectIfSignedIn();
}
