import type { Content } from "@prismicio/client";
import { PrismicRichText, type SliceComponentProps } from "@prismicio/react";

/**
 * Props for `RichText`.
 */
export type RichTextProps = SliceComponentProps<Content.RichTextSlice>;

/**
 * A block of rich text — the body content of a blog post.
 */
const RichText = ({ slice }: RichTextProps) => {
  return (
    <div className="prose prose-lg max-w-none">
      <PrismicRichText field={slice.primary.content} />
    </div>
  );
};

export default RichText;
