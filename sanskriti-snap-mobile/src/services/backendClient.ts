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
  single?: boolean;
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
    not: () => builder,
    in: () => builder,
    limit: () => builder,
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
    maybeSingle: () => {
      query.single = true;
      return builder;
    },
    single: () => {
      query.single = true;
      return builder;
    },
    then: (resolve: (value: unknown) => void, reject?: (error: unknown) => void) =>
      apiRequest(endpointFor(query.table), {
        method: query.method ?? 'GET',
        body: query.body ? JSON.stringify(query.body) : undefined,
      })
        .then((data) => {
          const normalized =
            query.table === 'artifacts' && !Array.isArray(data)
              ? (data as { artifacts?: unknown[] }).artifacts ?? data
              : data;
          resolve({
            data: query.single && Array.isArray(normalized) ? normalized[0] : normalized,
            error: null,
          });
        })
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
      const response = await apiRequest<{ artifacts?: unknown[] } | unknown[]>(
        '/artifacts/nearby',
        {
        method: 'GET',
        },
      );
      const data = Array.isArray(response) ? response : response.artifacts ?? [];
      return { data, error: null };
    }
    if (name === 'redeem_reward') {
      const data = await apiRequest(`/rewards/${String(args?.p_reward_id)}/redeem`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      return { data, error: null };
    }
    return {
      data: null,
      error: new Error(`Unsupported backend operation: ${name}`),
    };
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
