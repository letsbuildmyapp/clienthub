import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <Avatar className={cn(className)}>
      <AvatarFallback className={color}>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}
