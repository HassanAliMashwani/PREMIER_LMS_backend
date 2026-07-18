# Premier LMS - Project Details

This document provides a comprehensive overview of the Premier Learning Management System (LMS) architecture, outlining every detail of the frontend and backend folders.

## System Architecture Overview

**Premier LMS** is a modern, full-stack Learning Management System tailored for educational institutes. It provides courses, live Zoom-integrated classrooms, batch management, student enrollments, secure class recordings, and robust administrative dashboards.

- **Frontend**: Next.js (React), Tailwind CSS, Zoom Meeting SDK, Socket.io-client.
- **Backend**: NestJS, Prisma (ORM), PostgreSQL, Socket.io (WebSockets), Cloudinary.
- **Integrations**: Zoom API, Cloudinary, NodeMailer.

---

## 1. Backend (`PREMIER_LMs_backend_`)

The backend is built with **NestJS**, a progressive Node.js framework, using TypeScript. It provides a robust, scalable REST API and WebSocket gateway for the frontend.

### Tech Stack & Dependencies
- **Framework**: NestJS (v11)
- **Database ORM**: Prisma (v6) with PostgreSQL
- **Real-Time Communication**: Socket.io (v4) via `@nestjs/websockets`
- **Authentication**: JWT & Passport (`@nestjs/jwt`, `passport-jwt`)
- **Security**: Helmet, bcrypt, class-validator
- **Integrations**: Zoom REST APIs, Cloudinary, Nodemailer for Emails

### Folder Structure (`src/`)
The `src/` directory uses a modular monolithic architecture, grouping related features into cohesive modules.

#### Core Configuration (`src/`)
- `main.ts` - The entry point of the NestJS application. Bootstraps the server, sets up global validation pipes, CORS, and Socket.io adapters.
- `app.module.ts` - The root module that imports all feature modules, Prisma, and global configurations (like ConfigModule).
- `app-setup.ts` - Global configuration setups for the application.

#### Modules (`src/modules/`)
Each module typically contains a `Controller` (for REST routes), a `Service` (business logic), a `Module` (dependency injection), and Data Transfer Objects (DTOs).

1. **`auth/`**: Handles user authentication, login, registration, JWT token generation, and single-session validation.
2. **`user/`**: Manages user profiles (students, teachers, admins), role-based access, and account settings.
3. **`course/`**: Manages the catalog of courses, curriculum, modules, and course metadata.
4. **`batch/`**: Groups students into batches. Courses are taught to specific batches. Manages batch schedules and assignments.
5. **`class/`**: The largest and most complex module.
   - `class.controller.ts` & `class.service.ts`: Manages live class scheduling.
   - `live-class.gateway.ts`: Socket.io gateway handling real-time features during a live class (attendance, requesting to speak, remote muting/kicking).
   - `zoom.service.ts`: Integrates with Zoom API to schedule meetings, generate Signature JWTs for the embedded SDK, and handle Zoom OAuth.
   - `recording.service.ts`: Listens to Zoom webhooks (`recording.completed`), manages recording states, falls back to host control when programmatic API fails, and generates secure playback signed URLs.
   - `attendance.service.ts`: Automates student attendance lifecycle (tracking join, leave, buffer handling, and total duration).
6. **`enrollment/`**: Handles student enrollments into specific batches and courses.
7. **`admission/`**: Manages the pipeline of prospective students applying for the institute.
8. **`upload/`**: Secure asset uploading service (Cloudinary integration) for user avatars, course thumbnails, etc.
9. **`mail/`**: Service wrapping Nodemailer to send transactional emails (welcome emails, password resets, class invites).

#### Common Utilities (`src/common/`)
- **Decorators**: Custom decorators like `@CurrentUser()` to extract user details from JWT payloads, and `@Roles()` for RBAC.
- **Guards**: `JwtAuthGuard`, `RolesGuard` (Role-Based Access Control), and `SingleSessionGuard` (prevents a single account from being logged into multiple devices simultaneously).

#### Prisma Database (`src/prisma/`)
- `schema.prisma`: The single source of truth for the database schema. Contains models like `User`, `Course`, `Batch`, `Class`, `LiveSession`, `Attendance`, `DeviceSession`, `AuditLog`, `RecordedLecture`, etc.
- `prisma.service.ts`: Instantiates the Prisma Client and manages database connection lifecycles.

