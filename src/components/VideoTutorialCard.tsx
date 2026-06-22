"use client";

import { useEffect, useState } from "react";
import { IconComponent } from "@/components/Icon";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface VideoTutorialCardProps {
  title: string;
  description: string;
  videoUrl: string;
}

export default function VideoTutorialCard({ title, description, videoUrl }: VideoTutorialCardProps) {
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setAnimateIn(true));
  }, [open]);

  function close() {
    setAnimateIn(false);
    setTimeout(() => setOpen(false), 200);
  }

  return (
    <>
      <Card className="gap-0 pt-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Play ${title}`}
          className="relative aspect-video w-full max-h-55 cursor-pointer"
        >
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 bg-primary rounded-full flex items-center justify-center z-10">
            <IconComponent icon="Play" className="fill-white text-white" />
          </span>
          {/* #t=0.1 nudges the browser to render the first frame as a poster */}
          <video
            src={`${videoUrl}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="aspect-video w-full object-cover max-h-55"
          />
        </button>
        <CardContent className="flex flex-col gap-2 pt-4 pb-4">
          <CardTitle>{title}</CardTitle>
          <p className="text-[#4A5565] text-sm line-clamp-2">{description}</p>
        </CardContent>
      </Card>

      {open && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${animateIn ? "bg-black/80" : "bg-black/0"}`}
          onClick={close}
          onKeyDown={(e) => e.key === "Escape" && close()}
          role="dialog"
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close video"
            className={`absolute top-4 right-4 text-white hover:text-white/80 transition-opacity duration-200 ${animateIn ? "opacity-100" : "opacity-0"}`}
          >
            <IconComponent icon="X" className="size-8" />
          </button>
          <video
            src={videoUrl}
            controls
            autoPlay
            className={`max-w-full max-h-[90vh] rounded-lg transition-all duration-200 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <track kind="captions" />
          </video>
        </div>
      )}
    </>
  );
}
