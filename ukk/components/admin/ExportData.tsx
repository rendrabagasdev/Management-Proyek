"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaDownload, FaSpinner } from "react-icons/fa";
import AssignmentModal from "@/components/projects/AssignmentModal";

export function ExportData() {
  const [isExporting, setIsExporting] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    message: string;
  }>({
    isOpen: false,
    type: "success",
    message: "",
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/admin/export");
      if (!response.ok) throw new Error("Export failed");

      const data = await response.json();

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ukk-system-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success modal
      setModalState({
        isOpen: true,
        type: "success",
        message: "Data exported successfully!",
      });
    } catch (error) {
      console.error("Export error:", error);
      setModalState({
        isOpen: true,
        type: "error",
        message: "Failed to export data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export System Data</CardTitle>
        <CardDescription>
          Download a complete backup of all system data in JSON format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Export includes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All users and their activity statistics</li>
              <li>All projects with members and boards</li>
              <li>Task statistics by project</li>
              <li>System-wide summary</li>
            </ul>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <FaSpinner className="mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FaDownload className="mr-2" />
                Export Data
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Feedback Modal */}
      <AssignmentModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        message={modalState.message}
      />
    </Card>
  );
}
