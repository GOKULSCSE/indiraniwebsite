"use client"
import Intro from '@/components/intro'
import React, { useState } from 'react'

const LayoutWrapper = ({children}: {children: React.ReactNode}) => {
    const [introCompleted, setIntroCompleted] = useState(false);

    const handleIntroComplete = () => {
        setIntroCompleted(true);
    }
  return (
    <>
      {introCompleted ? <>{children}</> : <Intro onComplete={handleIntroComplete} />}
    </>
  )
}

export default LayoutWrapper