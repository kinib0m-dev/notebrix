"use client";

import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useSubjectStore } from "@/lib/subjects/store/useSubjectStore";
import { useSubjects } from "@/lib/subjects/hooks/useSubjects";
import { CreateSubjectDialog } from "./CreateSubjectDialog";
import type { Subject } from "@/lib/subjects/types";

interface SubjectSwitcherProps {
  className?: string;
}

export function SubjectSwitcher({ className }: SubjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { subjects, currentSubject } = useSubjectStore();
  const { selectSubject } = useSubjects();

  const handleSubjectSelect = (subject: Subject) => {
    selectSubject(subject);
    setOpen(false);
  };

  const handleCreateSubject = () => {
    setOpen(false);
    setCreateDialogOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg min-w-[200px] justify-between",
              className
            )}
          >
            {currentSubject ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentSubject.color }}
                />
                <span className="truncate">{currentSubject.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                Create a new subject
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
          align="center"
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search subjects..."
              className="bg-transparent border-none"
            />
            <CommandList>
              <CommandEmpty>No subjects found.</CommandEmpty>
              {subjects.length > 0 && (
                <CommandGroup heading="Your Subjects">
                  {subjects.map((subject) => (
                    <CommandItem
                      key={subject.id}
                      value={subject.name}
                      onSelect={() => handleSubjectSelect(subject)}
                      className="hover:bg-white/10 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="flex-1 truncate">{subject.name}</span>
                        {currentSubject?.id === subject.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateSubject}
                  className="hover:bg-white/10 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create new subject
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Subject Dialog */}
      <CreateSubjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
