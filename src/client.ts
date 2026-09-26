import { type ClientOptions, HttpClient } from "./internal/http.js";
import { AccountResource } from "./resources/account.js";
import { AnalyticsResource } from "./resources/analytics.js";
import { DomainsResource } from "./resources/domains.js";
import { LinksResource } from "./resources/links.js";
import { QrResource } from "./resources/qr.js";
import { TagsResource } from "./resources/tags.js";
import { TokensResource } from "./resources/tokens.js";

export type { ClientOptions };

export class Linkto {
  readonly links: LinksResource;
  readonly analytics: AnalyticsResource;
  readonly domains: DomainsResource;
  readonly qr: QrResource;
  readonly tags: TagsResource;
  readonly account: AccountResource;
  readonly tokens: TokensResource;

  constructor(options: ClientOptions = {}) {
    const http = new HttpClient(options);
    this.links = new LinksResource(http);
    this.analytics = new AnalyticsResource(http);
    this.domains = new DomainsResource(http);
    this.qr = new QrResource(http);
    this.tags = new TagsResource(http);
    this.account = new AccountResource(http);
    this.tokens = new TokensResource(http);
  }
}

export default Linkto;
