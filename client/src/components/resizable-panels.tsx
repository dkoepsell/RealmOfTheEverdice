import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

interface ResizablePanelsProps {
  children: React.ReactNode[];
  initialSizes?: number[];
  direction?: "horizontal" | "vertical";
  className?: string;
  collapsible?: boolean;
  minSizes?: number[];
  maxSizes?: number[];
}

export function ResizablePanels({
  children,
  initialSizes = [],
  direction = "horizontal",
  className = "",
  collapsible = true,
  minSizes = [],
  maxSizes = []
}: ResizablePanelsProps) {
  // Default sizing if not provided
  const defaultSizes = Array(children.length).fill(100 / children.length);
  const sizes = initialSizes.length === children.length ? initialSizes : defaultSizes;
  
  // Default min/max sizes
  const defaultMinSize = 10;
  const defaultMaxSize = 90;
  const finalMinSizes = minSizes.length === children.length ? minSizes : Array(children.length).fill(defaultMinSize);
  const finalMaxSizes = maxSizes.length === children.length ? maxSizes : Array(children.length).fill(defaultMaxSize);

  return (
    <ResizablePanelGroup
      direction={direction}
      className={cn("min-h-[200px] rounded-lg border", className)}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <ResizablePanel
            defaultSize={sizes[index]}
            minSize={finalMinSizes[index]}
            maxSize={finalMaxSizes[index]}
            collapsible={collapsible}
            className="transition-all duration-200"
          >
            {child}
          </ResizablePanel>
          {index < children.length - 1 && (
            <ResizableHandle withHandle />
          )}
        </React.Fragment>
      ))}
    </ResizablePanelGroup>
  );
}