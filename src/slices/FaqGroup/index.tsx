import type { Content } from "@prismicio/client";
import { PrismicRichText, type SliceComponentProps } from "@prismicio/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/**
 * Props for `FaqGroup`.
 */
export type FaqGroupProps = SliceComponentProps<Content.FaqGroupSlice>;

/**
 * One FAQ category: a collapsible card whose body holds an accordion of
 * question/answer items. Rendered for each `faq_group` slice on the FAQ page.
 */
const FaqGroup = ({ slice }: FaqGroupProps) => {
  const { title, description, items } = slice.primary;

  return (
    <Accordion>
      <AccordionItem value="group" className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
        <AccordionTrigger className="p-6 items-center hover:no-underline">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-[#0a0a0a]">{title}</span>
            {description && <span className="text-sm font-normal text-[#4a5565]">{description}</span>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="border-t border-[#e5e7eb] bg-[#f9fafb] px-6 pt-6 pb-6">
          <Accordion className="flex flex-col gap-3">
            {items.map((item, i) => (
              <AccordionItem
                key={`${item.question}-${i}`}
                value={String(i)}
                className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white"
              >
                <AccordionTrigger className="p-4 text-[15px] font-medium text-[#101828] hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-0 pb-4 text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-2 last:[&_p]:mb-0">
                  <PrismicRichText field={item.answer} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default FaqGroup;
