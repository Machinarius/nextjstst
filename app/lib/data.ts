import { formatCurrency } from "./utils";
import { DB } from "./models";
import { Pool } from "pg";
import { ExpressionBuilder, Kysely, PostgresDialect } from "kysely";
import { z } from "zod";
import { InvoiceCreationSchema, InvoiceDeletionSchema, InvoiceUpdateSchema } from "./schemas";

const dialect = new PostgresDialect({
  pool: new Pool({
    database: process.env.POSTGRES_DATABASE,
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    max: 10,
  }),
});

const db = new Kysely<DB>({
  dialect,
});

export type RevenueItem = Awaited<ReturnType<typeof fetchRevenue>>[number];
export async function fetchRevenue() {
  // Add noStore() here prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).

  try {
    // Artificially delay a reponse for demo purposes.
    // Don't do this in real life :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await db.selectFrom("revenue").selectAll().execute();

    // console.log('Data fetch complete after 3 seconds.');

    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export type InvoiceOverviewItem = Awaited<ReturnType<typeof fetchLatestInvoices>>[number];
export async function fetchLatestInvoices() {
  try {
    const data = await db
      .selectFrom("invoices")
      .innerJoin("customers", "customer_id", "invoices.customer_id")
      .select([
        "invoices.id",
        "invoices.amount",
        "customers.name as customerName",
        "customers.image_url as customerImageUrl",
        "customers.email as customerEmail",
      ])
      .orderBy("invoices.date desc")
      .limit(5)
      .execute();

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest invoices.");
  }
}

export async function fetchCardData() {
  try {
    const data = await db
      .selectNoFrom(({ selectFrom }) => [
        selectFrom("customers")
          .select(({ fn }) => [fn.countAll<number>().as("customerCount")])
          .as("customerCount"),
        selectFrom("invoices")
          .select(({ fn }) => [fn.countAll<number>().as("invoiceCount")])
          .as("invoiceCount"),
        selectFrom("invoices")
          .select(({ fn }) => [
            fn.sum<number>("amount").as("paidInvoicesTotal"),
          ])
          .where("status", "=", "paid")
          .as("paidInvoicesTotal"),
        selectFrom("invoices")
          .select(({ fn }) => [
            fn.sum<number>("amount").as("pendingInvoicesTotal"),
          ])
          .where("status", "=", "pending")
          .as("pendingInvoicesTotal"),
      ])
      .executeTakeFirst();
    return {
      numberOfCustomers: data?.customerCount || 0,
      numberOfInvoices: data?.invoiceCount || 0,
      totalPaidInvoices: data?.paidInvoicesTotal || 0,
      totalPendingInvoices: data?.pendingInvoicesTotal || 0,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to card data.");
  }
}

function personRoughlyMatchesQuery(eb: ExpressionBuilder<DB, 'customers' | 'invoices'>, query: string) {
  if (query == 'paid' || query == 'pending') {
    return eb('invoices.status', '=' , query);
  }

  return eb.or([
    eb("customers.name", "ilike", `%${query}%`),
    eb("customers.email", "ilike", `%${query}%`),
    // Not sure if I want to do this
    //eb('invoices.amount', 'ilike', `%${query}%`),
    //eb('invoices.date', 'ilike', `%${query}%`),
  ]);
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await db
      .selectFrom("invoices")
      .innerJoin("customers", "invoices.customer_id", "customers.id")
      .select([
        "invoices.id",
        "invoices.amount",
        "invoices.date",
        "invoices.status",
        "customers.name",
        "customers.email",
        "customers.image_url",
      ])
      .where(({ eb }) => personRoughlyMatchesQuery(eb, query))
      .limit(ITEMS_PER_PAGE)
      .offset(offset)
      .execute();

    return invoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const result = await db
      .selectFrom("invoices")
      .innerJoin("customers", "invoices.customer_id", "customers.id")
      .select(({ fn }) => fn.countAll<number>().as("filteredInvoicesCount"))
      .where(({ eb }) => personRoughlyMatchesQuery(eb, query))
      .executeTakeFirst();

    const totalPages = Math.ceil(
      result?.filteredInvoicesCount || 0 / ITEMS_PER_PAGE
    );
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

export type InvoiceForm = Awaited<ReturnType<typeof fetchInvoiceById>>;
export async function fetchInvoiceById(id: string) {
  try {
    const data = await db
      .selectFrom("invoices")
      .select([
        "invoices.id",
        "invoices.customer_id as customerId",
        "invoices.amount",
        "invoices.status",
      ])
      .where(({ eb }) => eb("invoices.id", "=", id))
      .executeTakeFirstOrThrow();

    const invoice = {
      ...data,
      // Convert amount from cents to dollars
      amount: data.amount / 100,
    };

    return invoice;
  } catch (error) {
    console.error("Database Error:", error);
    throw error;
  }
}

export async function fetchCustomers() {
  try {
    const data = await db
      .selectFrom("customers")
      .select(["id", "name"])
      .orderBy("name asc")
      .execute();

    return data;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await db.selectFrom("customers")
      .leftJoin("invoices", "customers.id", "invoices.customer_id")
      .select(({ eb, fn }) => [
        'customers.id',
        'customers.name',
        'customers.email',
        'customers.image_url',
        fn.count<number>('invoices.id').as('invoiceCount'),
        fn.sum<number>(
          eb.case()
            .when('invoices.status', '=', 'pending')
            .then(db.selectFrom('invoices').select('amount'))
            .else(0)
            .end()
        ).as('pendingInvoicesTotal'),
        fn.sum<number>(
          eb.case()
            .when('invoices.status', '=', 'paid')
            .then(db.selectFrom('invoices').select('amount'))
            .else(0)
            .end()
        ).as('paidInvoicesTotal')
      ])
      .where(({ eb, or }) => or([
        eb('customers.name', 'ilike', `%${query}%`),
        eb('customers.email', 'ilike', `%${query}%`)
      ]))
      .groupBy(['customers.id', 'customers.name', 'customers.email', 'customers.image_url'])
      .orderBy('customers.name asc')
      .execute();

    const customers = data.map((customer) => ({
      ...customer,
      pendingInvoicesTotal: formatCurrency(customer.pendingInvoicesTotal || 0),
      paidInvoicesTotal: formatCurrency(customer.paidInvoicesTotal || 0),
    }));

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch customer table.");
  }
}

export async function getUser(email: string) {
  try {
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where(({ eb }) => eb("email", "=", email))
      .executeTakeFirstOrThrow();
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export async function saveNewInvoiceToDb(data: z.infer<typeof InvoiceCreationSchema>) {
  try {
    await db
      .insertInto('invoices')
      .values({
        amount: data.amount,
        customer_id: data.customerId,
        status: data.status,
        date: new Date()
      })
      .execute();
  } catch (error) {
    console.error("Failed to insert a new invoice: ", error);
    throw error;
  }
}

export async function updateInvoiceInDb(data: z.infer<typeof InvoiceUpdateSchema>) {
  try {
    await db
      .updateTable('invoices')
      .set({
        amount: data.amount,
        customer_id: data.customerId,
        status: data.status,
      })
      .where('id', '=', data.id)
      .execute();
  } catch (error) {
    console.error("Failed to update an invoice: ", error);
    throw error;
  }
}

export async function deleteInvoiceInDb(data: z.infer<typeof InvoiceDeletionSchema>) {
  try {
    await db
      .deleteFrom('invoices')
      .where('id', '=', data.id)
      .execute();
  } catch (error) {
    console.error('Failed to delete an invoice from the DB', error);
    throw error;
  }
}
