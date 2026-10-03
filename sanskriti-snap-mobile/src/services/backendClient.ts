import { apiRequest } from './api';

export type Database = {
  public: {
    Views: { leaderboard: { Row: Record<string, any> } };
    Tables: { artifacts: { Row: Record<string, any> } };
  };
};

type Query = {
  table: string;
  filters: Record<string, string>;
  method?: string;
  body?: unknown;
};

const endpointFor = (table: string) => {
  const endpoints: Record<string, string> = {
    profiles: '/me',
    artifacts: '/artifacts/search',
    quests: '/quests',
    badges: '/badges',
    leaderboard: '/leaderboard',
    redemptions: '/rewards/redemptions',
    discoveries: '/discoveries',
  };
  return endpoints[table] ?? `/${table}`;
};

function queryBuilder(query: Query): any {
  const builder: any = {
    select: () => builder,
    order: () => builder,
    eq: (key: string, value: unknown) => {
      query.filters[key] = String(value);
      return builder;
    },
    neq: () => builder,
    in: () => builder,
    update: (body: unknown) => {
      query.method = 'PATCH';
      query.body = body;
      return builder;
    },
    insert: (body: unknown) => {
      query.method = 'POST';
      query.body = body;
      return builder;
    },
    maybeSingle: () => builder,
    single: () => builder,
    then: (resolve: (value: unknown) => void, reject?: (error: unknown) => void) =>
      apiRequest(endpointFor(query.table), {
        method: query.method ?? 'GET',
        body: query.body ? JSON.stringify(query.body) : undefined,
      })
        .then((data) => resolve({ data, error: null }))
        .catch((error) => {
          if (reject) reject(error);
          else resolve({ data: null, error });
        }),
  };
  return builder;
}

export const backendClient = {
  from: (table: string) => queryBuilder({ table, filters: {} }),
  rpc: async (name: string, args?: Record<string, unknown>) => {
    if (name === 'nearby_artifacts') {
      const data = await apiRequest('/artifacts/nearby', {
        method: 'GET',
      });
      return { data, error: null };
    }
    if (name === 'redeem_reward') {
      const data = await apiRequest(`/rewards/${String(args?.p_reward_id)}/redeem`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      return { data, error: null };
    }
    return { data: null, error: new Error(`Unsupported backend operation: ${name}`) };
  },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: new Error('Use the media signing API for uploads.') }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};
