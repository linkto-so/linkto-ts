import { type ClientOptions, Linkto } from "./client.js";

export const version = "0.1.0";
export const name = "@linkto-so/sdk";

export { Linkto, type ClientOptions };
export default Linkto;

export * from "./models.js";
export * from "./errors.js";
export * from "./resources/index.js";
