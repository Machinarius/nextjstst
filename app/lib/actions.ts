'use server';
// This string triggers the NextJS compiler to treat these
// functions as 'server actions'. These can be linked into 
// forms like `<form action={myServerAction}>` so the React
// infrastructure will call the function; though it won't be
// called directly! NextJS generates a POST API endpoint for
// the function.

import { InvoiceCreationSchema, InvoiceUpdateSchema } from "./schemas";
import { saveNewInvoiceToDb, updateInvoiceInDb } from "./data";
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
  await saveNewInvoiceToDb({
    ...validationResult.data,
    amount: validationResult.data.amount * 100
  });

  // Invalidate the built-in cache for the route _before_ redirecting
  // the user back to the invoices list page.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  var validationResult = InvoiceUpdateSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    throw new Error("Validations failed");
  }

  // NextJS folks recommend representing the value in cents to avoid JS
  // floating-point shenanigans
  await updateInvoiceInDb({
    ...validationResult.data,
    amount: validationResult.data.amount * 100
  });

  // Invalidate the built-in cache for the route _before_ redirecting
  // the user back to the invoices list page.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}