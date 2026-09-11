"use client";

import { useState } from "react";
import { Fuel, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FuelType, PriceReportPayload } from "@/types";

type PriceUpdateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  airportIcao: string;
  airportName?: string;
  defaultFuelType?: FuelType;
  onSubmitted?: () => void;
};

export function PriceUpdateModal({
  open,
  onOpenChange,
  airportIcao,
  airportName,
  defaultFuelType = "100LL",
  onSubmitted,
}: PriceUpdateModalProps) {
  const [fuelType, setFuelType] = useState<FuelType>(defaultFuelType);
  const [price, setPrice] = useState("");
  const [isSelfServe, setIsSelfServe] = useState(true);
  const [fboName, setFboName] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const reportedPrice = Number.parseFloat(price);
    if (!Number.isFinite(reportedPrice) || reportedPrice <= 0) {
      setStatus("err");
      setMessage("Enter a valid price per gallon.");
      return;
    }

    const payload: PriceReportPayload = {
      airportIcao,
      fuelType,
      reportedPrice,
      isSelfServe,
      notes: notes.trim() || undefined,
      fboName: fboName.trim() || undefined,
    };

    setStatus("loading");
    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string; success?: boolean };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.message ?? "Submission failed.");
        return;
      }
      setStatus("ok");
      setMessage(data.message ?? "Thanks — price update recorded.");
      onSubmitted?.();
    } catch {
      setStatus("err");
      setMessage("Network error. Try again.");
    }
  }

  function resetOnClose(next: boolean) {
    if (!next) {
      setStatus("idle");
      setMessage("");
      setPrice("");
      setNotes("");
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={resetOnClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-amber-400" />
            Crowdsource Fuel Price
          </DialogTitle>
          <DialogDescription>
            Update the posted price at{" "}
            <span className="font-mono text-sky-300">{airportIcao}</span>
            {airportName ? ` · ${airportName}` : ""}. Helps other GA pilots.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Fuel type</Label>
            <div className="flex gap-2">
              {(["100LL", "Jet-A"] as FuelType[]).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={fuelType === t ? "default" : "outline"}
                  onClick={() => setFuelType(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="price">Price per gallon ($)</Label>
            <Input
              id="price"
              inputMode="decimal"
              placeholder="5.89"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Service</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={isSelfServe ? "default" : "outline"}
                onClick={() => setIsSelfServe(true)}
              >
                Self-Serve
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!isSelfServe ? "default" : "outline"}
                onClick={() => setIsSelfServe(false)}
              >
                Full-Serve
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fbo">FBO name (optional)</Label>
            <Input
              id="fbo"
              placeholder="Atlantic Aviation"
              value={fboName}
              onChange={(e) => setFboName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="Cash discount, truck out of service…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {message && (
            <p
              className={
                status === "err"
                  ? "text-sm text-red-400"
                  : "text-sm text-emerald-400"
              }
            >
              {message}
            </p>
          )}

          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit update"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
