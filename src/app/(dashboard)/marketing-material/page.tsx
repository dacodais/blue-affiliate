import BannerCard from "@/components/BannerCard";
import { Card, CardContent } from "@/components/ui/card";
import { Heading1 } from "@/components/ui/typography";
import { formatBytes } from "@/lib/utils";
import { createClient } from "@/prismicio";

/** Reads the real download size from the image's Content-Length header. */
async function fetchImageSize(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "force-cache" });
    const length = res.headers.get("content-length");
    if (!length) return null;
    const size = formatBytes(Number.parseInt(length, 10));
    return size || null;
  } catch {
    return null;
  }
}

export default async function MarketingMaterialPage() {
  const client = createClient();
  const banners = await client.getAllByType("marketing_material").catch(() => []);

  const cards = (
    await Promise.all(
      banners.map(async (banner) => {
        const { title, image } = banner.data;
        const imageUrl = image.url ?? "";
        if (!imageUrl) return null;
        return {
          id: banner.id,
          title: title ?? "",
          imageUrl,
          dimensions: image.dimensions ? `${image.dimensions.width} × ${image.dimensions.height}` : "",
          fileSize: await fetchImageSize(imageUrl),
        };
      }),
    )
  ).filter((card) => card !== null);

  return (
    <>
      <section>
        <div className="space-y-2 mb-10.25">
          <Heading1 className="text-2xl">Marketing Material</Heading1>
          <p className="text-muted-foreground">
            Learn proven strategies and insights to boost your bookings through affiliate links.
          </p>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <BannerCard
              key={card.id}
              title={card.title}
              imageUrl={card.imageUrl}
              dimensions={card.dimensions}
              fileSize={card.fileSize}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <Card>
          <CardContent>
            <p className="font-bold text-foreground mb-5">How to Use Marketing Materials</p>
            <p className="text-muted-foreground mb-4">
              These banners are designed to help you promote BLUE car rentals effectively. You can use them on your
              website, blog, or social media channels.
            </p>
            <ul className="list-disc pl-12 space-y-2 text-muted-foreground mb-6">
              <li>Choose the appropriate size for your platform</li>
              <li>Download the banner by clicking the download button</li>
              <li>Upload to your website or social media</li>
              <li>Link the banner to your unique affiliate link</li>
              <li>Track your performance in the Dashboard</li>
            </ul>
            <p className="text-muted-foreground">
              <span className="font-bold">Need custom sizes or formats?</span> Contact our support team and we'll be
              happy to create custom materials for your needs.
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
