# Lab 08 Authentication

ระบบ Login โดยใช้ Email และ Password ร่วมกับการยืนยันตัวตนด้วย OTP ผ่านอีเมล

## สิ่งที่ทำใน Lab
- Login ด้วย Email และ Password
- สร้าง OTP จำนวน 6 หลัก และส่งผ่านอีเมล
- สร้าง Reference Number
- กำหนดให้ OTP หมดอายุภายใน 2 นาที
- จำกัดการกรอก OTP ผิดไม่เกิน 3 ครั้ง
- ใช้ Session และ Cookie ในการจัดการการเข้าสู่ระบบ
- เข้าสู่หน้า Profile หลังยืนยัน OTP สำเร็จ
- Logout เพื่อออกจากระบบ

## วิธีใช้งาน
1. ติดตั้ง Dependencies
```bash
npm install
```

2. สร้างไฟล์ `.env` โดยใช้ข้อมูลจาก `.env.example` และตั้งค่า Gmail SMTP

3. เปิด Server
```bash
node server.js
```

4. เปิด Browser แล้วเข้า `http://localhost:3000`

## ข้อมูลสำหรับทดลอง
- Email: ใช้อีเมลของตัวเองที่รับ OTP ได้
- Password: `12345678`

**หมายเหตุ**
- ก่อนใช้งานต้องตั้งค่าไฟล์ `.env`
- `SESSION_SECRET` ให้ใส่ข้อความสุ่มสำหรับใช้จัดการ Session
- `SMTP_USER` ให้ใส่ Gmail ที่ใช้ส่ง OTP
- `SMTP_PASS` ให้สร้าง Google App Password จาก https://myaccount.google.com/apppasswords โดยต้องเปิด 2-Step Verification ก่อน