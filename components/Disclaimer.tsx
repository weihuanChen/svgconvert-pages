import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisclaimerProps {
  message: string
  className?: string
}

export function Disclaimer({ message, className }: DisclaimerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border-4 border-black bg-lime-100/90 px-4 py-3 text-black shadow-[6px_6px_0_0_#000] dark:border-white dark:bg-lime-900/50 dark:text-white dark:shadow-[6px_6px_0_0_#fff]",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <p className="text-sm leading-relaxed">
        {message}
      </p>
    </div>
  )
}
