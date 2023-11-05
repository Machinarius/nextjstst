'use server';
// This string triggers the NextJS compiler to treat these
// functions as 'server actions'. These can be linked into 
// forms like `<form action={myServerAction}>` so the React
// infrastructure will call the function; though it won't be
// called directly! NextJS generates a POST API endpoint for
// the function.

import { InvoiceCreationSchema } from "./schemas";
import { saveInvoice } from "./data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInvoice(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  var validationResult = InvoiceCreationSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    throw new Error("Validations failed");
  }

  // NextJS folks recommend representing the value in cents to avoid JS
  // floating-point shenanigans
  await saveInvoice({
    ...validationResult.data,
    amount: validationResult.data.amount * 100
  });

  // Invalidate the built-in cache for the route _before_ redirecting
  // the user back to the invoices list page.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

