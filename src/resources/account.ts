import type { HttpClient } from "../internal/http.js";
import type { AccountProfile, AccountUsage } from "../models.js";

export class AccountResource {
  constructor(private readonly http: HttpClient) {}

  async checkToken(): Promise<AccountProfile> {
    return await this.http.request<AccountProfile>("/api/v1/account");
  }

  async usage(): Promise<AccountUsage> {
    return await this.http.request<AccountUsage>("/api/v1/account/usage");
  }
}
