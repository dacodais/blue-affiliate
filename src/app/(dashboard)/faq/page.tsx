import { SliceZone } from "@prismicio/react";
import { Heading1 } from "@/components/ui/typography";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/prismicio";
import { components } from "@/slices";
import CommissionRateCard from "./CommissionRateCard";

export default async function FaqPage() {
  const client = createClient();
  const faq = await client.getSingle("faq").catch(() => null);
  const slices = faq?.data.slices ?? [];

  return (
    <div>
      <section>
        <div className="space-y-2">
          <Heading1 className="text-2xl">Help & Information</Heading1>
          <p className="text-muted-foreground">
            Everything you need to know about the Blue Car Rental affiliate program
          </p>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <CommissionRateCard />

        <div className="flex flex-col gap-3 rounded-lg border border-primary bg-[#101828] p-5 text-white">
          <p className="text-sm font-bold">Payment Schedule</p>
          <p className="text-xl">1st & 15th</p>
          <p className="text-xs">Twice monthly processing</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[#bedbff] bg-[#bedbff] p-5 text-[#101828]">
          <p className="text-sm font-bold">Min. Payout</p>
          <p className="text-xl">{formatPrice(50000)}</p>
          <p className="text-xs">Minimum threshold</p>
        </div>
      </section>

      {slices.length > 0 && (
        <section className="mt-8 flex flex-col gap-4">
          <SliceZone slices={slices} components={components} />
        </section>
      )}

      <section className="mt-8 rounded-lg bg-linear-to-b md:bg-linear-to-r from-secondary to-[#f54900] p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xl font-bold text-white">Still have questions?</p>
            <p className="text-secondary-muted">
              Our support team is here to help you succeed as an affiliate partner.
            </p>
          </div>
          <a
            href="mailto:affiliates@bluecarrental.is"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-white text-secondary font-medium whitespace-nowrap"
          >
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}
