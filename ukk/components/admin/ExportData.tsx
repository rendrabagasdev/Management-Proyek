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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaSpinner, FaFilePdf, FaFileCsv, FaFileCode } from "react-icons/fa";
import AssignmentModal from "@/components/projects/AssignmentModal";

type ExportFormat = "json" | "csv" | "pdf";

export function ExportData() {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");
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
      const response = await fetch(
        `/api/admin/export?format=${selectedFormat}`
      );
      if (!response.ok) throw new Error("Export failed");

      if (selectedFormat === "json") {
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
      } else if (selectedFormat === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ukk-system-export-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (selectedFormat === "pdf") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ukk-system-export-${
          new Date().toISOString().split("T")[0]
        }.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Open in new window for printing
        window.open(url, "_blank");
      }

      // Show success modal
      setModalState({
        isOpen: true,
        type: "success",
        message: `Data exported successfully as ${selectedFormat.toUpperCase()}!`,
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

  const getFormatIcon = () => {
    switch (selectedFormat) {
      case "pdf":
        return <FaFilePdf className="mr-2" />;
      case "csv":
        return <FaFileCsv className="mr-2" />;
      case "json":
        return <FaFileCode className="mr-2" />;
    }
  };

  const getFormatDescription = () => {
    switch (selectedFormat) {
      case "pdf":
        return "Printable HTML report (use browser's Print to PDF feature)";
      case "csv":
        return "Spreadsheet-compatible format for data analysis";
      case "json":
        return "Complete structured data for backup and integration";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export System Data</CardTitle>
        <CardDescription>
          Download a complete backup of all system data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select
              value={selectedFormat}
              onValueChange={(value) =>
                setSelectedFormat(value as ExportFormat)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FaFileCode className="text-(--theme-primary)" />
                    <span>JSON - Complete Data</span>
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FaFileCsv className="text-(--theme-success)" />
                    <span>CSV - Spreadsheet Format</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FaFilePdf className="text-(--theme-danger)" />
                    <span>PDF - Printable Report (HTML)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getFormatDescription()}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="mb-2 font-medium">Export includes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>All users and their activity statistics</li>
              <li>All projects with members and boards</li>
              <li>Task statistics by project and status</li>
              <li>Time logs and work hours data</li>
              <li>Comments and collaboration metrics</li>
              <li>System-wide summary and analytics</li>
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
                Exporting {selectedFormat.toUpperCase()}...
              </>
            ) : (
              <>
                {getFormatIcon()}
                Export as {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            File will be downloaded as: ukk-system-export-
            {new Date().toISOString().split("T")[0]}.
            {selectedFormat === "pdf"
              ? "html (use Print to PDF)"
              : selectedFormat}
          </div>
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
