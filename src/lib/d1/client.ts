/**
 * Cloudflare D1 Database Client
 * Handles database connections and query execution
 */

// Types for D1 database operations
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// Database client - will be injected in Cloudflare Workers environment
let db: D1Database | null = null;

/**
 * Initialize the database client
 * This will be called from the Cloudflare Worker with the actual D1 binding
 */
export function initializeDB(database: D1Database) {
  db = database;
}

/**
 * Get the database client
 * For development, we'll use a mock or local SQLite
 */
export function getDB(): D1Database {
  if (!db) {
    // In development, we might want to use a local SQLite database
    // For now, throw an error to indicate proper setup is needed
    throw new Error('Database not initialized. Make sure to call initializeDB() first.');
  }
  return db;
}

/**
 * Execute a query with parameters
 */
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<D1Result<T>> {
  const database = getDB();
  const statement = database.prepare(query);
  
  if (params.length > 0) {
    return statement.bind(...params).all<T>();
  }
  
  return statement.all<T>();
}

/**
 * Execute a single query and return first result
 */
export async function executeQueryFirst<T = any>(
  query: string, 
  params: any[] = []
): Promise<T | null> {
  const database = getDB();
  const statement = database.prepare(query);
  
  if (params.length > 0) {
    return statement.bind(...params).first<T>();
  }
  
  return statement.first<T>();
}

/**
 * Execute a query that modifies data (INSERT, UPDATE, DELETE)
 */
export async function executeUpdate(
  query: string, 
  params: any[] = []
): Promise<D1Result> {
  const database = getDB();
  const statement = database.prepare(query);
  
  if (params.length > 0) {
    return statement.bind(...params).run();
  }
  
  return statement.run();
}

/**
 * Execute multiple queries in a transaction
 */
export async function executeTransaction(
  queries: { query: string; params?: any[] }[]
): Promise<D1Result[]> {
  const database = getDB();
  const statements = queries.map(({ query, params = [] }) => {
    const statement = database.prepare(query);
    return params.length > 0 ? statement.bind(...params) : statement;
  });
  
  return database.batch(statements);
}

/**
 * Generate a UUID-like ID for SQLite
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Parse JSON fields from SQLite TEXT columns
 */
export function parseJsonField<T>(field: string | null): T[] {
  if (!field) return [] as T[];
  try {
    return JSON.parse(field);
  } catch {
    return [] as T[];
  }
}

/**
 * Stringify arrays for SQLite TEXT columns
 */
export function stringifyJsonField<T>(array: T[]): string {
  return JSON.stringify(array || []);
}