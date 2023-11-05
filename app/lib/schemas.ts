import { z } from "zod";

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  amount: z.coerce
    .number()
    .positive('Invoices must have a value greater than 0'),
  status: z.enum(['paid', 'pending']),
  date: z.string().datetime()
});

export const InvoiceCreationSchema = InvoiceSchema
  .omit({ id: true , date: true });

export const InvoiceUpdateSchema = InvoiceSchema
  .omit({ date: true });
  