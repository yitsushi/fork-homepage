import cache from "memory-cache";

import { httpProxy } from "utils/proxy/http";
import { formatApiCall } from "utils/proxy/api-helpers";
import getServiceWidget from "utils/config/service-helpers";
import createLogger from "utils/logger";
import widgets from "widgets/widgets";

const proxyName = "wallabagProxyHandler";
const sessionTokenCacheKey = `${proxyName}__sessionToken`;
const logger = createLogger(proxyName);

async function login(widget, service) {
  const endpoint = "oauth/v2/token";
  const api = widgets?.[widget.type]?.api;
  const requestUrl = new URL(formatApiCall(api, { endpoint, ...widget }));
  const requestBody = {
    grant_type: "password",
    client_id: widget.client_id,
    client_secret: widget.client_secret,
    username: widget.username,
    password: widget.password,
  };
  const requestHeaders = {
    "Content-Type": "application/json",
    accept: "application/json",
  };

  const [, , data] = await httpProxy(requestUrl, {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: requestHeaders,
  });

  try {
    const { access_token: accessToken } = JSON.parse(data.toString());

    cache.put(`${sessionTokenCacheKey}.${service}`, accessToken);

    return { accessToken };
  } catch (e) {
    logger.error("Unable to login to Wallabag API: %s", e);
  }
}

async function apiCall(widget, endpoint, service, terminateOnFailure = false) {
  const cacheKey = `${sessionTokenCacheKey}.${service}`;
  const headers = {
    "content-type": "application/json",
    Authorization: `Bearer ${cache.get(cacheKey)}`,
  };

  const url = new URL(formatApiCall(widgets[widget.type].api, { endpoint, ...widget }));
  const method = "GET";

  let [status, contentType, data, responseHeaders] = await httpProxy(url, {
    method,
    headers,
  });

  if (status === 401 || status === 403) {
    if (terminateOnFailure) {
      return { status, contentType, data: JSON.parse(data.toString()), responseHeaders };
    }

    logger.debug("Wallabag API rejected the request, attempting to obtain new session token");
    await login(widget, service);

    return apiCall(widget, endpoint, service, true);
  }

  return { status, contentType, data: JSON.parse(data.toString()), responseHeaders };
}

export default async function wallabagProxyHandler(req, res, mapping) {
  const { group, service, index, endpoint, query: parameters } = req.query;

  if (!group || !service) {
    logger.debug("Invalid or missing service '%s' or group '%s'", service, group);

    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  const widget = await getServiceWidget(group, service, index);
  if (!widget) {
    logger.debug("Invalid or missing widget for service '%s' in group '%s'", service, group);
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  if (widget.type != "wallabag") {
    logger.debug("Invalid widget for service '%s' in group '%s'", service, group);
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  if (!cache.get(`${sessionTokenCacheKey}.${service}`)) {
    await login(widget, service);
  }

  const endpointParams = new URLSearchParams(JSON.parse(parameters ? parameters : "{}"));

  const { status, data } = await apiCall(widget, endpoint + "?" + endpointParams.toString(), service);

  if (status != 200) {
    return res.status(status).json({ error: data.error_description });
  }

  return res.status(status).send(mapping(data));
};
