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
        return "bg-gray-100 text-gray-800";
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl text-(--theme-danger)">
              {stats.admins}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Leaders</CardDescription>
            <CardTitle className="text-3xl text-(--theme-secondary)">
              {stats.leaders}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-3xl text-(--theme-primary)">
              {stats.members}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage user roles and view their activity
              </CardDescription>
            </div>
            <Button onClick={() => setAddUserOpen(true)} disabled={loading}>
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          <Badge className={getRoleColor(user.globalRole)}>
                            {user.globalRole}
                          </Badge>
                          {isLeadingProject && (
                            <Badge variant="outline" className="text-xs">
                              Leading: {leadingProject?.project.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* User Activity Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 ml-13">
                      <div className="flex items-center gap-1">
                        <FaProjectDiagram className="w-3 h-3" />
                        <span>
                          {user.createdProjects.length} projects created
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <FaUser className="w-3 h-3" />
                        <span>
                          Member in {user.projectMembers.length} projects
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <FaTasks className="w-3 h-3" />
                        <span>{user.createdCards.length} tasks created</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <FaComments className="w-3 h-3" />
                        <span>{user.comments.length} comments</span>
                      </div>
                    </div>

                    {/* Projects List */}
                    {user.projectMembers.length > 0 && (
                      <div className="mt-2 ml-13">
                        <p className="text-xs text-gray-500 mb-1">Projects:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.projectMembers.map((pm) => (
                            <Badge
                              key={pm.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {pm.project.name} ({pm.projectRole})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
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
                    >
                      <FaEdit className="mr-2" />
                      Change Role
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
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
    </div>
  );
}
