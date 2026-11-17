"use client";

import { useMemo, useState } from "react";
import CopyButton from "./CopyButton";
import { Input } from "./ui/input";

function buildCustomizedLink(
  baseLink: string,
  params: { source: string; medium: string; campaign: string; subId: string },
) {
  try {
    const url = new URL(baseLink);
    if (params.source) url.searchParams.set("utm_source", params.source);
    if (params.medium) url.searchParams.set("utm_medium", params.medium);
    if (params.campaign) url.searchParams.set("utm_campaign", params.campaign);
    if (params.subId) url.searchParams.set("sub_id", params.subId);
    return url.toString();
  } catch {
    return baseLink;
  }
}

export default function LinkCustomizer({ baseLink }: { baseLink: string }) {
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [subId, setSubId] = useState("");

  const customized = useMemo(
    () => buildCustomizedLink(baseLink, { source, medium, campaign, subId }),
    [baseLink, source, medium, campaign, subId],
  );

  const fields: { label: string; placeholder: string; value: string; onChange: (v: string) => void }[] = [
    { label: "Source", placeholder: "e.g., facebook", value: source, onChange: setSource },
    { label: "Medium", placeholder: "e.g., social", value: medium, onChange: setMedium },
    { label: "Campaign", placeholder: "e.g., summer2026", value: campaign, onChange: setCampaign },
    { label: "Sub-ID / Tracking Tag", placeholder: "e.g., blog_post_1", value: subId, onChange: setSubId },
  ];

  return (
    <div className="border border-light-gray rounded-2xl p-8 flex flex-col gap-4">
      <h2 className="text-xl font-medium">Link Customizer</h2>

      <div className="flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#6a7282]">{f.label}</label>
            <Input
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder={f.placeholder}
              className="h-[39px] rounded-lg border-light-gray text-sm placeholder:text-foreground/50"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#6a7282]">Preview</label>
        <div className="flex items-center gap-2 min-h-14 px-3 py-3 rounded-lg bg-light-gray/20">
          <span className="flex-1 min-w-0 break-all text-xs">{customized.replace(/^https?:\/\//, "")}</span>
          <CopyButton value={customized} />
        </div>
      </div>
    </div>
  );
}
