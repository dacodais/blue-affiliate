import * as prismic from "@prismicio/client";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { IconComponent } from "@/components/Icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading1 } from "@/components/ui/typography";
import VideoTutorialCard from "@/components/VideoTutorialCard";
import { formatDate, readingTimeMinutes } from "@/lib/utils";
import { createClient } from "@/prismicio";

export default async function AcademyPage() {
  const client = createClient();

  const [videoTutorials, blogPosts] = await Promise.all([
    client.getAllByType("video_tutorial").catch(() => []),
    client
      .getAllByType("blog_post", {
        orderings: [{ field: "my.blog_post.published_date", direction: "desc" }],
      })
      .catch(() => []),
  ]);

  return (
    <>
      <section>
        <div className="space-y-2 mb-10.25">
          <Heading1 className="text-2xl">Academy</Heading1>
          <p className="text-muted-foreground">
            Learn proven strategies and insights to boost your bookings through affiliate links.
          </p>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-3 flex items-center gap-x-2">
            <IconComponent icon="Play" className="text-primary" />
            <h2>Video Tutorials</h2>
          </div>

          {videoTutorials.map((video) => {
            const { title, description, video: media } = video.data;
            const videoUrl = prismic.asLink(media);
            if (!videoUrl) return null;

            return (
              <VideoTutorialCard
                key={video.id}
                title={title ?? ""}
                description={description ?? ""}
                videoUrl={videoUrl}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-x-2">
            <IconComponent icon="BookOpen" className="text-primary" />
            <h2>Blog Posts & Insights</h2>
          </div>

          {blogPosts.map((post) => {
            const { title, description, image, category, published_date, slices } = post.data;
            const categoryName =
              category && "data" in category && category.data ? (category.data as { name?: string }).name : null;
            const imageUrl = image.url ?? "";
            const readMinutes = readingTimeMinutes(
              slices.filter((s) => s.slice_type === "rich_text").map((s) => s.primary.content),
            );

            return (
              <Card key={post.id} className="gap-0 relative">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={title ?? ""}
                    width={image.dimensions?.width ?? 640}
                    height={image.dimensions?.height ?? 360}
                    className="hidden sm:block aspect-video w-full object-cover max-h-55"
                  />
                )}
                <CardHeader className="sm:pt-5 flex items-center gap-x-3 px-4 pt-4">
                  {categoryName && <Badge>{categoryName}</Badge>}
                  <div className="flex items-center gap-x-0.5 text-[#6A7282]">
                    <IconComponent icon="Clock" size="sm" />
                    <p className="text-sm">{readMinutes} min read</p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 pt-4 pb-0 px-4">
                  <CardTitle>{title}</CardTitle>
                  <p className="text-[#4A5565] text-sm line-clamp-3">{description}</p>
                </CardContent>
                <CardFooter className="pt-3 sm:pt-2 px-4">
                  {published_date && (
                    <p className="text-[#4A5565] md:text-[#6A7282] text-sm">{formatDate(dayjs(published_date))}</p>
                  )}
                </CardFooter>
                <Link href={`/academy/blog/${post.uid}`} className="absolute inset-0" />
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
