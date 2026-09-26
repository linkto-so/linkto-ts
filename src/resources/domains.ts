import type { HttpClient } from "../internal/http.js";
import type { DomainSummary } from "../models.js";

export class DomainsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<DomainSummary[]> {
    return await this.http.request<DomainSummary[]>("/api/v1/domains");
  }
}
