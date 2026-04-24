import { useEffect, useState } from "react";
import { RotateCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  type ColdStartConfig,
  granularityOptions,
  indexOptions,
} from "@/components/workspace/cold-start-wizard";

export type OrganizationToolbarConfig = {
  primaryElement: string;
  secondaryElement: string;
  timePeriod: ColdStartConfig["granularity"];
  classificationFineness: string;
  memoryDisplayCount: number;
  keywordsEnabled: boolean;
};

type Props = {
  initial?: Partial<OrganizationToolbarConfig>;
  saving?: boolean;
  onRenew: (config: OrganizationToolbarConfig) => void;
};

function normalizeInitial(
  initial?: Partial<OrganizationToolbarConfig>,
): OrganizationToolbarConfig {
  return {
    primaryElement: initial?.primaryElement ?? "Time",
    secondaryElement: initial?.secondaryElement ?? "People",
    timePeriod: initial?.timePeriod ?? "daily",
    classificationFineness: initial?.classificationFineness ?? "medium",
    memoryDisplayCount: initial?.memoryDisplayCount ?? 24,
    keywordsEnabled: initial?.keywordsEnabled ?? true,
  };
}

export function OrganizationToolbar({ initial, saving, onRenew }: Props) {
  const [draft, setDraft] = useState<OrganizationToolbarConfig>(() =>
    normalizeInitial(initial),
  );

  useEffect(() => {
    setDraft(normalizeInitial(initial));
  }, [initial]);

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-36 space-y-1">
          <Label htmlFor="primaryElement">Primary Element</Label>
          <select
            id="primaryElement"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft.primaryElement}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                primaryElement: event.target.value,
              }))
            }
          >
            {indexOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-36 space-y-1">
          <Label htmlFor="secondaryElement">Secondary Element</Label>
          <select
            id="secondaryElement"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft.secondaryElement}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                secondaryElement: event.target.value,
              }))
            }
          >
            <option value="default">default</option>
            {indexOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-32 space-y-1">
          <Label htmlFor="timePeriod">Time Period</Label>
          <select
            id="timePeriod"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft.timePeriod}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                timePeriod: event.target.value as ColdStartConfig["granularity"],
              }))
            }
          >
            {granularityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-32 space-y-1">
          <Label htmlFor="classificationFineness">
            <SlidersHorizontal className="mr-1 inline size-3" />
            Setting
          </Label>
          <select
            id="classificationFineness"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft.classificationFineness}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                classificationFineness: event.target.value,
              }))
            }
          >
            <option value="coarse">coarse</option>
            <option value="medium">medium</option>
            <option value="fine">fine</option>
          </select>
        </div>

        <div className="min-w-28 space-y-1">
          <Label htmlFor="memoryDisplayCount">Count</Label>
          <input
            id="memoryDisplayCount"
            type="number"
            min={3}
            max={99}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={draft.memoryDisplayCount}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                memoryDisplayCount: Number(event.target.value),
              }))
            }
          />
        </div>

        <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
          <input
            type="checkbox"
            checked={draft.keywordsEnabled}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                keywordsEnabled: event.target.checked,
              }))
            }
          />
          Key Words
        </label>

        <Button
          type="button"
          variant="secondary"
          onClick={() => onRenew(draft)}
          disabled={saving}
        >
          <RotateCw className="size-4" />
          {saving ? "Renewing..." : "Renew"}
        </Button>
      </div>
    </div>
  );
}
