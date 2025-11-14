"use client"

import type { ReactNode } from "react"
import { useStepperForm } from "./context"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  tabIndex: number
  fieldName: string
  children: ReactNode
  className?: string
  errorClassName?: string
}

export function FormField({ tabIndex, fieldName, children, className = "", errorClassName = "" }: FormFieldProps) {
  const { errors } = useStepperForm()
  const error = errors[fieldName]

  return (
    <div className={cn("stepper-form-field mb-4", className)}>
      {children}
      {error && <p className={cn("text-red-500 text-sm mt-1 font-medium", errorClassName)}>{error}</p>}
    </div>
  )
}

