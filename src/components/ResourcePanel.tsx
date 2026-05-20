import { Ambulance, BatteryCharging, HeartPulse, Package, Users } from "lucide-react";
import { useCrisisStore } from "../store/useCrisisStore";
import type { ResourceType } from "../types/crisis";

const icons: Partial<Record<ResourceType, typeof Ambulance>> = {
  ambulance: Ambulance,
  medical: HeartPulse,
  supply: Package,
  volunteer: Users,
  food: Package,
  power: BatteryCharging,
};

export function ResourcePanel() {
  const { resources, facilities } = useCrisisStore();
  const available = resources.filter((resource) => resource.available).length;
  const grouped = resources.reduce<Record<string, number>>((acc, resource) => {
    acc[resource.type] = (acc[resource.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="rounded-lg border border-command-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">Resources</h2>
          <p className="text-xs text-zinc-500">
            {available}/{resources.length} units available
          </p>
        </div>
        <Ambulance className="h-5 w-5 text-blue-600" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(grouped).map(([type, count]) => {
          const Icon = icons[type as ResourceType] ?? Package;
          return (
            <div key={type} className="rounded border border-zinc-200 bg-zinc-50 p-2">
              <Icon className="mb-1 h-4 w-4 text-blue-700" />
              <span className="block text-xs capitalize text-zinc-500">{type}</span>
              <strong className="text-sm text-zinc-950">{count}</strong>
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-2">
        {facilities.map((facility) => (
          <div key={facility.id} className="flex items-center justify-between rounded border border-zinc-200 px-2 py-2 text-xs">
            <span className="min-w-0 truncate font-semibold text-zinc-700">{facility.name}</span>
            <span className={facility.offline ? "text-red-700" : "text-zinc-500"}>
              {facility.currentLoad}/{facility.capacity}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
