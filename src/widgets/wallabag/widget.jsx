import { asJson } from "utils/proxy/api-helpers";
import wallabagProxyHandler from "./proxy";

const widget = {
  api: "{url}/{endpoint}",
  proxyHandler: wallabagProxyHandler,

  mappings: {
    entries: {
      endpoint: "api/entries",
      map: (data) => {
        return { total: asJson(data).total };
      },
    },
    tags: {
      endpoint: "api/tags",
      map: (data) => {
        return { total: data.length };
      },
    },
  },
};

export default widget;
