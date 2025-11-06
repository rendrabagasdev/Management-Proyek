# 🚀 Sistem Manajemen Proyek UKK

Sistem manajemen proyek berbasis web untuk Ujian Kompetensi Keahlian (UKK) RPL dengan fitur Kanban board, time tracking, dan role-based access control.

## 📋 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **ORM:** Prisma
- **Database:** MySQL
- **Authentication:** NextAuth.js (JWT)
- **UI Components:** shadcn/ui + TailwindCSS
- **Icons:** react-icons
- **Language:** TypeScript

## ✨ Features

### 🎯 Core Features

- ✅ **Authentication** - JWT-based dengan role management (Admin, Leader, Member)
- ✅ **Project Management** - Create, edit, delete projects dengan team management
- ✅ **Kanban Board** - Drag & drop cards (To Do, In Progress, Review, Done)
- ✅ **Task Management** - Assign tasks, set priority & deadline
- ✅ **Subtasks** - Break down complex tasks
- ✅ **Time Tracking** - Start/stop timer per task dengan auto-calculation
- ✅ **Comments** - Real-time collaboration & discussion
- ✅ **Role-Based Access** - Different permissions per project role

### 👥 User Roles

#### Global Roles

- **ADMIN** - Full access ke semua project dan user management
- **LEADER** - Dapat membuat project dan manage team
- **MEMBER** - Basic user, join project sebagai Developer/Designer

#### Project Roles

- **LEADER** - Project manager, assign & approve tasks
- **DEVELOPER** - Code-related tasks
- **DESIGNER** - Design-related tasks
- **OBSERVER** - View-only access

## 📦 Installation

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm atau yarn

### Steps

1. **Clone repository**

```bash
git clone <your-repo-url>
cd ukk
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment variables**

Edit `.env` file:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/ukk_project_management"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this"
```

Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

4. **Setup database**

Create MySQL database:

```sql
CREATE DATABASE ukk_project_management;
```

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

5. **Seed database dengan sample data**

```bash
npx prisma db seed
```

6. **Start development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Test Credentials

After seeding, you can login dengan:

| Role        | Email             | Password    |
| ----------- | ----------------- | ----------- |
| Admin       | admin@ukk.com     | password123 |
| Leader 1    | leader1@ukk.com   | password123 |
| Leader 2    | leader2@ukk.com   | password123 |
| Developer 1 | dev1@ukk.com      | password123 |
| Developer 2 | dev2@ukk.com      | password123 |
| Designer 1  | designer1@ukk.com | password123 |
| Designer 2  | designer2@ukk.com | password123 |

## 📁 Project Structure

```
ukk/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # NextAuth endpoints
│   │   ├── projects/          # Project CRUD
│   │   └── cards/             # Card & time tracking
│   ├── dashboard/             # Role-based dashboards
│   ├── projects/              # Project pages
│   └── layout.tsx             # Root layout
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── cards/                 # Task card components
│   ├── forms/                 # Form components
│   └── dashboards/            # Dashboard components
├── lib/
│   ├── prisma.ts              # Prisma client
│   ├── auth.ts                # NextAuth config
│   └── utils.ts               # Utility functions
├── types/
│   ├── user.ts                # User types
│   ├── project.ts             # Project types
│   └── task.ts                # Task types
├── hooks/                     # Custom React hooks
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
└── docs/
    └── ERD.md                 # Database documentation
```

## 🗄️ Database Schema

Lihat dokumentasi lengkap di [`docs/ERD.md`](./docs/ERD.md)

### Main Tables:

- `users` - User accounts & roles
- `projects` - Project information
- `project_members` - User-project relationships with roles
- `boards` - Kanban board columns
- `cards` - Tasks/cards
- `subtasks` - Sub-tasks
- `comments` - Task discussions
- `time_logs` - Time tracking records

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout

### Projects

- `GET /api/projects` - List all projects (filtered by user)
- `POST /api/projects` - Create new project (Leader/Admin only)
- `GET /api/projects/:id` - Get project detail
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Cards

- `POST /api/cards` - Create new card
- `GET /api/cards/:id` - Get card detail
- `PATCH /api/cards/:id` - Update card (status, assignee, etc)
- `DELETE /api/cards/:id` - Delete card

### Time Tracking

- `POST /api/cards/:id/time` - Start timer
- `PATCH /api/cards/:id/time/:timeLogId` - Stop timer
- `GET /api/cards/:id/time` - Get all time logs

### Comments

- `POST /api/cards/:id/comments` - Add comment
- `GET /api/cards/:id/comments` - Get all comments

## 🎨 UI Components (shadcn/ui)

Components yang digunakan:

- `Button` - Primary actions
- `Card` - Content containers
- `Dialog` - Modals
- `Tabs` - Navigation
- `Badge` - Status indicators
- `DropdownMenu` - Context menus
- `Progress` - Progress bars
- `Input`, `Textarea` - Form inputs

## 🔐 Business Rules

1. **Task Assignment**

   - Developer/Designer max 1 `IN_PROGRESS` task
   - Task cannot be `DONE` without time log

2. **Time Tracking**

   - User can only have 1 active timer
   - Duration auto-calculated on stop

3. **Project Access**

   - Admin: Full access
   - Leader: Manage own projects
   - Member: Access only joined projects

4. **Data Integrity**
   - Cascade delete for related records
   - Unique constraint per user-project

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

```env
DATABASE_URL="mysql://user:pass@production-host:3306/db"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
```

## 📝 Development

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Linting

```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is created for educational purposes (UKK RPL).

## 👥 Team

- **Developer:** [Your Name]
- **Project:** Sistem Manajemen Proyek UKK
- **Year:** 2025

## 📞 Support

Untuk pertanyaan atau issues, silakan buat issue di repository ini atau contact developer.

---

**Made with ❤️ for UKK RPL 2025**
