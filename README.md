# Next.js Scalable Project 🚀

This is a Next.js project built with TypeScript, Tailwind CSS v4, and Bun. It features a scalable folder structure designed for maintainability and collaboration.

## 🛠 Tech Stack

- **Runtime & Manager:** Bun (Strictly required)
- **Framework:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS v4 (CSS-first configuration)
- **Networking:** Axios (Centralized instance)
- **Language:** TypeScript

## 🚀 Getting Started

**Prerequisite:** Make sure you have Bun installed (v1.2+ recommended).

### 1. Install Dependencies

We use bun to manage dependencies. Do not use npm or yarn to avoid lockfile conflicts.

```bash
bun install
```

### 2. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

We use the `src/` directory strategy with a Feature-Driven approach.

```
src/
├── app/                  # App Router (Pages & Layouts)
│   ├── (auth)/           # Route Groups (Login/Register)
│   ├── globals.css       # Global Styles & Tailwind Imports
│   └── layout.tsx        # Root Layout
│
├── components/           # UI Components
│   ├── ui/               # Reusable "dumb" components (Buttons, Inputs)
│   ├── shared/           # Layout components (Navbar, Sidebar)
│   └── features/         # Business-logic components (LoginForm, DashboardChart)
│
├── lib/                  # Configurations & Utils
│   ├── axios.ts          # Centralized Axios Instance (Interceptors included)
│   └── utils.ts          # Utility functions (Tailwind 'cn' helper)
│
├── services/             # API Calls (Separated from UI)
│   ├── auth.service.ts
│   └── user.service.ts
│
└── types/                # TypeScript Definitions
```

## 💡 Key Conventions

### 1. Networking (Axios)

Do not use axios directly in components. Use the pre-defined services in `src/services/`.

The global axios instance in `src/lib/axios.ts` automatically handles:
- Base URL configuration
- Authorization Headers (Bearer Token)
- Global Error Handling

### 2. Styling (Tailwind v4)

We use Tailwind CSS v4. No `tailwind.config.ts` is needed for standard use; configuration is handled in `src/app/globals.css` via `@theme`.

Use the `cn()` utility for conditional classes:

```typescript
import { cn } from "@/lib/utils";

// Example: Apply green background only if active
<div className={cn("bg-red-500", isActive && "bg-green-500")} />
```

## 📦 Build for Production

To build the application for production usage:

```bash
bun run build
bun start
```

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
