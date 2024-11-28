import wallabagProxyHandler from "./proxy";

import { asJson } from "utils/proxy/api-helpers";

const widget = {
  api: "{url}/{endpoint}",
  proxyHandler: wallabagProxyHandler,

  mappings: {
    entries: {
      endpoint: "api/entries",
      map: (data) => ({
        total: asJson(data).total,
      }),
    },
    tags: {
      endpoint: "api/tags",
      map: (data) => ({
        total: data.length,
      }),
    },
  },
};

export default widget;
