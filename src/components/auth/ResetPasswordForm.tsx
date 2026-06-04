"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updatePassword } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>

const inputClass =
  "h-12 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-emerald-100 focus-visible:ring-offset-0 focus-visible:border-emerald-400"

const labelClass = "text-neutral-500 text-xs uppercase tracking-widest font-bold"

export function ResetPasswordForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    const result = await updatePassword({ password: values.password })
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>New password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" className={inputClass} {...field} />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" className={inputClass} {...field} />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full h-12 font-medium text-white bg-neutral-900 rounded-full shadow-lg shadow-neutral-200 hover:bg-black transition-all active:scale-[0.98]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating password…" : "Update password"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
