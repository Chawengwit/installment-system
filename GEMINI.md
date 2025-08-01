## Project Overview

This project is a web-based installment system.

### Backend

*   **Language/Framework:** Node.js with Express.js
*   **Module System:** ES Modules (`import`/`export`)
*   **Database:** PostgreSQL
*   **API Style:** RESTful API

### Frontend

*   **Language/Framework:** JavaScript (ES6) with jQuery
*   **Module System:** ES Modules (`import`/`export`)
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
*   `frontend/js/utils/`: Contains shared utility ES Modules.
*   `frontend/scss/`: Contains SCSS files.
*   `frontend/public/`: Contains static assets and `index.html`.

## Coding Style and Conventions

*   **Backend:** Uses ES Modules (`import`/`export`).
*   **Frontend:** Uses jQuery for DOM manipulation and AJAX. JavaScript is structured using ES Module classes for page-specific logic and utility functions.
*   **API:** API routes are prefixed with `/api`.

## Reusable Page Structure and Patterns (Derived from Customers Page)

The Customers page (`frontend/public/pages/customers.html`, `frontend/js/pages/customers.js`, `frontend/scss/_customers.scss`) and the Credit Cards page (`frontend/public/pages/credit-cards.html`, `frontend/js/pages/credit-cards.js`, `frontend/scss/_credit-cards.scss`) serve as comprehensive templates for building other pages in the application. They demonstrate a consistent structure, stage management, and reusable patterns for both UI and logic.

### HTML Structure (e.g., `frontend/public/pages/customers.html`)
*   **Page Header (`page-header`):** Consistent layout for page titles, subtitles, and primary actions (e.g., "Create Customer", "Toggle View").
*   **Search and Filters (`search-section`):** Standardized section for search input (`search-bar`) and a collapsible filter panel (`filters`).
*   **Content Display (`customer-list`):** A flexible section to display dynamic content, often switching between different views (e.g., `customer-grid` for card view, `customer-table-view` for table view). Includes a `loading-overlay` for asynchronous operations.
*   **Modals (`modal`):** Reusable modal structures for various interactions (Add, Edit, Detail, Confirmation). These are typically hidden by default and controlled by JavaScript.
*   **Infinite Scroll Loading Indicator (`infinite-scroll-loading`):** A dedicated element to show loading status during infinite scrolling.

### JavaScript Patterns (ES Modules) (e.g., `frontend/js/pages/customers.js`)
Page-specific JavaScript is structured as an ES Module exporting a class, following these conventions:
*   **ES Module Class:** All page logic is encapsulated within a class (e.g., `PageCustomers`), exported as the default. This promotes modularity and avoids global namespace pollution.
*   **`constructor()`:** Initializes page-specific properties, including caching jQuery selectors for main content (`$mainContent`), and managing state variables (e.g., `currentPage`, `customersPerPage`, `isLoading`, `hasMore`).
*   **`init()`:** The main entry point for the page. It's responsible for initial data fetching (e.g., `fetchCustomers(true)` to clear existing data on first load) and binding all necessary event listeners.
*   **`destroy()`:** A crucial method for cleaning up event listeners (especially window-level events like scroll) and other resources when navigating away from the page. This prevents memory leaks and ensures a clean state for the next page.
*   **`bindEvents()`:** Centralized event delegation using `$("#main-content").on(...)` for all page-specific interactions. This ensures events are bound once and efficiently handle dynamically added content.
*   **Data Fetching (`fetchCustomers()`):** Asynchronous methods handle API calls, including parameters for search, sorting, and pagination (limit/offset). It manages loading states (`isLoading`), tracks if more data is available (`hasMore`), and updates the UI accordingly.
*   **Rendering (`renderCustomers()`):** Dynamically generates and updates HTML content based on fetched data. It supports both clearing existing content and appending new data for infinite scrolling.
*   **View Toggling (`toggleView()`):** Functions to switch between different content layouts (e.g., card vs. table views).
*   **Modal Interactions:** Dedicated methods (e.g., `handleAddCustomer`, `handleUpdateCustomer`, `handleDeleteCustomer`, `handleEditCustomer`, `handleViewCustomer`) manage form submissions, API calls, and modal visibility. They leverage imported utility functions for opening/closing modals and showing confirmations.
*   **Infinite Scrolling (`handleScroll()`):** A debounced scroll event listener that triggers `fetchCustomers` when the user approaches the bottom of the page, enabling seamless loading of more data.
*   **Utility Usage:** Leverages imported utility functions from `frontend/js/utils/AppUtils.js` (e.g., `debounce` for search input, `showNotification` for user feedback, `openModal`, `closeModal`, `showConfirmationModal`).

