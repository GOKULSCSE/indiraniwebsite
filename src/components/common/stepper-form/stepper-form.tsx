"use client"

import type { ReactNode } from "react"
import type { z } from "zod"
import { StepperFormProvider, type StepperFormState } from "./context"

interface StepperFormProps {
  children: ReactNode
  formState: StepperFormState
  schema: z.ZodType<any>
  onSubmit: (formData: any) => void
  className?: string
  tabSchemas?: z.ZodType<any>[]
  onFormStateChange: (state: StepperFormState) => void
  currentTab?: number
  onTabChange?: (tab: number) => void
}

export function StepperForm({ 
  children, 
  formState, 
  schema, 
  onSubmit, 
  className = "", 
  tabSchemas, 
  onFormStateChange,
  currentTab,
  onTabChange
}: StepperFormProps) {
  return (
    <StepperFormProvider 
      formState={formState} 
      schema={schema} 
      tabSchemas={tabSchemas} 
      onFormStateChange={onFormStateChange}
      currentTab={currentTab}
      onTabChange={onTabChange}
    >
      <form
        className={`stepper-form ${className}`}
        onSubmit={(e) => {
          e.preventDefault()
          const formData = formState.reduce((acc, tab) => {
            return { ...acc, ...tab.fields }
          }, {})
          onSubmit(formData)
        }}
      >
        {children}
      </form>
    </StepperFormProvider>
  )
}

