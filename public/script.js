const loginForm = document.getElementById("loginForm");
const otpForm = document.getElementById("otpForm");
const profileUsername = document.getElementById("profileUsername");

if(loginForm){
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = "";

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: username,
                    password: password
                })
            });

            const data = await response.json();

            if(response.ok) {
                window.location.href = data.redirect;
            }else{
                errorMessage.textContent = data.message;
            }
        }catch(error) {
            console.error("Login Error:", error);
            errorMessage.textContent = "Cannot connect to server.";
        }
    });
}

if(otpForm) {
    const emailDisplay = document.getElementById("emailDisplay");
    const otpMessage = document.getElementById("otpMessage");

    async function loadOTPPage() {
        try {
            const response = await fetch("/api/pending-otp");
            const data = await response.json();

            if(!response.ok) {
                window.location.href = "/";
            }else{
                emailDisplay.textContent = "ระบบส่งรหัส OTP ไปยัง " + data.email + " แล้ว";
            }
        }catch(error) {
            console.error("OTP Page Error:", error);
            window.location.href = "/";
        }
    }

    loadOTPPage();

    otpForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        const userOTP = document.getElementById("otp").value;
        otpMessage.textContent = "";

        if(!/^\d{6}$/.test(userOTP)) {
            otpMessage.textContent = "Please enter a valid 6-digit OTP.";
            return;
        }

        try {
            const response = await fetch("/api/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    otp: userOTP
                })
            });

            const data = await response.json();

            if(response.ok) {
                window.location.href = data.redirect;
            }else{
                otpMessage.textContent = data.message;
            }
        }catch(error) {
            console.error("OTP Verification Error:", error);
            otpMessage.textContent = "Cannot connect to server.";
        }
    });
}

if(profileUsername) {
    async function loadProfile() {
        try {
            const response = await fetch("/api/profile");
            const data = await response.json();

            if(!response.ok) {
                window.location.href = "/";
            }else{
                profileUsername.textContent = data.email;
                document.getElementById("usernameValue").textContent = data.email;
            }
        }catch(error) {
            console.error("Profile Error:", error);
            window.location.href = "/";
        }
    }

    loadProfile();

    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async function() {
        try {
            const response = await fetch("/api/logout", { method: "POST" });
            const data = await response.json();
            
            if(response.ok) {
                window.location.href = data.redirect;
            }
        }catch(error) {
            console.error("Logout Error:", error);
            alert("Cannot logout. Please try again.");
        }
    });
}