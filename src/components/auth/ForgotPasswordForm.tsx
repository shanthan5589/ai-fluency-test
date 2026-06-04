"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { requestPasswordReset } from "@/actions/auth"
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

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type FormValues = z.infer<typeof schema>

const inputClass =
  "h-12 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-emerald-100 focus-visible:ring-offset-0 focus-visible:border-emerald-400"

const labelClass = "text-neutral-500 text-xs uppercase tracking-widest font-bold"

export function ForgotPasswordForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    const result = await requestPasswordReset(values)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@example.com" className={inputClass} {...field} />
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
            {isSubmitting ? "Sending code…" : "Send code"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
