import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Pagepod API",
      version: "1.0.0",
      description:
        "Programmatic REST API for managing, deploying, and hosting single-page AI HTML artifacts, tools, and games on Pagepod.",
    },
    servers: [
      {
        url: siteUrl,
        description: "Current Deployment Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "PAT",
          description:
            "Personal Access Token generated in Pagepod console (`pp_live_...`).",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: {
      "/api/upload": {
        post: {
          summary: "Upload or publish an HTML artifact",
          description:
            "Deploy a single `.html` file or `.zip` bundle to Pagepod. The project will be automatically associated with the authenticated token owner.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file", "title", "slug"],
                  properties: {
                    file: {
                      type: "string",
                      format: "binary",
                      description: "The `.html` single page or multi-file `.zip` archive.",
                    },
                    title: {
                      type: "string",
                      example: "Interactive Particle Sandbox",
                      description: "Project title displayed on showcase.",
                    },
                    slug: {
                      type: "string",
                      example: "particle-sandbox",
                      description: "Unique URL slug for accessing the artifact at `/p/{slug}`.",
                    },
                    category: {
                      type: "string",
                      enum: ["tools", "games", "visualization", "prototypes", "animations", "others"],
                      default: "tools",
                    },
                    description: {
                      type: "string",
                      example: "Interactive physics gravity simulation with particles.",
                    },
                    visibility: {
                      type: "string",
                      enum: ["public", "private"],
                      default: "public",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Artifact successfully uploaded and published.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      project: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: "string" },
                          slug: { type: "string" },
                          runnerUrl: { type: "string", example: "https://html-manager-five.vercel.app/p/particle-sandbox" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized - missing or invalid Bearer token / session.",
            },
            "409": {
              description: "Conflict - slug is already taken by another artifact.",
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
