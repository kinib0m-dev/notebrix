"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSubjectActions } from "@/lib/subjects/hooks/useSubjectActions";
import { SUBJECT_COLORS } from "@/lib/subjects/types";
import { Loader2 } from "lucide-react";
import type { CreateSubjectInput } from "@/lib/subjects/types";

const createSubjectFormSchema = z.object({
  name: z
    .string()
    .min(1, "Subject name is required")
    .max(100, "Subject name must be less than 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  color: z.string().min(1, "Please select a color"),
  userEvaluation: z.enum(["beginner", "intermediate", "advanced"]),
});

type CreateSubjectFormValues = z.infer<typeof createSubjectFormSchema>;

interface CreateSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSubjectDialog({
  open,
  onOpenChange,
}: CreateSubjectDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { createAndSelectSubject } = useSubjectActions();

  const form = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: SUBJECT_COLORS[0], // Default to first color
      userEvaluation: "beginner",
    },
  });

  const onSubmit = async (values: CreateSubjectFormValues) => {
    try {
      setIsCreating(true);

      // Transform the form values to match CreateSubjectInput
      const createSubjectData: CreateSubjectInput = {
        name: values.name,
        description: values.description || "",
        color: values.color,
        userEvaluation: values.userEvaluation,
      };

      await createAndSelectSubject(createSubjectData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create subject:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-md border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>
            Add a new subject to organize your learning materials.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Subject Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Mathematics, Physics, History..."
                      className="bg-muted/50 border-border"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this subject..."
                      className="bg-muted/50 border-border resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Selection */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Theme</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-5 gap-3">
                      {SUBJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={cn(
                            "w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110",
                            field.value === color
                              ? "border-foreground shadow-lg scale-110"
                              : "border-muted-foreground/30 hover:border-muted-foreground/60"
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        >
                          {field.value === color && (
                            <div className="w-full h-full rounded-md bg-background/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-background rounded-full" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Experience Level */}
            <FormField
              control={form.control}
              name="userEvaluation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Experience Level</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {[
                        {
                          value: "beginner" as const,
                          label: "Beginner",
                          emoji: "🌱",
                        },
                        {
                          value: "intermediate" as const,
                          label: "Intermediate",
                          emoji: "📚",
                        },
                        {
                          value: "advanced" as const,
                          label: "Advanced",
                          emoji: "🎓",
                        },
                      ].map((level) => (
                        <Button
                          key={level.value}
                          type="button"
                          variant={
                            field.value === level.value ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => field.onChange(level.value)}
                          className={cn(
                            "flex-1",
                            field.value === level.value
                              ? "bg-primary hover:bg-primary/90"
                              : "bg-muted/50 hover:bg-muted"
                          )}
                        >
                          <span className="mr-1">{level.emoji}</span>
                          {level.label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isCreating}
                className="bg-muted/50 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-primary hover:bg-primary/90"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Subject"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
