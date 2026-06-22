# Prismic Content Model — blue-affiliate

Reference for the types and slices in the `blue-affiliate` Prismic repository and how each maps to the app. Models live in `customtypes/<id>/index.json` and `src/slices/<Name>/model.json`, managed with the `prismic` CLI (never hand-edited). Generated TS types are in `prismicio-types.d.ts`. App-side routing is defined in `src/prismicio.ts` (`prismic.config.json` `routes` is kept empty so page-format types don't scaffold duplicate Next routes).

## Slices

- **RichText** (`rich_text`) — one rich-text field `content` (paragraphs, h2–h4, bold/italic, links, images, embeds, lists). The body building block for blog posts.
- **FaqGroup** (`faq_group`) — one FAQ category. `primary`: `title` (Text), `description` (Text), `items` (repeatable Group of `question` Text + `answer` Rich Text).

---

## blog_post — page type, repeatable

Academy articles. `format: page`; the Next route `/academy/blog/:uid` is configured in `src/prismicio.ts`.

| Field | Type | Notes |
|---|---|---|
| `uid` | UID | Slug; used in the article URL. |
| `title` | Text | |
| `description` | Text | Excerpt; also the meta description. |
| `image` | Image | Card + hero image. (Renamed from `featured_image`.) |
| `category` | Content Relationship → `blog_category` | Fetches `name` inline (no `fetchLinks` needed). Shown as a badge. |
| `published_date` | Date | List ordered by this, descending. |
| `slices` | Slice Zone | Body content — `rich_text` slices. (Replaced the old single `body` field.) |
| SEO & Metadata | — | Default page tab; unused by the app. |

**Reading time** is no longer a stored field — it's computed from the body via `readingTimeMinutes()` in [utils.ts](../src/lib/utils.ts) (~200 wpm) and shown on the card and article.

Used by: [academy/page.tsx](../src/app/(dashboard)/academy/page.tsx) (list), [academy/blog/[uid]/page.tsx](../src/app/(dashboard)/academy/blog/[uid]/page.tsx) (detail — renders `slices` via `<SliceZone>`).

---

## blog_category — custom type, repeatable

| Field | Type | Notes |
|---|---|---|
| `uid` | UID | Labelled "Slug". |
| `name` | Text | Category name; surfaced on posts via the content relationship. |

---

## video_tutorial — custom type, repeatable

Academy video tutorials. Videos are uploaded to the Prismic media library and referenced via a media link.

| Field | Type | Notes |
|---|---|---|
| `title` | Text | |
| `description` | Text | |
| `video` | Link to Media | The uploaded video file. |

Rendering ([VideoTutorialCard.tsx](../src/components/VideoTutorialCard.tsx)): the card shows the **first video frame** as the thumbnail (a `<video>` with `preload="metadata"` + `#t=0.1`) with a play overlay; clicking opens a lightbox that plays the video with controls.

> **Caveat:** Prismic's Content API does **not** generate a poster/thumbnail for uploaded videos, so the thumbnail is the first frame rendered client-side. If you want a custom poster per video, we'd need to add a separate `thumbnail` Image field.

---

## marketing_material — custom type, repeatable

Downloadable marketing assets. (Replaced `marketing_banner`.)

| Field | Type | Notes |
|---|---|---|
| `uid` | UID | Auto-added on create; unused by the app (we `getAllByType`). Can be removed if you want it gone. |
| `title` | Text | Asset name. |
| `image` | Image | The asset; drives preview, lightbox, and download. File size is derived at runtime from the image's `Content-Length`. |

Used by: [marketing-material/page.tsx](../src/app/(dashboard)/marketing-material/page.tsx).

---

## faq — page type, singleton + `faq_group` slices

One `faq` document composed of `faq_group` slices (drag-to-reorder). Fetched with `getSingle("faq")` and rendered via `<SliceZone>` on [(dashboard)/faq/page.tsx](../src/app/(dashboard)/faq/page.tsx). See the Slices section above for the `faq_group` shape.
