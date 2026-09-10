"use client";

import React from "react";
import { Droplet, Power, Settings, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type FarmControlId = "motor" | "hv" | "hv_auto";

export type FarmControlState = Record<FarmControlId, boolean>;

type StatsBentoProps = {
  states?: FarmControlState;
  loading?: string | null;
  lastCommand?: string | null;
  onToggle?: (id: FarmControlId) => void;
};

const defaultStates: FarmControlState = {
  motor: false,
  hv: false,
  hv_auto: false,
};

export const StatsBento = ({
  states = defaultStates,
  loading = null,
  lastCommand = null,
  onToggle,
}: StatsBentoProps) => {
  const activeCount = Object.values(states).filter(Boolean).length;
  const motorBusy = loading === "motor:on" || loading === "motor:off";
  const hvBusy = loading === "hv:on" || loading === "hv:off";
  const autoBusy = loading === "hv_auto:on" || loading === "hv_auto:off";

  return (
    <section className="flex flex-col justify-center bg-background py-2">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
        {/* Primary Stat — Irrigation Motor */}
        <button
          type="button"
          disabled={motorBusy || !onToggle}
          onClick={() => onToggle?.("motor")}
          className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-primary p-10 text-left disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3 md:row-span-2"
        >
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 bg-[repeating-linear-gradient(45deg,#808080_0px_1px,transparent_1px_10px)] opacity-30 [mask-image:radial-gradient(ellipse_80%_50%_at_100%_0%,#000_70%,transparent_110%)]" />
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/60">
              <Droplet className="h-3.5 w-3.5" />
              Relay 1 · Pump
            </span>
            <h3 className="text-6xl tracking-tighter text-primary-foreground">
              {motorBusy ? "..." : states.motor ? "ON" : "OFF"}
            </h3>
            <p className="mt-3 text-xl font-medium text-primary-foreground">
              Irrigation Motor
            </p>
          </div>
          <p className="max-w-xs text-sm text-primary-foreground/60">
            {states.motor
              ? "Pump is running. Click to shut off irrigation."
              : "Control your farm equipment. Click to start the pump."}
          </p>
        </button>

        {/* Secondary Stat — HV Generator */}
        <button
          type="button"
          disabled={hvBusy || !onToggle}
          onClick={() => onToggle?.("hv")}
          className="flex items-center justify-between rounded-3xl border border-border bg-muted p-8 text-left disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
        >
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              Relay 2 · High Voltage
            </p>
            <p className="text-3xl text-foreground">
              {hvBusy ? "..." : states.hv ? "ON" : "OFF"}
            </p>
            <p className="mt-1 text-sm text-foreground">HV Generator</p>
          </div>
          <div className="flex h-8 items-end gap-1">
            {[10, 20, 40, 30, 60, 50, 80, 70, 90, 100, 110].map((h, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 rounded-full",
                  states.hv ? "bg-primary" : "bg-foreground"
                )}
                style={{ height: `${states.hv ? h : Math.max(12, h * 0.35)}%` }}
              />
            ))}
          </div>
        </button>

        {/* Tertiary Stat — devices on */}
        <div className="flex flex-col justify-center rounded-3xl border border-border bg-card p-6 text-center md:col-span-1">
          <p className="text-2xl text-foreground">{activeCount}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Active
          </p>
        </div>

        {/* Tertiary Stat — HV Auto Mode */}
        <button
          type="button"
          disabled={autoBusy || !onToggle}
          onClick={() => onToggle?.("hv_auto")}
          className="flex items-center gap-4 rounded-3xl bg-muted p-6 text-left disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-sm">
            {states.hv_auto ? (
              <Star className="h-5 w-5 fill-current" />
            ) : (
              <Settings className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-sm leading-none text-foreground">
              {autoBusy ? "..." : states.hv_auto ? "Auto ON" : "Auto OFF"}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              HV Auto Mode · Motion-triggered
            </p>
          </div>
          <Power
            className={cn(
              "ml-auto h-4 w-4 shrink-0",
              states.hv_auto ? "text-primary" : "text-muted-foreground"
            )}
          />
        </button>
      </div>

      {lastCommand && (
        <p
          className={cn(
            "mx-auto mt-4 max-w-7xl rounded-xl px-4 py-2 text-xs font-medium",
            lastCommand.includes("✅")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          )}
        >
          {lastCommand}
        </p>
      )}
    </section>
  );
};

export default StatsBento;
