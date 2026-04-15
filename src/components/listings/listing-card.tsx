import type { Business } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  business: Business;
};

export function ListingCard({ business }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{business.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{business.city}, {business.country}</p>
        <p>Asking: €{business.asking_price.toLocaleString()}</p>
        <p>Revenue: €{business.revenue.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}
