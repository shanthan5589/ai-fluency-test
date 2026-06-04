"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { verifyPasswordResetOtp } from "@/actions/auth"
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
  token: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d+$/, "Code must be numbers only"),
})

type FormValues = z.infer<typeof schema>

interface Props {
  email: string
}

export function VerifyOtpForm({ email }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: "" },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    const result = await verifyPasswordResetOtp({ email, token: values.token })
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-500 text-xs uppercase tracking-widest font-bold">
                Verification code
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="h-12 bg-white border-neutral-200 text-neutral-900 text-center text-2xl tracking-widest font-mono focus-visible:ring-emerald-100 focus-visible:ring-offset-0 focus-visible:border-emerald-400"
                  {...field}
                />
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
            {isSubmitting ? "Verifying…" : "Verify code"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
