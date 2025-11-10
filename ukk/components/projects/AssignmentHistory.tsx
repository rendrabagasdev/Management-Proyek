"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FaHistory,
  FaFilter,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
// Date formatting utility
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface AssignmentHistoryProps {
  projectId: number;
}

interface Assignment {
  id: number;
  assignedAt: string;
  unassignedAt: string | null;
  reason: string | null;
  isActive: boolean;
  duration: number | null;
  status: string;
  card: {
    id: number;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    board: {
      id: number;
      name: string;
    };
  };
  assignee: {
    id: number;
    name: string;
    email: string;
  };
  assigner: {
    id: number;
    name: string;
    email: string;
  };
  projectMember: {
    id: number;
    projectRole: string;
  };
}

interface Summary {
  total: number;
  active: number;
  completed: number;
  unassigned: number;
  averageDuration: number;
}

export default function AssignmentHistory({
  projectId,
}: AssignmentHistoryProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchAssignmentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, statusFilter, startDate, endDate]);

  const fetchAssignmentHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        if (statusFilter === "active") {
          params.append("isActive", "true");
        } else if (statusFilter === "completed") {
          params.append("isActive", "false");
        }
      }

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      const response = await fetch(
        `/api/projects/${projectId}/assignment-history?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assignment history");
      }

      const data = await response.json();
      setAssignments(data.assignments);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      console.error("Error fetching assignment history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load assignment history"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-(--theme-primary-light) text-(--theme-primary-dark)">
            <FaSpinner className="mr-1" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-(--theme-success-light) text-(--theme-success-dark)">
            <FaCheckCircle className="mr-1" />
            Completed
          </Badge>
        );
      case "unassigned":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <FaTimesCircle className="mr-1" />
            Unassigned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      HIGH: "bg-(--theme-danger-light) text-(--theme-danger-dark)",
      MEDIUM: "bg-(--theme-accent-light) text-(--theme-accent-dark)",
      LOW: "bg-(--theme-primary-light) text-(--theme-primary-dark)",
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || ""}>
        {priority}
      </Badge>
    );
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.assignee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-(--theme-primary) mx-auto mb-4" />
            <p className="text-gray-500">Loading assignment history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-(--theme-danger)">
            <p>{error}</p>
            <Button onClick={fetchAssignmentHistory} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaHistory className="text-(--theme-primary)" />
            Assignment History
          </h2>
          <p className="text-gray-500 mt-1">
            Track all card assignments and their status
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-(--theme-primary)">
                {summary.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-(--theme-success)">
                {summary.completed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Unassigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {summary.unassigned}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg. Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.averageDuration.toFixed(0)}d
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaFilter />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search card or assignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {(searchTerm || statusFilter !== "all" || startDate || endDate) && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Filters
              </Button>
              <p className="text-sm text-gray-500 flex items-center">
                Showing {filteredAssignments.length} of {assignments.length}{" "}
                assignments
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaHistory className="text-4xl mx-auto mb-4 opacity-50" />
              <p>No assignment records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.card.title}</p>
                          {assignment.reason && (
                            <p className="text-xs text-gray-500 mt-1">
                              {assignment.reason}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {assignment.card.board.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {assignment.assignee.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {assignment.projectMember.projectRole}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {assignment.assigner.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FaClock className="text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {formatDate(assignment.assignedAt)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(assignment.assignedAt)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.duration !== null ? (
                          <span className="font-medium">
                            {assignment.duration} days
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                      <TableCell>
                        {getPriorityBadge(assignment.card.priority)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
