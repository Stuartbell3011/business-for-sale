"use client";

import type { ListingFilters } from "@/types";

type Props = {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
};

export function MapFilters({ filters, onChange }: Props) {
  return <div>Filters placeholder</div>;
}
