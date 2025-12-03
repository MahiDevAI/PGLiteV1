# ChargePay - UPI QR Payment Gateway

## Overview

ChargePay is a single-merchant UPI QR-based payment gateway system that enables secure payment collection through dynamically generated QR codes. The system generates UPI-compliant QR codes, hosts payment pages, and automatically detects payments through notification text from an Android listener application. It provides a complete dashboard for managing orders, viewing transactions, and configuring merchant settings.

The application is built as a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL (via Neon) for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for the UI layer
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query** for server state management and caching with 5-second polling intervals for real-time updates

**UI Component Strategy**
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS v4** for styling with custom theme variables
- **New York** style variant with neutral base color
- Custom fonts: Inter for UI elements, Manrope for numbers and headings
- Replit-specific plugins for development (runtime error overlay, cartographer, dev banner)

**Key Pages & Routes**
- `/` - Dashboard with revenue metrics and charts
- `/orders` - Order management and creation
- `/pay/:id` - Public payment page with QR code display
- `/transactions` - Transaction history
- `/unmapped` - Unmapped payment notifications
- `/settings` - System configuration

**State Management Approach**
- Server state cached via TanStack Query with automatic refetching
- Forms managed with React Hook Form and Zod validation
- Toast notifications for user feedback
- No global client state management (relies on server-driven state)

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- Custom middleware for logging, authorization, and request validation
- Separate development and production modes with conditional Vite integration

**API Design Pattern**
- RESTful API endpoints under `/api` prefix
- Authorization via Bearer token (static API key) or domain whitelisting
- Separate listener authorization for Android notification app
- Request/response logging middleware for debugging

**Core Business Logic Modules**

1. **Order Management**
   - Generates unique 10-digit order IDs
   - Creates UPI-compliant payment strings (upi://pay?...)
   - Generates QR codes server-side using the `qrcode` library
   - Tracks order lifecycle: PENDING → COMPLETED or EXPIRED
   - Automatic expiration after 2 minutes of inactivity

2. **Payment Detection**
   - Receives notifications from Android listener app via POST endpoint
   - Parses notification text to extract order ID and payer information
   - Maps payments to orders using embedded 10-digit order ID
   - Creates unmapped notification records when order ID not found
   - Supports late payment detection (payments after order expiration)

3. **Settings & Configuration**
   - Stores merchant UPI ID and display name
   - Manages static API key and listener token
   - Domain whitelist for CORS-like API access control
   - Token regeneration endpoints for security rotation

**Storage Layer Design**
- Abstracted storage interface (`IStorage`) in `server/storage.ts`
- All database operations encapsulated in storage module
- Supports atomic operations for order status updates
- Background job for expiring stale orders

### Data Storage

**Database Technology**
- **PostgreSQL** via Neon serverless driver
- **Drizzle ORM** for type-safe database queries
- WebSocket-based connection pooling for serverless environments
- Schema-first approach with migration support

**Database Schema**

1. **orders** table
   - Primary key: serial `id`
   - Unique `orderId` (10-digit string)
   - Amount in paise/smallest currency unit
   - Customer details (name, mobile) - optional
   - `receiverUpiId` for merchant
   - Status tracking (PENDING/COMPLETED/EXPIRED)
   - QR code path and page URL
   - JSONB metadata field for extensibility
   - Timestamps: created, pending, completed, expired

2. **transactions** table
   - Links to order via `orderId`
   - Stores payer name from notification
   - Full notification JSON for audit trail
   - `isLatePayment` flag for payments after expiration
   - Creation timestamp

3. **unmappedNotifications** table
   - Stores notifications that couldn't be matched
   - Full notification JSON
   - Creation timestamp for debugging

4. **settings** table
   - Single-row configuration table
   - API credentials (static key, listener token)
   - Merchant details (UPI ID, name)
   - Array of allowed domains
   - Timestamps for tracking changes

**Data Validation Strategy**
- Zod schemas derived from Drizzle table definitions using `drizzle-zod`
- Runtime validation on API requests
- Type safety enforced throughout request/response cycle

### Authentication & Authorization

**Security Model**
- No user authentication (single-merchant system)
- API access controlled via:
  1. Bearer token authentication (static API key in settings)
  2. Origin-based whitelisting (allowed domains list)
  3. Internal requests allowed when no auth headers present
- Separate listener token for Android notification app
- Token regeneration endpoints for credential rotation

**CORS Strategy**
- Manual origin checking against whitelist
- No traditional CORS middleware
- Internal dashboard requests bypass authorization

### External Dependencies

**Third-Party Services**
- **Neon Database** - Serverless PostgreSQL hosting
- **UPI Protocol** - Standard Indian payment protocol (no external service, just string formatting)

**Third-Party Libraries**
- **@neondatabase/serverless** - Database driver with WebSocket support
- **drizzle-orm** - Type-safe ORM
- **qrcode** - Server-side QR code generation
- **zod** - Runtime schema validation
- **express** - Web server framework
- **react** - UI framework
- **@tanstack/react-query** - Server state management
- **wouter** - Lightweight routing
- **recharts** - Charts for dashboard
- **shadcn/ui + Radix UI** - Component primitives

**Build & Development Tools**
- **Vite** - Frontend build tool
- **esbuild** - Backend bundling for production
- **TypeScript** - Type safety across the stack
- **Tailwind CSS** - Utility-first styling
- **Replit plugins** - Development experience enhancements

**Android Listener Integration**
- External Android application (not part of this codebase)
- Monitors UPI payment notifications on user's device
- Posts notification data to `/api/notifications` endpoint
- Authenticates using listener token from settings

**Assets & Images**
- Generated images stored in `attached_assets/generated_images/`
- Logo and background images for branding
- OpenGraph image support via custom Vite plugin
- Automatic meta tag updates for social sharing