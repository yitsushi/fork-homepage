import { useTranslation } from "next-i18next";

import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

const defaultValue = NaN;

function getWidgetEntriesTotal(widget, field) {
  let parameters = {};

  switch (field) {
    case "unread":
      parameters.archive = 0;
      break;
    case "starred":
      parameters.starred = 1;
      break;
    case "archived":
      parameters.archive = 1;
      break;
  }

  const { data, error } = useWidgetAPI(widget, "entries", parameters);

  return {value: data?.total, error: error};
}

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;

  let data = {
    unread: defaultValue,
    archived: defaultValue,
    starred: defaultValue,
    tags: defaultValue,
  };

  for (let field of ["unread", "archived", "starred"]) {
    if (widget.fields && !widget.fields.includes(field)) {
      continue
    }

    const { value, error } = getWidgetEntriesTotal(widget, field);
    if (error) {
      return <Container service={service} error={error} />;
    }

    data[field] = value;
  }

  if (!widget.fields || widget.fields.includes("tags")) {
    const { data: tagsData, error: tagsError } = useWidgetAPI(widget, "tags");
    if (tagsError) {
      return <Container service={service} error={tagsError} />;
    }

    data['tags'] = tagsData?.total;
  }

  return (
    <Container service={service}>
      <Block label="wallabag.unread" value={t("common.number", { value: data.unread })} />
      <Block label="wallabag.archived" value={t("common.number", { value: data.archived })} />
      <Block label="wallabag.starred" value={t("common.number", { value: data.starred })} />
      <Block label="wallabag.tags" value={t("common.number", { value: data.tags })} />
    </Container>
  );
}
