"use client";

import type { Business } from "@/types";

type Props = {
  business: Business;
  onClick: (business: Business) => void;
};

export function ListingMarker({ business, onClick }: Props) {
  return (
    <button type="button" onClick={() => onClick(business)}>
      {business.title}
    </button>
  );
}
