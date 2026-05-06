import { initialsOf } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TeamLogo({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase text-white shadow-sm",
        color,
        className,
      )}
    >
      {initialsOf(name)}
    </div>
  );
}
