# Project Approval Migration Guide

This guide explains the changes made to implement project approval functionality.

## Database Schema Changes

Added two new fields to the `Project` model in `prisma/schema.prisma`:

- `approvedAt`: DateTime - When the project was approved
- `approvedBy`: String - Who approved the project (admin name)

## Migration Steps

1. **Update Prisma Schema**
   - Already done in `prisma/schema.prisma`

2. **Run Database Migration**
   ```bash
   # Create migration
   npx prisma migrate dev --name add_project_approval_fields
   
   # Or for production
   npx prisma migrate deploy
   ```

3. **API Endpoints Created**

   - `GET /api/projects/approval-status` - Fetch pending and approved projects
   - `PATCH /api/projects/:id/approve` - Approve a completed project
   - `PATCH /api/projects/:id/reject` - Reject and reopen a project

4. **Components Updated**

   - `components/projects/ProjectApprovel.tsx` - Main approval component (refactored with proper TypeScript types)
   - `app/projects/completed/page.tsx` - Page for viewing and managing project approvals

5. **Type Definitions**

   - Added `ProjectWithStats` interface to `types/project.ts`
   - Extended `Project` interface with approval fields

## Usage

The approval component is accessible at `/projects/completed` and only available to admins.

### Features:
- View pending projects awaiting approval
- View approved projects
- See project statistics (team size, tasks, deadlines)
- Approve projects with optional notes
- Reject projects with required notes (re-opens the project)
- Real-time UI updates

## API Response Format

### GET /api/projects/approval-status

```json
{
  "pending": [
    {
      "id": 1,
      "name": "Project Name",
      "description": "...",
      "status": "ACTIVE",
      "deadline": "2024-12-31T00:00:00.000Z",
      "completedAt": "2024-12-15T00:00:00.000Z",
      "totalTasks": 10,
      "completedTasks": 10,
      "creator": { "id": 1, "name": "John", "email": "john@example.com" },
      "members": []
    }
  ],
  "approved": [
    {
      "id": 2,
      "name": "Project Name 2",
      "status": "COMPLETED",
      "approvedAt": "2024-12-20T00:00:00.000Z",
      "approvedBy": "Admin Name",
      "totalTasks": 8,
      "completedTasks": 8
    }
  ]
}
```

## Notes

- Only users with `ADMIN` role can access the approval endpoints and page
- Rejecting a project reopens it and sets `isCompleted` to false
- The component uses React hooks for state management
- Error handling is included for failed API calls
- Loading states are shown during async operations
