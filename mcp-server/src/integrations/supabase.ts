import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SecretsManager } from '../secrets.js';

export interface SupabaseQueryArgs {
  table: string;
  select?: string;
  filter?: Record<string, any>;
  limit?: number;
  orderBy?: { column: string; ascending?: boolean };
}

export interface SupabaseInsertArgs {
  table: string;
  data: Record<string, any> | Record<string, any>[];
}

export interface SupabaseUpdateArgs {
  table: string;
  data: Record<string, any>;
  filter: Record<string, any>;
}

export interface SupabaseDeleteArgs {
  table: string;
  filter: Record<string, any>;
}

export interface SupabaseRpcArgs {
  functionName: string;
  params?: Record<string, any>;
}

export class SupabaseIntegration {
  private client?: SupabaseClient;
  private secretsManager: SecretsManager;

  constructor(secretsManager: SecretsManager) {
    this.secretsManager = secretsManager;
  }

  async initialize(): Promise<boolean> {
    const config = this.secretsManager.getSupabaseConfig();
    if (!config?.url || !config?.anonKey) {
      return false;
    }

    this.client = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
      },
    });

    return true;
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async query(args: SupabaseQueryArgs): Promise<any> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    let query = this.client.from(args.table).select(args.select || '*');

    // Apply filters
    if (args.filter) {
      for (const [key, value] of Object.entries(args.filter)) {
        if (value === null) {
          query = query.is(key, null);
        } else if (typeof value === 'object' && value.operator) {
          // Support advanced operators like { operator: 'gte', value: 10 }
          switch (value.operator) {
            case 'eq':
              query = query.eq(key, value.value);
              break;
            case 'neq':
              query = query.neq(key, value.value);
              break;
            case 'gt':
              query = query.gt(key, value.value);
              break;
            case 'gte':
              query = query.gte(key, value.value);
              break;
            case 'lt':
              query = query.lt(key, value.value);
              break;
            case 'lte':
              query = query.lte(key, value.value);
              break;
            case 'like':
              query = query.like(key, value.value);
              break;
            case 'ilike':
              query = query.ilike(key, value.value);
              break;
            case 'in':
              query = query.in(key, value.value);
              break;
          }
        } else {
          query = query.eq(key, value);
        }
      }
    }

    // Apply ordering
    if (args.orderBy) {
      query = query.order(args.orderBy.column, { ascending: args.orderBy.ascending ?? true });
    }

    // Apply limit
    if (args.limit) {
      query = query.limit(args.limit);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return data;
  }

  async insert(args: SupabaseInsertArgs): Promise<any> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.client
      .from(args.table)
      .insert(args.data)
      .select();

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    return data;
  }

  async update(args: SupabaseUpdateArgs): Promise<any> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    let query = this.client.from(args.table).update(args.data);

    // Apply filters
    for (const [key, value] of Object.entries(args.filter)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query.select();
    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return data;
  }

  async delete(args: SupabaseDeleteArgs): Promise<any> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    let query = this.client.from(args.table).delete();

    // Apply filters
    for (const [key, value] of Object.entries(args.filter)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query.select();
    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return data;
  }

  async rpc(args: SupabaseRpcArgs): Promise<any> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.client.rpc(args.functionName, args.params);
    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`);
    }

    return data;
  }

  getTools() {
    return [
      {
        name: 'supabase_query',
        description: 'Query data from Supabase database',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to query',
            },
            select: {
              type: 'string',
              description: 'Columns to select (default: *)',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions as key-value pairs',
            },
            limit: {
              type: 'number',
              description: 'Limit number of results',
            },
            orderBy: {
              type: 'object',
              properties: {
                column: { type: 'string' },
                ascending: { type: 'boolean' },
              },
              description: 'Order results by column',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'supabase_insert',
        description: 'Insert data into Supabase database',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to insert into',
            },
            data: {
              type: ['object', 'array'],
              description: 'Data to insert (single object or array of objects)',
            },
          },
          required: ['table', 'data'],
        },
      },
      {
        name: 'supabase_update',
        description: 'Update data in Supabase database',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to update',
            },
            data: {
              type: 'object',
              description: 'Data to update',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions to identify rows to update',
            },
          },
          required: ['table', 'data', 'filter'],
        },
      },
      {
        name: 'supabase_delete',
        description: 'Delete data from Supabase database',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name to delete from',
            },
            filter: {
              type: 'object',
              description: 'Filter conditions to identify rows to delete',
            },
          },
          required: ['table', 'filter'],
        },
      },
      {
        name: 'supabase_rpc',
        description: 'Call a Supabase RPC function',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: {
              type: 'string',
              description: 'RPC function name',
            },
            params: {
              type: 'object',
              description: 'Parameters to pass to the function',
            },
          },
          required: ['functionName'],
        },
      },
    ];
  }
}