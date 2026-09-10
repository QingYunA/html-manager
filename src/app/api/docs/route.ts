import { ApiReference } from "@scalar/nextjs-api-reference";

export const GET = ApiReference({
  spec: {
    url: "/api/openapi.json",
  },
  theme: "moon",
  darkMode: true,
  layout: "modern",
  defaultHttpClient: {
    targetKey: "shell",
    clientKey: "curl",
  },
});
