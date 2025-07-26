"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  Undo2,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubjectStore } from "@/lib/subjects/store/useSubjectStore";
import { useSubjects } from "@/lib/subjects/hooks/useSubjects";
import { CreateSubjectDialog } from "../navbar/CreateSubjectDialog";
import { EditSubjectDialog } from "./EditSubjectDialog";
import { DeleteSubjectDialog } from "./DeleteSubjectDialog";
import { ArchiveSubjectDialog } from "./ArchiveSubjectDialog";
import {
  getUserEvaluationDisplayName,
  formatSubjectDate,
} from "@/lib/subjects/utils/helpers";
import { trpc } from "@/trpc/client";
import type { Subject } from "@/lib/subjects/types";

export function SubjectsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { subjects, currentSubject } = useSubjectStore();
  const { selectSubject } = useSubjects();

  // Fetch archived subjects
  const { data: archivedData } = trpc.subjects.getArchived.useQuery();
  const archivedSubjects = archivedData?.data || [];

  // Get the current subjects list based on active tab
  const currentSubjects = activeTab === "active" ? subjects : archivedSubjects;

  // Filter subjects based on search term
  const filteredSubjects = currentSubjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subject.description &&
        subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSwitchSubject = (subject: Subject) => {
    selectSubject(subject);
    // You can add navigation to subject detail page here if needed
    // switchSubject(subject.id);
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditDialogOpen(true);
  };

  const handleDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  const handleArchiveSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setArchiveDialogOpen(true);
  };

  // For restoring archived subjects, we can reuse the update mutation
  const updateSubjectMutation = trpc.subjects.update.useMutation({
    onSuccess: () => {
      // Refetch both active and archived subjects
      window.location.reload(); // Simple refresh for now
    },
  });

  const handleRestoreSubject = async (subject: Subject) => {
    try {
      await updateSubjectMutation.mutateAsync({
        id: subject.id,
        name: subject.name, // Required field
      });
    } catch (error) {
      console.error("Failed to restore subject:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Subjects</h1>
          <p className="text-muted-foreground">
            Manage and organize your learning subjects
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-fit">
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {/* Tabs for Active/Archived */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="active">Active Subjects</TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedSubjects.length})
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab} subjects...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Subject Count */}
        <div className="flex items-center gap-2 pb-2">
          <Badge variant="outline">
            {filteredSubjects.length} of {currentSubjects.length} subjects
          </Badge>
          {activeTab === "active" && currentSubject && (
            <Badge variant="default">Current: {currentSubject.name}</Badge>
          )}
        </div>

        <TabsContent value="active" className="space-y-6 mt-0">
          {/* Active Subjects Grid */}
          {filteredSubjects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {searchTerm ? "No subjects found" : "No subjects yet"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Create your first subject to get started"}
                    </p>
                  </div>
                  {!searchTerm && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Subject
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <Card
                  key={subject.id}
                  className={`transition-all duration-200 hover:shadow-lg relative pointer-events-none ${
                    currentSubject?.id === subject.id
                      ? "ring-2 ring-primary shadow-lg"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-3 pointer-events-auto">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: subject.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg truncate">
                              {subject.name}
                            </CardTitle>
                            {currentSubject?.id === subject.id && (
                              <Badge
                                variant="default"
                                className="text-xs shrink-0"
                              >
                                Current
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
                        >
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {currentSubject?.id !== subject.id && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  handleSwitchSubject(subject);
                                }}
                              >
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Switch to Subject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              handleEditSubject(subject);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              handleArchiveSubject(subject);
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              handleDeleteSubject(subject);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pointer-events-auto">
                    <div className="space-y-3">
                      {subject.description && (
                        <CardDescription className="line-clamp-2">
                          {subject.description}
                        </CardDescription>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">
                          {getUserEvaluationDisplayName(subject.userEvaluation)}
                        </Badge>
                        <span className="text-muted-foreground">
                          {formatSubjectDate(new Date(subject.createdAt))}
                        </span>
                      </div>
                      {/* Switch Button - only show if not current subject */}
                      {currentSubject?.id !== subject.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwitchSubject(subject);
                          }}
                          className="w-full"
                        >
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Switch to Subject
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-6 mt-0">
          {/* Archived Subjects Grid */}
          {filteredSubjects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
                    <Archive className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {searchTerm
                        ? "No archived subjects found"
                        : "No archived subjects"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Archived subjects will appear here"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <Card
                  key={subject.id}
                  className="opacity-75 hover:opacity-100 transition-opacity"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: subject.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg truncate">
                              {subject.name}
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              Archived
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreSubject(subject);
                              }}
                              disabled={updateSubjectMutation.isPending}
                            >
                              <Undo2 className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubject(subject);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {subject.description && (
                        <CardDescription className="line-clamp-2">
                          {subject.description}
                        </CardDescription>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">
                          {getUserEvaluationDisplayName(subject.userEvaluation)}
                        </Badge>
                        <span className="text-muted-foreground">
                          Archived{" "}
                          {formatSubjectDate(new Date(subject.createdAt))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateSubjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedSubject && (
        <>
          <EditSubjectDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            subject={selectedSubject}
          />
          <ArchiveSubjectDialog
            open={archiveDialogOpen}
            onOpenChange={setArchiveDialogOpen}
            subject={selectedSubject}
          />
          <DeleteSubjectDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            subject={selectedSubject}
          />
        </>
      )}
    </div>
  );
}
