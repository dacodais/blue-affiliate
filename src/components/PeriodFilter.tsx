"use client";

import Icon, { IconComponent } from "@/components/Icon";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const PRESETS = ["Last 3 months", "Year to date", "Last 12 months"];

function generatePeriods(): string[] {
  const periods: string[] = [...PRESETS];
  const now = new Date();

  for (let i = 0; i <= 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    periods.push(label);
  }

  return periods;
}

const periods = generatePeriods();

interface PeriodFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  inputClassName?: string;
}

export default function PeriodFilter({ value, onValueChange, inputClassName }: PeriodFilterProps) {
  return (
    <Combobox items={periods} value={value} onValueChange={(val) => onValueChange(val as string)}>
      <ComboboxInput
        placeholder="Select period"
        className={cn(`bg-white h-12.5 shadow-none border-[#E5E7EB] rounded-lg cursor-pointer`, inputClassName)}
        readOnly
      >
        <InputGroupAddon align="inline-start">
          <IconComponent icon="Calendar" className="text-foreground" />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>No periods found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item} className={PRESETS.includes(item) ? "font-medium" : ""}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
