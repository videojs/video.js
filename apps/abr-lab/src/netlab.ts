/** Endpoints of the Docker network lab in `netlab/`. Media is addressed by its name on the lab network. */
export const LAB_BROWSER = process.env.ABR_LAB_BROWSER ?? 'ws://127.0.0.1:3100/abr-lab';
export const LAB_ORIGIN = 'https://origin:8443';
const LAB_CONTROL = process.env.ABR_LAB_CONTROL ?? 'http://127.0.0.1:8081';

export interface LinkConditions {
  /** Added round trip, applied to the origin's egress. */
  rttMs?: number;
  /** 0 is unlimited. */
  rateKbps?: number;
  /** Buffer behind the rate limit, as time at that rate. */
  queueMs?: number;
  lossPct?: number;
}

/** Sets netem on the lab origin; resolves once `tc` has applied it. */
export async function setLinkConditions(conditions: LinkConditions): Promise<Required<LinkConditions>> {
  const query = new URLSearchParams(Object.entries(conditions).map(([k, v]) => [k, String(v)]));
  const response = await fetch(`${LAB_CONTROL}/conditions?${query}`, { method: 'POST' });
  if (!response.ok) throw new Error(`Lab conditions failed: ${response.status} ${await response.text()}`);

  // SAFETY: the lab origin answers with its full merged conditions object.
  return response.json() as Promise<Required<LinkConditions>>;
}
