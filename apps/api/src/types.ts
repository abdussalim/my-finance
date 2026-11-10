export interface Env {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    ASSETS?: Fetcher;
  };
  Variables: {
    userId?: string;
  };
}
