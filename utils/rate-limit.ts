import { createClient } from './supabase/server';
import { cookies } from 'next/headers';

export async function checkRateLimit(ipAddress: string, route: string, limit: number, windowSeconds: number) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip_address: ipAddress,
      p_route: route,
      p_limit: limit,
      p_window_seconds: windowSeconds
    });

    if (error) {
      console.error('Rate limit RPC error:', error);
      // Fail open if the RPC fails so we don't break the site
      return { allowed: true, remaining: limit };
    }

    return data as { allowed: boolean, remaining: number, reset_time?: string };
  } catch (error) {
    console.error('Rate limit exception:', error);
    return { allowed: true, remaining: limit };
  }
}

export function getIpAddress(request: Request) {
  // Try to get IP from Cloudflare, Vercel, or standard forwarded headers
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');

  if (cfConnectingIp) return cfConnectingIp;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  if (xRealIp) return xRealIp;
  
  return 'unknown-ip';
}
