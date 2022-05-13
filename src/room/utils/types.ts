export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
