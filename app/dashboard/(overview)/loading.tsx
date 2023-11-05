import React from "react";
import DashboardSkeleton from "@ui/skeletons";

// Another auto-magic convention file.
// Nextjs will show this while async functions are running in the 
// page component, preventing the render of the full page.

// The (overview) folder is important.
// The parenthesis syntax allows us to separate the app in logical 'areas'
// that _do not_ get considered for routing:
// This is still /dashboard, _not_ /dashboard/(overview)/

// This separation goes beyond code organization, it allows this loader to 
// _only_ work for the main /dashboard route. It won't affect /dashboard/customers
// nor /dashboard/invoices because it lives in a sibling of those route folders
export default function LoadingView() {
  return (
    <DashboardSkeleton />
  );
}