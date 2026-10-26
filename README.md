# Courier App

A courier management application built with Next.js to support delivery operations, courier workflows, and order tracking.

## Features

- **Authentication** — User authentication with Clerk.
- **Role-Based Access Control** — Restricts courier pages to authorized users.
- **Order Management** — View and manage assigned delivery orders.
- **Delivery Tracking** — Support for tracking delivery progress.
- **Courier Dashboard** — Access courier information and delivery activities.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Clerk](https://clerk.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm, pnpm, yarn, or bun
- A Clerk account with the required environment keys

### Installation

Clone the repository and navigate to the project directory.

```bash
git clone <repository-url>
cd <project-directory>
```

Install dependencies:

```bash
pnpm install
```

Create a `.env.local` file in the project root and configure the required environment variables.

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

Configure any additional environment variables required by your backend API.

### Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the application for production |
| `pnpm start` | Run the production server |
| `pnpm lint` | Run linting if configured in the project |

## Authentication and Authorization

The application uses Clerk for authentication and user management.

Courier-specific pages use role-based access checks to restrict access to authorized courier accounts.

**Security note:** Frontend role checks are intended for navigation and user experience. Sensitive operations and courier permissions must also be validated by the backend API.

## Project Structure

The application follows the Next.js App Router architecture.

```text
app/
components/
lib/
public/
```

The actual directory structure may vary depending on the project implementation.

## Deployment

The application can be deployed to [Vercel](https://vercel.com/) or another platform that supports Next.js.

Before deployment:

1. Configure production environment variables.
2. Set the correct backend API URL.
3. Configure Clerk production keys and allowed domains.
4. Verify authentication and courier authorization.
5. Test the production build.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
