## Project Overview

This project is a web-based installment system.

### Backend

*   **Language/Framework:** Node.js with Express.js
*   **Database:** PostgreSQL
*   **API Style:** RESTful API

### Frontend

*   **Language/Framework:** JavaScript (ES6) with jQuery
*   **Styling:** SCSS (Sass)
*   **Architecture:** Single-Page Application (SPA)

## Commands

All commands should be run from the `backend` directory.

*   **Install Dependencies:** `npm install`
*   **Run in Development:** `npm run dev`
*   **Run in Production:** `npm start`
*   **Run Tests:** `npm test`
*   **Compile SCSS:** `npm run scss`

## Important Files and Directories

*   `backend/src/app.js`: Main application file.
*   `backend/src/routes/`: Contains API and frontend routes.
*   `frontend/`: Contains all frontend code.
*   `frontend/js/`: Contains JavaScript files.
*   `frontend/scss/`: Contains SCSS files.
*   `frontend/public/`: Contains static assets and `index.html`.

## Coding Style and Conventions

*   **Backend:** Uses CommonJS modules (`require`/`module.exports`).
*   **Frontend:** Uses jQuery for DOM manipulation and AJAX. Global utility functions are exposed via the `window` object (`AppUtils`, `AppLoading`).
*   **API:** API routes are prefixed with `/api`.
