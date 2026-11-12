const express = require("express");
const session = require("express-session");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        name: "auth.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 10 * 60 * 1000
        }
    })
);

const demoUser = {
    email: process.env.DEMO_EMAIL,
    password: process.env.DEMO_PASSWORD
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

function hashOTP(otp) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

function requireAuth(req, res, next) {
    if(!req.session.user) {
        return res.redirect("/");
    }
    next();
}

function requirePendingOTP(req, res, next) {
    if(!req.session.pendingOTP) {
        return res.redirect("/");
    }
    next();
}

app.get("/profile.html", requireAuth, (req, res) => {
    res.sendFile(__dirname + "/public/profile.html");
});

app.get("/otp.html", requirePendingOTP, (req, res) => {
    res.sendFile(__dirname + "/public/otp.html");
});

app.use(express.static(__dirname + "/public"));

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
        }

        if(!email || password !== demoUser.password) {
            return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password !== demoUser.password) {
            return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        const otp = String(crypto.randomInt(100000, 1000000));
        const referenceNumber = "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();

        req.session.pendingOTP = {
            email: email,
            otpHash: hashOTP(otp),
            referenceNumber,
            expiresAt: Date.now() + 2 * 60 * 1000,
            attempts: 0
        };

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "รหัส Authentication OTP",
            text: `รหัส OTP ของคุณคือ ${otp}\nReference Number: ${referenceNumber}\nรหัส OTP นี้ มีอายุ 2 นาที`
        });

        res.json({
            message: "ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว",
            redirect: "/otp.html"
        });

    } catch (error) {
        console.error("Login error:", error);
        delete req.session.pendingOTP;
        res.status(500).json({ message: "ไม่สามารถส่ง OTP ได้ กรุณาตรวจสอบการตั้งค่าอีเมล" });
    }
});

app.post("/api/verify-otp", (req, res) => {
    const { otp } = req.body;
    const pending = req.session.pendingOTP;
    if(!pending) {
        return res.status(401).json({ message: "กรุณาเข้าสู่ระบบใหม่" });
    }

    if(Date.now() > pending.expiresAt) {
        delete req.session.pendingOTP;
        return res.status(401).json({ message: "OTP หมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่" });
    }

    if(pending.attempts >= 3) {
        delete req.session.pendingOTP;
        return res.status(429).json({ message: "กรอก OTP ผิดเกินจำนวนครั้งที่กำหนด กรุณาเข้าสู่ระบบใหม่" });
    }

    if(!/^\d{6}$/.test(otp || "")) {
        return res.status(400).json({ message: "กรุณากรอก OTP 6 หลัก" });
    }

    if(hashOTP(otp) !== pending.otpHash) {
        pending.attempts++;
        return res.status(401).json({ message: `OTP ไม่ถูกต้อง เหลือโอกาสอีก ${3 - pending.attempts} ครั้ง` });
    }

    const email = pending.email;

    req.session.regenerate((err) => {
        if(err) {
            return res.status(500).json({ message: "ไม่สามารถสร้าง Session ได้" });
        }
        req.session.user = { email };
        req.session.save((saveError) => {
            if(saveError) {
                return res.status(500).json({ message: "ไม่สามารถบันทึก Session ได้" });
            }
            res.json({
                message: "ยืนยันตัวตนสำเร็จ",
                redirect: "/profile.html"
            });
        });
    });
});

app.get("/api/profile", requireAuth, (req, res) => {
    res.json({ email: req.session.user.email });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            return res.status(500).json({ message: "ไม่สามารถออกจากระบบได้" });
        }
        res.clearCookie("auth.sid");
        res.json({
            message: "ออกจากระบบเรียบร้อยแล้ว",
            redirect: "/"
        });
    });
});

app.get("/api/pending-otp", (req, res) => {
    const pending = req.session.pendingOTP;
    if (!pending) {
        return res.status(401).json({ message: "ไม่พบข้อมูลการยืนยันตัวตน" });
    }

    if (Date.now() > pending.expiresAt) {
        delete req.session.pendingOTP;
        return res.status(401).json({ message: "OTP หมดอายุแล้ว" });
    }

    res.json({ email: pending.email });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});