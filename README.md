# Task Management System

A full-stack task management web application designed for organizing, tracking, and managing daily tasks efficiently. Built with a modern tech stack featuring a decoupled architecture (Frontend & Backend).

---

## Tech Stack

### **Frontend**
* **Framework:** Next.js / React.js
* **Styling:** Tailwind CSS
* **Language:** TypeScript

### **Backend**
* **Runtime / Framework:** Node.js / Express.js
* **ORM:** Prisma ORM
* **Database:** PostgreSQL / MySQL
* **Authentication:** JSON Web Tokens (JWT) & Passwords Hashing
* **Language:** TypeScript / JavaScript

---

## Key Features

* **User Authentication:** Secure Sign Up, Login, and Session handling with JWT.
* **Task Board / Management:** 
  * Create, Read, Update, and Delete (CRUD) tasks.
  * Task categorization, priority levels, and status tracking (e.g., Pending, In Progress, Completed).
* **Responsive UI:** Clean, intuitive interface built with Tailwind CSS for seamless desktop and mobile experience.
* **RESTful API:** Clean API structure for managing resources and authentication.

---

## Repository Structure

```text
task-management-app/
├── backend/    # REST API server, Prisma models, and auth logic
└── frontend/   # Next.js client application and UI components

