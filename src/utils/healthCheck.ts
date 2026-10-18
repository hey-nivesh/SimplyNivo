export interface SystemHealthCheckResults {
  backendReachable: boolean;
  geminiActive: boolean;
  supabaseConnected: boolean;
  latencyMs: number;
}

/**
 * Enterprise System Validation Checklist Utility.
 * Verifies Render backend status, Google Gemini API configuration, and Supabase connectivity.
 */
export const runSystemHealthCheck = async (
  backendUrl: string
): Promise<SystemHealthCheckResults> => {
  const results: SystemHealthCheckResults = {
    backendReachable: false,
    geminiActive: false,
    supabaseConnected: false,
    latencyMs: 0,
  };

  const startTime = Date.now();
  try {
    const cleanUrl = backendUrl.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/health`, { method: 'GET' });
    const data = (await res.json()) as {
      status?: string;
      services?: {
        geminiConfigured?: boolean;
        supabaseConfigured?: boolean;
      };
    };

    results.latencyMs = Date.now() - startTime;
    if (res.ok && data.status === 'healthy') {
      results.backendReachable = true;
      results.geminiActive = !!data.services?.geminiConfigured;
      results.supabaseConnected = !!data.services?.supabaseConfigured;
    }
  } catch (err) {
    console.warn('[runSystemHealthCheck] Backend healthcheck unavailable:', err);
  }

  return results;
};

export default runSystemHealthCheck;
