import type { HttpClient } from "../internal/http.js";
import type { QrRenderOptions } from "../models.js";

function buildQrSearchParams(options: QrRenderOptions): string {
  const params = new URLSearchParams();
  params.set("url", options.url);
  if (options.fgColor !== undefined) {
    params.set("fgColor", options.fgColor);
  }
  if (options.bgColor !== undefined) {
    params.set("bgColor", options.bgColor);
  }
  if (options.dotStyle !== undefined) {
    params.set("dotStyle", options.dotStyle);
  }
  if (options.markerStyle !== undefined) {
    params.set("markerStyle", options.markerStyle);
  }
  if (options.caption !== undefined) {
    params.set("caption", options.caption);
  }
  return params.toString();
}

export class QrResource {
  constructor(private readonly http: HttpClient) {}

  async getSvg(options: QrRenderOptions): Promise<string> {
    const params = buildQrSearchParams(options);
    return await this.http.requestText(`/api/v1/qr?${params}`, {
      headers: {
        Accept: "image/svg+xml",
      },
    });
  }

  getUrl(options: QrRenderOptions): string {
    const params = buildQrSearchParams(options);
    return `${this.http.baseUrl}/api/v1/qr?${params}`;
  }
}
