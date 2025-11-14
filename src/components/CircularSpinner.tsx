// components/CircularSpinner.tsx
import { Loader2 } from "lucide-react";

export function CircularSpinner({ size = 16 }: { size?: number }) {
  return <Loader2 className="animate-spin" size={size} />;
}