import type { HttpClient } from "../internal/http.js";

export class TagsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<string[]> {
    return await this.http.request<string[]>("/api/v1/tags");
  }
}
