import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden animate-pulse rounded-2xl bg-foreground/[0.03] backdrop-blur-md border border-foreground/[0.05]", 
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent -translate-x-full animate-shimmer" />
    </div>
  )
}

export { Skeleton }
