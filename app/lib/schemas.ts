import { z } from "zod";

// NextJS folks recommend representing the value in cents to avoid JS
// floating-point shenanigans, hence the transform on `value`
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.coerce
    .number()
    .positive('Invoices must have a value greater than 0')
    .transform(value => value * 100),
  status: z.enum(['paid', 'pending']),
  date: z.string().datetime()
});

export const InvoiceCreationSchema = InvoiceSchema
  .omit({ id: true , date: true });

export const InvoiceUpdateSchema = InvoiceSchema
  .omit({ date: true });
  
export const InvoiceDeletionSchema = InvoiceSchema
  .pick({ id: true });