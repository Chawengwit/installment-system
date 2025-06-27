# Project Structure

installment-system/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Logic ของ route ต่าง ๆ
│   │   ├── routes/             # 📌 รวม route ของ Express ทั้งหมด
│   │   ├── models/             # โครงสร้างข้อมูล / ORM
│   │   ├── db/                 # เชื่อมต่อกับ PostgreSQL
│   │   ├── app.js              # ตั้งค่า Express app หลัก
│   │   └── server.js           # ใช้ app.js เพื่อรัน Express server
│   ├── tests/
│   │   └── app.test.js         # Unit test ด้วย Jest & Supertest
│   ├── .env                    # Config สิ่งแวดล้อม เช่น DATABASE_URL, PORT
│   └── package.json            # รายการ dependencies และ script
│
├── frontend/
│   ├── public/
│   │   └── index.html          # หน้า HTML หลัก
│   ├── scss/
│   │   └── style.scss          # ไฟล์ SCSS ที่ยังไม่ compile
│   ├── js/
│   │   └── main.js             # JavaScript สำหรับ frontend
│   └── dist/                   # ไฟล์ที่ compile จาก SCSS (output)
│
├── docker-compose.yml          # ตั้งค่า container สำหรับ backend และ db
├── Dockerfile                  # สร้าง image สำหรับ Express backend
└── README.md                   # คำอธิบายโปรเจกต์นี้
