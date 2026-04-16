import { useState } from "react";
import type { Business } from "@/types";

export function useMap() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const [view, setView] = useState<"map" | "list">("map");

  return { selectedBusiness, setSelectedBusiness, view, setView };
}
