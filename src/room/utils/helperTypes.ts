export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type ValueOf<T> = T[keyof T];

export type onFunctions<T> = {
  [K in keyof T as K extends `on${infer _}` ? K : never]: T[K];
};

// type Keys_StringExcluded<T> = {
//   [K in keyof T]: T[K] extends string ? never : K;
// }[keyof T];

// type FunctionKeys<T> = {
//   [K in keyof T]: T[K] extends () => void ? K : never;
// }[keyof T]; // <-

export type OptionalPropertyOf<T extends object> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K;
  }[keyof T],
  undefined
>;
