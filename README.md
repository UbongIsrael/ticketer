# 🎟️ Ticketer

Ticketer is a production-grade, end-to-end event ticketing platform tailored for the Nigerian market. It provides a robust, secure, and premium experience for both event hosts and ticket buyers, competing with top-tier local and international solutions.

## 🚀 Overview

The platform is designed to handle the entire event lifecycle:
- **For Hosts**: Event creation, multiple ticket tiers, real-time analytics, gate scanning via PWA, and automated settlements.
- **For Buyers**: Secure ticket purchase via Paystack, instant QR delivery, and a seamless buy-back/refund system.

---

## ✨ Key Features

- **🔐 High-Security Ticketing**: Every ticket features a unique QR code signed via HMAC-SHA256 to prevent tampering and duplication.
- **💳 Payment Integration**: Fully integrated with **Paystack** for payments, webhooks, and automated host payouts.
- **⏳ Atomic Inventory**: Real-time ticket reservation system using **Redis** to prevent overbooking during high-traffic sales.
- **⚙️ Robust State Machine**: A comprehensive 11-state ticket lifecycle ensuring data integrity from reservation to validation.
- **📱 PWA Scanner**: A dedicated gate operator interface for offline/online ticket validation.
- **🔒 Identity & Auth**: Secure OTP-based login (Termii/WhatsApp/SMS) and Google/Apple OAuth integration.
- **🛡️ Host Guardrails**: Intelligent protection against last-minute event changes to safeguard ticket holders.

---

## 🛠️ Technology Stack

### Backend (`ticketer-api`)
- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Caching & Queues**: [Redis](https://redis.io/) & [BullMQ](https://docs.bullmq.io/)
- **Auth**: JWT (RS256) & Passport.js
- **Validation**: class-validator & class-transformer

### Frontend (`ticketer-web`)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) ("Vantablack Velocity" Theme)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Services
- **Payments**: Paystack
- **Identity/KYC**: Smile Identity
- **Notifications**: Termii (WhatsApp/SMS), Resend (Transactional Email)
- **Weather**: OpenWeatherMap

---

## 📁 Project Structure

```text
Ticketer/
├── ticketer-api/         # NestJS Backend API
│   ├── src/
│   │   ├── modules/      # Auth, Events, Tickets, Payments, etc.
│   │   └── common/       # Utils (QR, Pricing, Ticket Codes)
├── ticketer-web/         # Next.js Frontend
│   ├── src/
│   │   ├── app/          # App Router Pages (Public, Dashboard, Admin)
│   │   ├── components/   # Design System Components
│   │   └── store/        # Zustand State Stores
└── .gitignore            # Root-level git management
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL
- Redis

### Backend Setup
1. Navigate to `ticketer-api`.
2. Install dependencies: `npm install`.
3. Configure `.env` (use `.env.example` as template).
4. Run migrations: `npm run migration:run`.
5. Start in dev: `npm run start:dev`.

### Frontend Setup
1. Navigate to `ticketer-web`.
2. Install dependencies: `npm install`.
3. Configure `.env.local`.
4. Start in dev: `npm run dev`.

---

## 📊 Development Progress

The project was built using a structured Tier-based approach:
- **Tier 1**: Foundation, Database & Scaffolding.
- **Tier 2**: Auth, Identity & KYC.
- **Tier 3**: Core Ticketing Engine & State Machines.
- **Tier 4**: Operations, Refunds, Settlements & Scanning.
- **Tier 5**: Premium Frontend & Third-Party Integration.

---

## 🛡️ License

Private Project. Developed for the Ticketer Platform.
