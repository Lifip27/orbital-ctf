# 🚀 PwnCTF Platform

<div align="center">

![GitHub License](https://img.shields.io/github/license/asynchronous-x/pwnctf)
[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-000000?logo=next.js&logoWidth=20)](https://nextjs.org)
[![Powered by Prisma](https://img.shields.io/badge/Powered%20by-Prisma-2D3748?logo=prisma&logoWidth=20)](https://www.prisma.io)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?logo=tailwind-css&logoWidth=20)](https://tailwindcss.com)

<img src="https://raw.githubusercontent.com/asynchronous-x/pwnctf/refs/heads/main/src/app/favicon.ico" alt="PwnCTF Logo" width="200"/>

A retro space-themed Capture The Flag platform built with modern tech stack that actually Just Works™️ 

Experience a CTF in a sleek, dark-themed environment with real-time scoring and team collaboration.

[Static Demo Site](https://asynchronous-x.github.io/pwnctf/) · [Report Bug](https://github.com/asynchronous-x/pwnctf/issues) · [Request Feature](https://github.com/asynchronous-x/pwnctf/issues)

[![Watch the demo](./pwnctf-promo.gif)](https://x.com/i/status/1922884608200188109)

</div>


## ✨ Features

- 🔐 **User Authentication** - Individual and team registration system
- 🎯 **Challenge Management** - Create, edit, import/export and manage CTF challenges
- 📊 **Real-time Scoring** - Live leaderboard updates
- 🌙 **Retro UI Theme** - Space-inspired design with stunning visuals for both the categories and challenge selection screens
- 📱 **Responsive Design** - Works on both desktop and mobile
- 🚀 **Modern Stack** - Built with Next.js 15, Prisma, and Tailwind CSS
- 🏁 **Multi-Flag Challenges** - Supports problems with multiple flags for partial credit
- 📈 **Scoreboard History** - Visualize team progress with a dynamic chart
- 🔓 **Unlock Conditions** - Time-based and prerequisite challenge gates

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20.x or later
- npm or yarn
- SQLite (included with Prisma)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/asynchronous-x/pwnctf.git
   cd pwnctf
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create a `.env` file**
   ```bash
   cp .env.example .env
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate reset
   ```

5. **Seed initial challenges**
   ```bash
   npm run prisma:seed
   # or
   yarn prisma:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to launch the platform.

## 📁 Project Structure

```
pwnctf/
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # React components
│   ├── lib/            # Server-side helpers
│   ├── utils/          # Client-side utilities
│   ├── types/          # Shared TypeScript types
│   ├── middleware.ts   # Next.js middleware
│   └── instrumentation.ts # Startup tasks (challenge import)
├── prisma/
│   ├── schema.prisma # Database schema
│   └── migrations/   # Database migrations
└── public/           # Static assets
    └── uploads/      # Challenge file uploads
```

## 💾 Database Schema

The platform is built on these core models:

| Model | Description |
|-------|-------------|
| `User` | User accounts with authentication and team membership |
| `Team` | Team information, scoring, and member management |
| `Challenge` | CTF challenges with points and locking rules |
| `UnlockCondition` | Challenge unlock requirements |
| `ChallengeFlag` | Supports multi-flag scoring |
| `Submission` | Challenge submission tracking and validation |
| `Announcement` | Platform-wide announcements |
| `ActivityLog` | Team activity tracking |
| `GameConfig` | CTF game timing and state configuration |
| `ChallengeFile` | Challenge attachment management |
| `Hint` | Challenge hints with point costs |
| `TeamHint` | Tracks which teams have purchased hints |
| `SiteConfig` | Platform configuration settings |
| `Score` | Detailed scoring history for teams and users |
| `TeamPointHistory` | Chronological log of team score changes |

## 🔧 Configuration

The platform can be configured through environment variables:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
INGEST_CHALLENGES_AT_STARTUP=true
CHALLENGES_DIR="./challenges"
```

Set `INGEST_CHALLENGES_AT_STARTUP` to `true` if you want challenges in `CHALLENGES_DIR` automatically imported when the server starts.

## 📝 License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- [Next.js](https://nextjs.org)
- [Prisma](https://www.prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [NextAuth.js](https://next-auth.js.org)

---

<div align="center">

Made with 💯 by [Asynchronous-X](https://github.com/asynchronous-x)

</div>
