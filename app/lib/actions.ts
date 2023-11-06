'use server';
// This string triggers the NextJS compiler to treat these
// functions as 'server actions'. These can be linked into 
// forms like `<form action={myServerAction}>` so the React
// infrastructure will call the function; though it won't be
// called directly! NextJS generates a POST API endpoint for
// the function.

import { InvoiceCreationSchema, InvoiceDeletionSchema, InvoiceUpdateSchema } from "./schemas";
import { deleteInvoiceInDb, saveNewInvoiceToDb, updateInvoiceInDb } from "./data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodType, z } from "zod";

async function createInputHandler<TSchema extends ZodType>(
  formData: FormData,
  schema: TSchema,
  dbHandler: (data: z.infer<TSchema>) => Promise<void>  
) {
  const rawFormData = Object.fromEntries(formData.entries());
  var validationResult = schema.safeParse(rawFormData);

  if (!validationResult.success) {
    throw new Error("Validations failed");
  }

  await dbHandler(validationResult.data);

  // Invalidate the built-in cache for the route _before_ redirecting
  // the user back to the invoices list page.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function createInvoice(formData: FormData) {
  return createInputHandler(formData, InvoiceCreationSchema, saveNewInvoiceToDb);
}

export async function updateInvoice(formData: FormData) {
  return createInputHandler(formData, InvoiceUpdateSchema, updateInvoiceInDb);
}

export async function deleteInvoice(formData: FormData) {
  return createInputHandler(formData, InvoiceDeletionSchema, deleteInvoiceInDb);
}