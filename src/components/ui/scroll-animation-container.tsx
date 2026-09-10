"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface ScrollAnimationContainerProps {
  children: React.ReactNode
  className?: string
}

export const ScrollAnimationContainer = ({ children, className = "" }: ScrollAnimationContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <motion.div
      ref={containerRef}
      style={{ y, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
