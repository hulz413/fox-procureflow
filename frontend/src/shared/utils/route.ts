export function routeParam(search: string, key: string) {
  return new URLSearchParams(search).get(key) ?? ''
}
