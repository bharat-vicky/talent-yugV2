import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import https from "node:https";
const blocked = new BlockList();
for (const [address, prefix] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",3]] as const) blocked.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList(); globalV6.addSubnet("2000::", 3, "ipv6");
for (const [address,prefix] of [["2001::",23],["2001:db8::",32],["2002::",16],["3fff::",20]] as const) blocked.addSubnet(address,prefix,"ipv6");
export function isPublicAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address,"ipv4") : family === 6 && globalV6.check(address,"ipv6") && !blocked.check(address,"ipv6");
}
export function webhookUrl(raw: string): URL {
  const url = new URL(raw);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || url.hash || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || !host.includes(".") && !isIP(host) || isIP(host) && !isPublicAddress(host)) throw new Error("Webhook must use a public HTTPS endpoint on port 443");
  return url;
}
export async function postWebhook(raw: string, body: string, headers: Record<string,string>) {
  const url = webhookUrl(raw), hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new Error("Webhook DNS resolves to a restricted address");
  const pinned = addresses[0];
  await new Promise<void>((resolve,reject) => {
    // Pin the validated DNS answer for this connection; never follow redirects.
    const req = https.request(url, { method: "POST", agent: false, headers: { ...headers, "Content-Length": String(Buffer.byteLength(body)) }, lookup: (_host,_options,callback) => callback(null,pinned.address,pinned.family) }, res => {
      let bytes = 0;
      res.on("data", chunk => { bytes += chunk.length; if (bytes > 16384) req.destroy(new Error("Webhook response too large")); });
      res.on("error",reject);
      res.on("end", () => res.statusCode && res.statusCode >= 200 && res.statusCode < 300 ? resolve() : reject(new Error(`Webhook returned ${res.statusCode}`)));
    });
    req.setTimeout(10000, () => req.destroy(new Error("Webhook timed out")));
    req.on("error",reject); req.end(body);
  });
}
