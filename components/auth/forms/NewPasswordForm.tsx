"use client";

import { newPasswordSchema } from "@/lib/auth/validation/auth-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormWrapper } from "@/components/auth/FormWrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { newPassword } from "@/lib/auth/auth.actions";
import { toast } from "sonner";

export function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") as string;

  const [type, setType] = useState<"text" | "password">("password");
  const [isPending, setIsPending] = useState(false);

  // Validation states
  const [lowerValidated, setLowerValidated] = useState(false);
  const [upperValidated, setUpperValidated] = useState(false);
  const [numberValidated, setNumberValidated] = useState(false);
  const [specialValidated, setSpecialValidated] = useState(false);
  const [lengthValidated, setLengthValidated] = useState(false);

  const form = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const password = form.watch("password");

  // Calculate requirements met
  const getRequirementsMet = () => {
    const validations = [
      lowerValidated,
      upperValidated,
      numberValidated,
      specialValidated,
      lengthValidated,
    ];
    return validations.filter(Boolean).length;
  };

  const totalRequirements = 5;
  const requirementsMet = getRequirementsMet();
  const allRequirementsMet = requirementsMet === totalRequirements;

  useEffect(() => {
    const lower = /(?=.*[a-z])/;
    const upper = /(?=.*[A-Z])/;
    const number = /(?=.*[0-9])/;
    const special = /(?=.*[!@#$%*^&*\-_])/;
    const length = /.{8,}/;

    setLowerValidated(lower.test(password));
    setUpperValidated(upper.test(password));
    setNumberValidated(number.test(password));
    setSpecialValidated(special.test(password));
    setLengthValidated(length.test(password));
  }, [password]);

  const onSubmit = (values: z.infer<typeof newPasswordSchema>) => {
    setIsPending(true);

    newPassword(values, token)
      .then((data) => {
        if (!data?.success) {
          form.reset();
          toast.error(data?.message);
        }
        if (data?.success) {
          form.reset();
          toast.success(data?.message);
        }
      })
      .finally(() => setIsPending(false));
  };
  // Determine whether validation items should be visible
  const shouldShowValidation = password.length > 0 && !allRequirementsMet;

  return (
    <FormWrapper
      label="Reset Password"
      buttonLabel="Back to login"
      buttonHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">
                    New Password
                  </FormLabel>
                  <div className="flex flex-row items-center">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="*******"
                        type={type}
                        disabled={isPending}
                        className="h-11 border-r-0 rounded-r-none"
                      />
                    </FormControl>
                    <span
                      onClick={() =>
                        setType((prev) =>
                          prev === "password" ? "text" : "password"
                        )
                      }
                      className="cursor-pointer bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 border-l-0 p-2 rounded-r-lg h-11 flex items-center justify-center hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                    >
                      {type === "password" ? (
                        <Eye className="size-5 text-muted-foreground" />
                      ) : (
                        <EyeOff className="size-5 text-muted-foreground" />
                      )}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Password Requirements */}
            {shouldShowValidation && (
              <div className="mt-2 bg-white/5 dark:bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/20 dark:border-white/10">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                  <span className="text-sm font-medium text-foreground">
                    Password Requirements
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {requirementsMet}/{totalRequirements} completed
                  </span>
                </div>

                <div className="space-y-2">
                  <RequirementItem
                    text="At least one lowercase letter (a-z)"
                    isValid={lowerValidated}
                  />
                  <RequirementItem
                    text="At least one uppercase letter (A-Z)"
                    isValid={upperValidated}
                  />
                  <RequirementItem
                    text="At least one number (0-9)"
                    isValid={numberValidated}
                  />
                  <RequirementItem
                    text="At least one special character (!@#$%^&*)"
                    isValid={specialValidated}
                  />
                  <RequirementItem
                    text="Minimum 8 characters"
                    isValid={lengthValidated}
                  />
                </div>
              </div>
            )}
          </div>
          <SubmitButton
            isPending={isPending}
            text="Reset Password"
            className="w-full"
          />
        </form>
      </Form>
    </FormWrapper>
  );
}

// Component for individual requirement items
function RequirementItem({
  text,
  isValid,
}: {
  text: string;
  isValid: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {isValid ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <span
        className={`text-sm ${isValid ? "text-green-500" : "text-muted-foreground"}`}
      >
        {text}
      </span>
    </div>
  );
}
