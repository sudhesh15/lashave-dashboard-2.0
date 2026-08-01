import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "mb-1.5 block type-small font-medium text-gray-700 dark:text-gray-400",
        className
      )}
      {...props}
    />
  );
}

export { Label };
