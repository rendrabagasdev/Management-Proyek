"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FaUser,
  FaEdit,
  FaProjectDiagram,
  FaTasks,
  FaComments,
  FaSearch,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

interface ProjectMember {
  id: number;
  projectRole: string;
  project: {
    id: number;
    name: string;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  globalRole: string;
  createdAt: Date;
  projectMembers: ProjectMember[];
  createdProjects: Array<{ id: number; name: string }>;
  createdCards: Array<{ id: number }>;
  comments: Array<{ id: number }>;
}

interface UserManagementProps {
  users: User[];
}

export default function UserManagement({ users }: UserManagementProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Edit user dialog
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<
    "ADMIN" | "LEADER" | "MEMBER"
  >("MEMBER");

  // Edit user info dialog
  const [editingUserInfo, setEditingUserInfo] = useState<User | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");

  // Delete user dialog
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Add user dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    globalRole: "MEMBER" as "ADMIN" | "LEADER" | "MEMBER",
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-(--theme-danger-light) text-(--theme-danger-dark)";
      case "LEADER":
        return "bg-(--theme-secondary-light) text-(--theme-secondary-dark)";
      case "MEMBER":
        return "bg-(--theme-primary-light) text-(--theme-primary-dark)";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleEditRole = async () => {
    if (!editingUser) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/users/${editingUser.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          globalRole: selectedRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user role");
      }

      setSuccess(`${editingUser.name}'s role updated successfully`);
      setEditingUser(null);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user role"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUserInfo) return;

    setLoading(true);
    setError("");
    setSuccess("");

    // Validate inputs
    if (!editedName || !editedEmail) {
      setError("Name and email are required");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail)) {
      setError("Invalid email format");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${editingUserInfo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedName,
          email: editedEmail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      setSuccess(`User ${editedName} updated successfully`);
      setEditingUserInfo(null);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      setSuccess(`User ${deletingUser.name} deleted successfully`);
      setDeletingUser(null);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate inputs
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError("Invalid email format");
      setLoading(false);
      return;
    }

    // Validate password length
    if (newUser.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create user");
      }

      setSuccess(`User ${newUser.name} created successfully`);
      setAddUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        globalRole: "MEMBER",
      });
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.globalRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.globalRole === "ADMIN").length,
    leaders: users.filter((u) => u.globalRole === "LEADER").length,
    members: users.filter((u) => u.globalRole === "MEMBER").length,
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-(--theme-danger-light) border border-(--theme-danger-light) text-(--theme-danger-dark) px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-(--theme-success-light) border border-(--theme-success-light) text-(--theme-success-dark) px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">
              Total Users
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl">
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">
              Admins
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-(--theme-danger)">
              {stats.admins}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">
              Leaders
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-(--theme-secondary)">
              {stats.leaders}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="text-xs sm:text-sm">
              Members
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl text-(--theme-primary)">
              {stats.members}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-xl sm:text-2xl">All Users</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage user roles and view their activity
              </CardDescription>
            </div>
            <Button
              onClick={() => setAddUserOpen(true)}
              disabled={loading}
              size="sm"
              className="w-full sm:w-auto"
            >
              <FaPlus className="mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const isLeadingProject = user.projectMembers.some(
                (pm) => pm.projectRole === "LEADER"
              );
              const leadingProject = user.projectMembers.find(
                (pm) => pm.projectRole === "LEADER"
              );

              return (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {user.name}
                          </h3>
                          <Badge
                            className={`${getRoleColor(
                              user.globalRole
                            )} text-xs`}
                          >
                            {user.globalRole}
                          </Badge>
                          {isLeadingProject && (
                            <Badge
                              variant="outline"
                              className="text-[10px] sm:text-xs truncate max-w-[150px]"
                            >
                              Leading: {leadingProject?.project.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* User Activity Stats */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-foreground/70 ml-0 sm:ml-13">
                      <div className="flex items-center gap-1">
                        <FaProjectDiagram className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">
                          {user.createdProjects.length} projects
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center gap-1">
                        <FaUser className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">
                          In {user.projectMembers.length}
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center gap-1">
                        <FaTasks className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">
                          {user.createdCards.length} tasks
                        </span>
                      </div>
                      <span className="hidden md:inline">•</span>
                      <div className="flex items-center gap-1">
                        <FaComments className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">
                          {user.comments.length} comments
                        </span>
                      </div>
                    </div>

                    {/* Projects List */}
                    {user.projectMembers.length > 0 && (
                      <div className="mt-2 ml-0 sm:ml-13">
                        <p className="text-xs text-muted-foreground mb-1">
                          Projects:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {user.projectMembers.slice(0, 3).map((pm) => (
                            <Badge
                              key={pm.id}
                              variant="outline"
                              className="text-[10px] sm:text-xs"
                            >
                              {pm.project.name} ({pm.projectRole})
                            </Badge>
                          ))}
                          {user.projectMembers.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] sm:text-xs"
                            >
                              +{user.projectMembers.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUserInfo(user);
                        setEditedName(user.name);
                        setEditedEmail(user.email);
                      }}
                      disabled={loading}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <FaEdit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Edit User</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(user);
                        setSelectedRole(
                          user.globalRole as "ADMIN" | "LEADER" | "MEMBER"
                        );
                      }}
                      disabled={loading}
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Change Role</span>
                      <span className="sm:hidden">Role</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingUser(user)}
                      disabled={loading}
                      className="text-xs sm:text-sm"
                    >
                      <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the global role for {editingUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Role</label>
              <div>
                <Badge className={getRoleColor(editingUser?.globalRole || "")}>
                  {editingUser?.globalRole}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Role</label>
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(
                    e.target.value as "ADMIN" | "LEADER" | "MEMBER"
                  )
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="ADMIN">Admin</option>
                <option value="LEADER">Leader</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>

            {/* Role Descriptions */}
            <div className="bg-(--theme-primary-light)/10 border border-(--theme-primary-light) p-3 rounded text-sm">
              <p className="font-semibold mb-2">Role Permissions:</p>
              <ul className="space-y-1 text-xs">
                {selectedRole === "ADMIN" && (
                  <>
                    <li>• Full system access</li>
                    <li>• Manage all projects and users</li>
                    <li>• Delete any project or content</li>
                  </>
                )}
                {selectedRole === "LEADER" && (
                  <>
                    <li>• Can create projects</li>
                    <li>• Can be assigned as project LEADER</li>
                    <li>• Manage project settings (when assigned as leader)</li>
                  </>
                )}
                {selectedRole === "MEMBER" && (
                  <>
                    <li>• Cannot create projects</li>
                    <li>• Cannot be assigned as project LEADER</li>
                    <li>• Can work on tasks in assigned projects</li>
                  </>
                )}
              </ul>
            </div>

            {/* Warning if changing from LEADER to MEMBER and user is currently leading */}
            {editingUser?.globalRole === "LEADER" &&
              selectedRole === "MEMBER" &&
              editingUser.projectMembers.some(
                (pm) => pm.projectRole === "LEADER"
              ) && (
                <div className="bg-(--theme-warning-light)/10 border border-(--theme-warning-light) text-(--theme-warning-dark) px-3 py-2 rounded text-sm">
                  ⚠️ Warning: This user is currently leading a project. Changing
                  to MEMBER will prevent them from being a project leader.
                </div>
              )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditRole}
              disabled={loading || selectedRole === editingUser?.globalRole}
            >
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={newUser.globalRole}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    globalRole: e.target.value as "ADMIN" | "LEADER" | "MEMBER",
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="MEMBER">Member</option>
                <option value="LEADER">Leader</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Role Info */}
            <div className="bg-(--theme-primary-light)pacity-10 border border-(--theme-primary-light) p-3 rounded text-sm">
              <p className="font-semibold mb-2">
                {newUser.globalRole} Permissions:
              </p>
              <ul className="space-y-1 text-xs">
                {newUser.globalRole === "ADMIN" && (
                  <>
                    <li>• Full system access</li>
                    <li>• Manage all projects and users</li>
                    <li>• Delete any project or content</li>
                  </>
                )}
                {newUser.globalRole === "LEADER" && (
                  <>
                    <li>• Can create projects</li>
                    <li>• Can be assigned as project LEADER</li>
                    <li>• Manage project settings (when assigned as leader)</li>
                  </>
                )}
                {newUser.globalRole === "MEMBER" && (
                  <>
                    <li>• Cannot create projects</li>
                    <li>• Cannot be assigned as project LEADER</li>
                    <li>• Can work on tasks in assigned projects</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddUserOpen(false);
                setNewUser({
                  name: "",
                  email: "",
                  password: "",
                  globalRole: "MEMBER",
                });
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Info Dialog */}
      <Dialog
        open={editingUserInfo !== null}
        onOpenChange={(open) => !open && setEditingUserInfo(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Information</DialogTitle>
            <DialogDescription>
              Update name and email for {editingUserInfo?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="john@example.com"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="bg-(--theme-primary-light)/10 border border-(--theme-primary-light) p-3 rounded text-sm">
              <p className="text-xs text-muted-foreground">
                💡 To change the user&apos;s password, the user should use the
                &quot;Forgot Password&quot; feature or contact an administrator.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUserInfo(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={
                loading ||
                (editedName === editingUserInfo?.name &&
                  editedEmail === editingUserInfo?.email)
              }
            >
              {loading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={deletingUser !== null}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this
              user?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {deletingUser?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{deletingUser?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {deletingUser?.email}
                  </p>
                </div>
              </div>
              <Badge className={getRoleColor(deletingUser?.globalRole || "")}>
                {deletingUser?.globalRole}
              </Badge>
            </div>

            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                ⚠️ Warning: This will also delete:
              </p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 ml-4">
                <li>
                  • {deletingUser?.createdProjects.length || 0} projects created
                  by this user
                </li>
                <li>
                  • {deletingUser?.createdCards.length || 0} tasks created by
                  this user
                </li>
                <li>
                  • {deletingUser?.comments.length || 0} comments by this user
                </li>
                <li>• All time logs and activity history</li>
                <li>
                  • Project memberships (
                  {deletingUser?.projectMembers.length || 0} projects)
                </li>
              </ul>
            </div>

            {deletingUser?.projectMembers.some(
              (pm) => pm.projectRole === "LEADER"
            ) && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  🔔 Note: This user is currently leading a project!
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
