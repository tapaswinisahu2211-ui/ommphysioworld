import { useEffect } from "react";

const DEFAULT_TITLE = "Omm Physio World | Physiotherapy Clinic in Baripada";
const DEFAULT_DESCRIPTION =
  "Omm Physio World offers physiotherapy care in Baripada for pain relief, posture correction, rehabilitation, and guided recovery.";
const DEFAULT_IMAGE = "/logo512.png";
const ABSOLUTE_URL_KEYS = new Set(["url", "item", "image", "logo"]);

const normalizeSchemaUrls = (value, origin) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSchemaUrls(item, origin));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, currentValue]) => {
        if (
          ABSOLUTE_URL_KEYS.has(key) &&
          typeof currentValue === "string" &&
          currentValue.startsWith("/")
        ) {
          return [key, new URL(currentValue, origin).toString()];
        }

        return [key, normalizeSchemaUrls(currentValue, origin)];
      })
    );
  }

  return value;
};

const ensureMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
};

const ensureLink = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
};

export default function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  robots = "index, follow",
  schema,
}) {
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = new URL(path, origin).toString();
    const imageUrl = new URL(image, origin).toString();
    const fullTitle = title.includes("Omm Physio World")
      ? title
      : `${title} | Omm Physio World`;

    document.title = fullTitle;

    ensureMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: robots,
    });
    ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: fullTitle,
    });
    ensureMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: "Omm Physio World",
    });
    ensureMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: "en_IN",
    });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });
    ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });
    ensureMeta('meta[property="og:image"]', {
      property: "og:image",
      content: imageUrl,
    });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    ensureMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: fullTitle,
    });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    ensureMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: imageUrl,
    });
    ensureMeta('meta[name="twitter:image:alt"]', {
      name: "twitter:image:alt",
      content: fullTitle,
    });
    ensureLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });

    let schemaElement = document.head.querySelector('script[data-seo-schema="true"]');
      if (schema) {
        const normalizedSchema = normalizeSchemaUrls(schema, origin);
        if (!schemaElement) {
          schemaElement = document.createElement("script");
          schemaElement.type = "application/ld+json";
          schemaElement.setAttribute("data-seo-schema", "true");
          document.head.appendChild(schemaElement);
        }
        schemaElement.textContent = JSON.stringify(normalizedSchema);
      } else if (schemaElement) {
        schemaElement.remove();
      }
  }, [description, image, path, robots, schema, title, type]);

  return null;
}

