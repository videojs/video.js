/**
 * Serialize embed options into a query string. Booleans become `1`/`0`, which is how both the YouTube and Vimeo embeds
 * spell them, and nullish values are dropped so an unset option is absent rather than the string `"undefined"`.
 *
 * @internal
 */
export function serializeEmbedParams(props: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const key in props) {
    const val = props[key];

    if (val === true || val === '') params.set(key, '1');
    else if (val === false) params.set(key, '0');
    else if (val != null) params.set(key, String(val));
  }

  return params.toString();
}
