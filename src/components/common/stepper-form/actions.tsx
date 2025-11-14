"use client"

import type { ReactNode } from "react"
import { useStepperForm } from "./context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

interface ActionsProps {
  className?: string
  nextLabel?: string
  prevLabel?: string
  submitLabel?: string
  showIcons?: boolean
  renderCustomActions?: (props: {
    onNext: () => void
    onPrev: () => void
    isFirstTab: boolean
    isLastTab: boolean
  }) => ReactNode
}

export function Actions({
  className = "",
  nextLabel = "Next",
  prevLabel = "Back",
  submitLabel = "Submit",
  showIcons = true,
  renderCustomActions,
}: ActionsProps) {
  const { activeTabIndex, setActiveTabIndex, validateTab, isLastTab } = useStepperForm()

  const isFirstTab = activeTabIndex === 0

  const handleNext = () => {
    const isValid = validateTab(activeTabIndex)
    if (isValid) {
      setActiveTabIndex(activeTabIndex + 1)
    }
  }

  const handlePrev = () => {
    setActiveTabIndex(activeTabIndex - 1)
  }

  if (renderCustomActions) {
    return (
      <div className={cn("stepper-actions flex justify-between ", className)}>
        {renderCustomActions({
          onNext: handleNext,
          onPrev: handlePrev,
          isFirstTab,
          isLastTab,
        })}
      </div>
    )
  }

  return (
    <motion.div className={cn("stepper-actions flex justify-between ", className)} layout>
      {!isFirstTab ? (
        <Button type="button" variant="outline" onClick={handlePrev} className="gap-2">
          {showIcons && <ArrowLeft className="h-4 w-4" />}
          {prevLabel}
        </Button>
      ) : (
        <div></div>
      )}

      <motion.div className="ml-auto" layout>
        {!isLastTab ? (
          <Button type="button" onClick={handleNext} className="gap-2 ">
            {nextLabel}
            {showIcons && <ArrowRight className="h-4 w-4" />}
          </Button>
        ) : (
          null
          // <Button type="submit" className="gap-2">
          //   {submitLabel}
          //   {showIcons && <Check className="h-4 w-4" />}
          // </Button>
        )}
      </motion.div>
    </motion.div>
  )
}