---

## 2. Frontend (`premier_LMS_Frontend`)

The frontend is built with **Next.js 14**, utilizing the App Router (`app/`) architecture. It is fully responsive, styling is handled by Tailwind CSS, and it uses modern React features.

### Tech Stack & Dependencies
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Autoprefixer
- **Live Classroom Component**: Zoom Meeting SDK (`@zoom/meetingsdk/embedded`)
- **Real-Time Engine**: `socket.io-client`
- **HTTP Client**: Axios
- **State Management**: React Hooks (useState, useEffect, useRef) & Context APIs.

### Folder Structure

#### App Directory (`app/`)
The `app` directory uses Next.js file-based routing. Each folder represents a route, containing `page.tsx` (UI) and `layout.tsx` (wrapping layout).

1. **`admin/`**: Admin portal.
   - `/admin/dashboard`: High-level statistics.
   - `/admin/courses` & `/admin/batches`: CRUD operations for curriculum and cohorts.
   - `/admin/classes`: Scheduling live classes and viewing class audit logs.
   - `/admin/users`: Managing students and teachers.
2. **`dashboard/`**: Student portal.
   - `/dashboard`: Main landing page for enrolled students displaying their upcoming classes and active courses.
   - `/dashboard/courses`: Student's enrolled courses.
   - `/dashboard/classes/[id]`: The **Live Classroom** interface. Uses the Zoom Embedded SDK alongside a custom Next.js UI overlay for waiting rooms and host controls.
   - `/dashboard/recordings/player`: Custom secure video player for recorded lectures. Features right-click locking, dynamic watermarks (anti-piracy), and playback progress tracking.
3. **`auth/`**: Authentication pages (`/auth/login`, `/auth/register`).
4. **`admission/` & `checkout/`**: Public-facing student application and enrollment payment flows.
5. **`courses/`**: Public course catalog.
6. **`globals.css`**: Tailwind directives and global CSS resets.

#### Components Directory (`components/`)
Reusable UI pieces abstracted away from the route pages.
1. **`zoom/`**:
   - `ZoomPlayer.tsx`: Wraps the Zoom Meeting SDK. Because the SDK requires `window`, it dynamically imports the SDK on the client side. Manages anti-piracy watermarks, right-click blocks, and connects to the backend Socket.io server to synchronize permissions (mute, video lock).
2. **`layout/`**:
   - `Sidebar.tsx`, `Header.tsx`: Navigation components for the Admin and Student dashboards.
3. **`ui/`**:
   - Shared atomic components like buttons, modals, alerts, loaders, and form inputs.
4. **`courses/`**:
   - Course cards and detail view components.

#### Root Configuration
- `tailwind.config.ts`: Defines the project's color palette, typography, and custom animations (like pulsing recording indicators).
- `next.config.js`: Next.js configuration, including remote image domain definitions.
- `middleware.ts` (if applicable): Next.js middleware for route protection.

---

## 3. Key Full-Stack Workflows

### The Live Classroom & Recording Lifecycle
1. **Creation**: Admin creates a class. Backend integrates with Zoom API to schedule it and store the `zoomMeetingId`.
2. **Join**: Student clicks "Join". Frontend requests `/api/classes/:id/join`. Backend generates an encrypted Zoom Signature (JWT).
3. **In-Class**: Frontend dynamically loads `ZoomPlayer`. Connects to Socket.io.
   - The instructor's frontend features a "Host Panel".
   - Instructor clicks "Start Recording". Frontend emits `control-recording`.
   - Backend calls Zoom REST API to start recording. If OAuth limits prevent this, backend emits a `fallback` event, prompting the instructor to click the native SDK Record button.
4. **Completion**: Class ends. Zoom triggers a webhook to `POST /api/classes/zoom-webhook`.
5. **Processing**: Backend downloads the `.mp4` from Zoom, uploads it to the secure Cloudinary bucket, logs `RecordedLecture` to the database, and links it to the class.
6. **Playback**: Students view the secure recording via the `/dashboard/recordings/player` route, which streams the encrypted video while periodically saving their playback progress to the DB.
