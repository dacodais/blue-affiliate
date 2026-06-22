import * as prismic from "@prismicio/client";
import { enableAutoPreviews } from "@prismicio/next";
import config from "../prismic.config.json";

export const repositoryName = process.env.NEXT_PUBLIC_PRISMIC_ENVIRONMENT ?? config.repositoryName;

const routes: prismic.ClientConfig["routes"] = [{ type: "blog_post", path: "/academy/blog/:uid" }];

export const createClient = (clientConfig: prismic.ClientConfig = {}) => {
  const client = prismic.createClient(repositoryName, {
    routes,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    fetchOptions:
      process.env.NODE_ENV === "production"
        ? { next: { tags: ["prismic"] }, cache: "force-cache" }
        : { next: { revalidate: 5 } },
    ...clientConfig,
  });

  enableAutoPreviews({ client });

  return client;
};
