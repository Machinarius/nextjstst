import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Customer = {
    id: Generated<string>;
    name: string;
    email: string;
    image_url: string;
};
export type Invoice = {
    id: Generated<string>;
    customer_id: string;
    amount: number;
    /**
     * @kyselyType('pending' | 'paid')
     */
    status: 'pending' | 'paid';
    date: Timestamp;
};
export type RevenueSnapshot = {
    month: string;
    revenue: number;
};
export type User = {
    id: Generated<string>;
    name: string;
    email: string;
    password: string;
};
export type DB = {
    customers: Customer;
    invoices: Invoice;
    revenue: RevenueSnapshot;
    users: User;
};
