"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FaTrophy,
  FaMedal,
  FaFire,
  FaCheckCircle,
  FaClock,
  FaComment,
  FaSpinner,
  FaAward,
  FaChartLine,
} from "react-icons/fa";
import { formatDuration } from "@/lib/utils";

interface TopPerformersProps {
  projectId: number;
}

interface Performer {
  user: {
    id: number;
    name: string;
    email: string;
  };
  cardsAssigned: number;
  cardsCompleted: number;
  cardsInProgress: number;
  totalTimeMinutes: number;
  commentsCount: number;
  completionRate: number;
  averageCompletionTime: number;
  score: number;
}

interface ProjectStats {
  totalCards: number;
  completedCards: number;
  inProgressCards: number;
  todoCards: number;
  totalMembers: number;
  activeMembers: number;
}

export default function TopPerformers({ projectId }: TopPerformersProps) {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("all");

  useEffect(() => {
    fetchTopPerformers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, timeframe]);

  const fetchTopPerformers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/projects/${projectId}/top-performers?timeframe=${timeframe}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch top performers");
      }

      const data = await response.json();
      setPerformers(data.performers);
      setProjectStats(data.projectStats);
      setError(null);
    } catch (err) {
      console.error("Error fetching top performers:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load top performers"
      );
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="text-(--theme-accent) text-2xl" />;
      case 2:
        return (
          <FaMedal className="text-gray-400 dark:text-gray-500 text-2xl" />
        );
      case 3:
        return <FaMedal className="text-(--theme-warning) text-2xl" />;
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
            {rank}
          </div>
        );
    }
  };

  const getPerformanceBadge = (completionRate: number) => {
    if (completionRate >= 90) {
      return (
        <Badge className="bg-(--theme-success-light) text-(--theme-success-dark)">
          <FaFire className="mr-1" />
          Excellent
        </Badge>
      );
    } else if (completionRate >= 70) {
      return (
        <Badge className="bg-(--theme-primary-light) text-(--theme-primary-dark)">
          <FaAward className="mr-1" />
          Good
        </Badge>
      );
    } else if (completionRate >= 50) {
      return (
        <Badge className="bg-(--theme-accent-light) text-(--theme-accent-dark)">
          <FaChartLine className="mr-1" />
          Average
        </Badge>
      );
    } else {
      return <Badge variant="outline">Needs Improvement</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-(--theme-primary) mx-auto mb-4" />
            <p className="text-muted-foreground">Loading top performers...</p>
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
            <Button onClick={fetchTopPerformers} className="mt-4">
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
            <FaTrophy className="text-(--theme-accent)" />
            Top Performers
          </h2>
          <p className="text-muted-foreground mt-1">
            Recognition for outstanding team members
          </p>
        </div>

        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Statistics */}
      {projectStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectStats.totalCards}
              </div>
              <Progress
                value={
                  projectStats.totalCards > 0
                    ? (projectStats.completedCards / projectStats.totalCards) *
                      100
                    : 0
                }
                className="h-2 mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {projectStats.completedCards} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectStats.totalMembers}
              </div>
              <Progress
                value={
                  projectStats.totalMembers > 0
                    ? (projectStats.activeMembers / projectStats.totalMembers) *
                      100
                    : 0
                }
                className="h-2 mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {projectStats.activeMembers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-(--theme-primary)">
                {projectStats.inProgressCards}
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-muted-foreground">
                  {projectStats.todoCards} To Do
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaMedal className="text-(--theme-accent)" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {performers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FaTrophy className="text-4xl mx-auto mb-4 opacity-50" />
              <p>No performance data available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {performers.map((performer, index) => (
                <div
                  key={performer.user.id}
                  className={`p-6 rounded-lg border-2 ${
                    index === 0
                      ? "border-(--theme-accent) bg-(--theme-accent-light)/10"
                      : index === 1
                      ? "border-gray-300 dark:border-gray-600 bg-muted/50"
                      : index === 2
                      ? "border-(--theme-warning) bg-(--theme-warning-light)/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 flex items-center justify-center">
                        {getMedalIcon(index + 1)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">
                          {performer.user.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {performer.user.email}
                        </p>
                        <div className="mt-2">
                          {getPerformanceBadge(performer.completionRate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-(--theme-primary)">
                        {performer.score.toFixed(0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        performance score
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Completion Rate</span>
                      <span className="text-muted-foreground">
                        {performer.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={performer.completionRate}
                      className="h-3"
                    />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FaCheckCircle className="text-(--theme-success)" />
                        <span className="text-xs text-muted-foreground">
                          Completed
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-(--theme-success)">
                        {performer.cardsCompleted}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FaFire className="text-(--theme-accent)" />
                        <span className="text-xs text-muted-foreground">
                          In Progress
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-(--theme-accent)">
                        {performer.cardsInProgress}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FaClock className="text-(--theme-secondary)" />
                        <span className="text-xs text-muted-foreground">
                          Time
                        </span>
                      </div>
                      <p className="text-lg font-bold text-(--theme-secondary)">
                        {formatDuration(performer.totalTimeMinutes)}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FaComment className="text-(--theme-primary)" />
                        <span className="text-xs text-muted-foreground">
                          Comments
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-(--theme-primary)">
                        {performer.commentsCount}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FaChartLine className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Avg Time
                        </span>
                      </div>
                      <p className="text-lg font-bold text-muted-foreground">
                        {performer.averageCompletionTime > 0
                          ? `${performer.averageCompletionTime.toFixed(0)}d`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info for Top 3 */}
                  {index < 3 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Cards Assigned: {performer.cardsAssigned}
                        </span>
                        {performer.cardsAssigned > 0 && (
                          <span className="font-medium">
                            {(
                              (performer.cardsCompleted /
                                performer.cardsAssigned) *
                              100
                            ).toFixed(1)}
                            % completion
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Criteria Info */}
      <Card className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="text-sm">Performance Scoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">🏆 Excellent (90%+)</p>
              <p className="text-muted-foreground">
                Consistently completes tasks on time with high quality
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">⭐ Good (70-89%)</p>
              <p className="text-muted-foreground">
                Regularly delivers tasks with solid performance
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">📊 Average (50-69%)</p>
              <p className="text-muted-foreground">
                Meeting expectations with room for improvement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
