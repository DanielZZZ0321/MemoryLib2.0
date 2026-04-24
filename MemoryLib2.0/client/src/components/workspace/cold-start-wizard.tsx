import { useMemo, useState } from "react";
import { CalendarRange, Check, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const indexOptions = [
  "Color",
  "Time",
  "People",
  "Emotion",
  "Event",
  "Workflow",
  "Custom",
] as const;

export const granularityOptions = ["hourly", "daily", "weekly", "monthly"] as const;

export type ColdStartConfig = {
  start_time: string;
  end_time: string;
  granularity: (typeof granularityOptions)[number];
  purpose: string;
  index: string[];
};

type Props = {
  initial?: Partial<ColdStartConfig>;
  saving?: boolean;
  onComplete: (config: ColdStartConfig) => void;
};

function today(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function normalizeInitial(initial?: Partial<ColdStartConfig>): ColdStartConfig {
  return {
    start_time: initial?.start_time ?? today(-30),
    end_time: initial?.end_time ?? today(),
    granularity: initial?.granularity ?? "daily",
    purpose: initial?.purpose ?? "",
    index: initial?.index?.length ? initial.index : ["Time", "People"],
  };
}

export function ColdStartWizard({ initial, saving, onComplete }: Props) {
  const normalized = useMemo(() => normalizeInitial(initial), [initial]);
  const [startTime, setStartTime] = useState(normalized.start_time);
  const [endTime, setEndTime] = useState(normalized.end_time);
  const [granularity, setGranularity] =
    useState<ColdStartConfig["granularity"]>(normalized.granularity);
  const [purpose, setPurpose] = useState(normalized.purpose);
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>(
    normalized.index,
  );

  const canSubmit =
    startTime.trim() !== "" &&
    endTime.trim() !== "" &&
    purpose.trim() !== "" &&
    selectedIndexes.length > 0;

  function toggleIndex(value: string) {
    setSelectedIndexes((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      return [...current, value];
    });
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="size-4" />
          Cold Start
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="coldStartStart">Start</Label>
            <Input
              id="coldStartStart"
              type="date"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coldStartEnd">End</Label>
            <Input
              id="coldStartEnd"
              type="date"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coldStartGranularity">Granularity</Label>
            <select
              id="coldStartGranularity"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={granularity}
              onChange={(event) =>
                setGranularity(event.target.value as ColdStartConfig["granularity"])
              }
            >
              {granularityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coldStartPurpose">Purpose</Label>
          <Input
            id="coldStartPurpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Review this period through people, events, and emotions"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tags className="size-4" />
            Primary and secondary indexes
          </Label>
          <div className="flex flex-wrap gap-2">
            {indexOptions.map((option) => {
              const active = selectedIndexes.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-md border px-3 text-sm transition",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                  onClick={() => toggleIndex(option)}
                >
                  {active ? <Check className="size-3" /> : null}
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          type="button"
          disabled={!canSubmit || saving}
          onClick={() =>
            onComplete({
              start_time: startTime,
              end_time: endTime,
              granularity,
              purpose: purpose.trim(),
              index: selectedIndexes,
            })
          }
        >
          {saving ? "Saving..." : "Enter Organization Panel"}
        </Button>
      </CardContent>
    </Card>
  );
}
