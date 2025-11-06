"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaUsers,
  FaProjectDiagram,
  FaTasks,
  FaComments,
  FaSpinner,
} from "react-icons/fa";

interface ActivityStats {
  timestamp: string;
  activity: {
    last24Hours: {
      newUsers: number;
      newProjects: number;
      newCards: number;
      newComments: number;
      activeUsers: number;
    };
    last7Days: {
      newUsers: number;
      newProjects: number;
      newCards: number;
      newComments: number;
      activeUsers: number;
    };
    last30Days: {
      newUsers: number;
      newProjects: number;
      newCards: number;
      newComments: number;
      activeUsers: number;
    };
  };
}

export function SystemActivity() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-gray-400 w-6 h-6" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load activity stats</p>
        </CardContent>
      </Card>
    );
  }

  const renderActivityCard = (
    icon: React.ElementType,
    label: string,
    value: number,
    color: string
  ) => {
    const Icon = icon;
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Badge variant="outline" className="text-lg font-bold">
          {value}
        </Badge>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Activity</CardTitle>
        <CardDescription>Track recent activity and engagement</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="24h" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
          </TabsList>

          <TabsContent value="24h" className="space-y-3 mt-4">
            {renderActivityCard(
              FaUsers,
              "Active Users",
              stats.activity.last24Hours.activeUsers,
              "bg-blue-100 text-blue-600"
            )}
            {renderActivityCard(
              FaUsers,
              "New Users",
              stats.activity.last24Hours.newUsers,
              "bg-green-100 text-green-600"
            )}
            {renderActivityCard(
              FaProjectDiagram,
              "New Projects",
              stats.activity.last24Hours.newProjects,
              "bg-purple-100 text-purple-600"
            )}
            {renderActivityCard(
              FaTasks,
              "New Tasks",
              stats.activity.last24Hours.newCards,
              "bg-orange-100 text-orange-600"
            )}
            {renderActivityCard(
              FaComments,
              "New Comments",
              stats.activity.last24Hours.newComments,
              "bg-pink-100 text-pink-600"
            )}
          </TabsContent>

          <TabsContent value="7d" className="space-y-3 mt-4">
            {renderActivityCard(
              FaUsers,
              "Active Users",
              stats.activity.last7Days.activeUsers,
              "bg-blue-100 text-blue-600"
            )}
            {renderActivityCard(
              FaUsers,
              "New Users",
              stats.activity.last7Days.newUsers,
              "bg-green-100 text-green-600"
            )}
            {renderActivityCard(
              FaProjectDiagram,
              "New Projects",
              stats.activity.last7Days.newProjects,
              "bg-purple-100 text-purple-600"
            )}
            {renderActivityCard(
              FaTasks,
              "New Tasks",
              stats.activity.last7Days.newCards,
              "bg-orange-100 text-orange-600"
            )}
            {renderActivityCard(
              FaComments,
              "New Comments",
              stats.activity.last7Days.newComments,
              "bg-pink-100 text-pink-600"
            )}
          </TabsContent>

          <TabsContent value="30d" className="space-y-3 mt-4">
            {renderActivityCard(
              FaUsers,
              "Active Users",
              stats.activity.last30Days.activeUsers,
              "bg-blue-100 text-blue-600"
            )}
            {renderActivityCard(
              FaUsers,
              "New Users",
              stats.activity.last30Days.newUsers,
              "bg-green-100 text-green-600"
            )}
            {renderActivityCard(
              FaProjectDiagram,
              "New Projects",
              stats.activity.last30Days.newProjects,
              "bg-purple-100 text-purple-600"
            )}
            {renderActivityCard(
              FaTasks,
              "New Tasks",
              stats.activity.last30Days.newCards,
              "bg-orange-100 text-orange-600"
            )}
            {renderActivityCard(
              FaComments,
              "New Comments",
              stats.activity.last30Days.newComments,
              "bg-pink-100 text-pink-600"
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(stats.timestamp).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
