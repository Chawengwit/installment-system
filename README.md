# Installment-System

# Project Structure
installment-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/         👈 ใส่ route ทั้งหมดไว้ที่นี่
│   │   ├── models/
│   │   ├── db/             👈 การเชื่อมต่อฐานข้อมูล
│   │   └── app.js          👈 ไฟล์หลักของ Express app
│   │   └── server.js       👈 ใช้ `app.js` เริ่ม server
│   ├── tests/
│   │   └── app.test.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── scss/
│   │   └── style.scss
│   ├── js/
│   │   └── main.js
│   └── dist/ (compiled SCSS)
├── docker-compose.yml
├── Dockerfile
└── README.md