### SCSS Patterns (e.g., `frontend/scss/_customers.scss`)
Page-specific SCSS defines styles for the page's unique components (e.g., `customer-grid`, `customer-card`, `customer-table-view`, `customer-section-details`). It consistently uses SCSS variables for styling and includes responsive adjustments using media queries.

### Multi-step Form Pattern (Derived from Dashboard Page)
The Dashboard page (`frontend/public/pages/dashboard.html`, `frontend/js/pages/dashboard.js`, `frontend/scss/_dashboard.scss`) introduces a multi-step form pattern, particularly useful for complex data entry workflows.
*   **HTML Structure:**
    *   **Progress Indicator (`progress-indicator`):** A visual component to show the user's progress through the steps.
    *   **Form Steps (`form-step`):** Each step is a distinct `div` with a unique ID, controlled by JavaScript to show/hide.
    *   **Navigation Buttons:** "Next" and "Previous" buttons to move between steps.
*   **JavaScript Patterns:**
    *   **`currentStep` property:** Manages the active step in the form.
    *   **`showStep(stepNumber)` method:** Handles displaying the correct step and updating the progress indicator.
    *   **`nextStep()` and `prevStep()` methods:** Control the flow between steps.
    *   **Form Submission:** Final step handles the overall form submission.
*   **SCSS Patterns:**
    *   Dedicated styles for `progress-indicator`, `form-step`, and their active/completed states.

### General Reusability Guidelines for New Pages
When creating new pages or refactoring existing ones, strictly adapt the following patterns:
*   **HTML Structure:** Follow the established header, search/filter, content display, and modal patterns.
*   **JavaScript Modularity:** Always encapsulate page-specific JS logic within an ES Module class and export it as the default. Implement `init()` and `destroy()` methods for proper lifecycle management.
*   **Event Handling:** Use centralized event delegation on the main content wrapper (`#main-content`).
*   **Data Flow:** Implement `fetch` and `render` methods similar to `fetchCustomers` and `renderCustomers`.
*   **Modal Management:** Utilize the imported `AppUtils` functions for all modal interactions.
*   **Loading Indicators:** Incorporate `loading-overlay` for sections with asynchronous operations and `infinite-scroll-loading` for paginated content.
*   **Utility Imports:** Import common utility functions from `frontend/js/utils/AppUtils.js` as needed.
*   **SCSS Styling:** Create a dedicated SCSS partial (e.g., `_pagename.scss`) and import it into `main.scss`. Define styles for unique page components, adhering to the established naming conventions and variable usage.

## Backend Route Patterns

The backend routes, primarily located in `backend/src/routes/`, follow a consistent and modular pattern:

*   **Modular Routing:** Each major resource (e.g., `customers`, `products`, `credit-cards`, `installments`) has its own dedicated route file (e.g., `customers.js`, `products.js`). These individual routers are then imported and mounted in `backend/src/routes/api.js`.
*   **Express Router:** All route files utilize `express.Router()` to define their routes, promoting modularity and separation of concerns.
*   **Database Interaction:**
    *   Direct database queries are handled using `query` (or `pool.query` for transactions) from `../db/index.js`.
    *   Error handling for database operations includes `try...catch` blocks to return appropriate HTTP status codes and informative error messages.
    *   Transactions are employed for multi-step operations (e.g., creating an installment plan involves creating a product, an installment record, and multiple payment records) to ensure data consistency.
*   **RESTful API Design:**
    *   Routes generally adhere to RESTful conventions (e.g., `GET /resource`, `GET /resource/:id`, `POST /resource`, `PUT /resource/:id`, `DELETE /resource/:id`).
    *   Appropriate HTTP status codes are returned for success (200 OK, 201 Created, 204 No Content) and errors (400 Bad Request, 404 Not Found, 409 Conflict, 500 Internal Server Error).
*   **Input Validation:** Basic input validation is performed on incoming request bodies (e.g., checking for required fields) to ensure data integrity.
*   **File Uploads (Multer):**
    *   `multer` is integrated for handling `multipart/form-data` (file uploads).
    *   `multer.diskStorage` is configured to save uploaded files to `public/uploads/` for persistent storage.
    *   Helper functions are used for file-related operations (e.g., checking if a file exists).
*   **Query Parameters for Filtering/Pagination/Sorting:** `GET` endpoints often accept query parameters for searching, sorting, limiting, and offsetting results, enabling flexible data retrieval.
*   **Centralized API Entry Point (`api.js`):** The `backend/src/routes/api.js` file acts as the main entry point for all API routes, consolidating them under the `/api` prefix.
*   **Frontend Route Handling (`frontend.js`):** A dedicated `backend/src/routes/frontend.js` file handles serving the main `index.html` for various frontend routes, enabling a Single-Page Application (SPA) architecture.
