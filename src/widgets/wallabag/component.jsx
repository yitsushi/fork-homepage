import { useTranslation } from "next-i18next";

import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

const defaultValue = NaN;

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;

  const data = {
    unread: defaultValue,
    archived: defaultValue,
    starred: defaultValue,
    tags: defaultValue,
  };

  const { data: unreadData, error: unreadError } = useWidgetAPI(widget, "entries", {archive: 0});
  const { data: archivedData, error: archivedError } = useWidgetAPI(widget, "entries", {archive: 1});
  const { data: starredData, error: starredError } = useWidgetAPI(widget, "entries", {starred: 1});
  const { data: tagsData, error: tagsError } = useWidgetAPI(widget, "tags");

  if (unreadError) {
    return <Container service={service} error={unreadError} />;
  }

  if (archivedError) {
    return <Container service={service} error={archivedError} />;
  }

  if (starredError) {
    return <Container service={service} error={starredError} />;
  }

  if (tagsError) {
    return <Container service={service} error={tagsError} />;
  }

  data.unread = unreadData?.total;
  data.archived = archivedData?.total;
  data.starred = starredData?.total;
  data.tags = tagsData?.total;

  return (
    <Container service={service}>
      <Block label="wallabag.unread" value={t("common.number", { value: data.unread })} />
      <Block label="wallabag.archived" value={t("common.number", { value: data.archived })} />
      <Block label="wallabag.starred" value={t("common.number", { value: data.starred })} />
      <Block label="wallabag.tags" value={t("common.number", { value: data.tags })} />
    </Container>
  );
}
