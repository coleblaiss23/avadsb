"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeIcao } from "@/lib/utils";
import type { AirportSearchHit } from "@/types";

type AirportAutocompleteProps = {
  id: string;
  label: string;
  value: string;
  onChange: (icao: string) => void;
  placeholder?: string;
};

export function AirportAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder = "KAPA or APA",
}: AirportAutocompleteProps) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [hits, setHits] = useState<AirportSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [valid, setValid] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      setHint(null);
      setValid(false);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/airports/search?q=${encodeURIComponent(q)}&limit=8`,
          { signal: ctrl.signal }
        );
        const data = (await res.json()) as { results: AirportSearchHit[] };
        setHits(data.results);
        const exact = data.results.find(
          (r) =>
            r.icao === q.toUpperCase() ||
            r.faa === q.toUpperCase() ||
            (q.length === 3 && r.icao === `K${q.toUpperCase()}`)
        );
        if (exact) {
          setHint(`${exact.name} — ${exact.city}, ${exact.state}`);
          setValid(true);
        } else if (q.length >= 3 && data.results.length === 0) {
          setHint("No match in US airport database");
          setValid(false);
        } else {
          setHint(null);
          setValid(false);
        }
      } catch {
        /* aborted */
      }
    }, 160);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function selectHit(hit: AirportSearchHit) {
    onChange(hit.icao);
    setQuery(hit.icao);
    setHint(`${hit.name} — ${hit.city}, ${hit.state}`);
    setValid(true);
    setOpen(false);
  }

  return (
    <div className="relative space-y-1.5" ref={wrapRef}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        spellCheck={false}
        className="font-avionics uppercase"
        maxLength={4}
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const next = normalizeIcao(e.target.value);
          setQuery(next);
          onChange(next);
          setOpen(true);
        }}
        required
      />
      {hint && (
        <p
          className={`truncate text-[11px] ${valid ? "text-accent" : "text-ifr"}`}
          title={hint}
        >
          {hint}
        </p>
      )}
      {open && hits.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-sm border border-[var(--ink-border)] bg-[var(--ink-elevated)] py-1 shadow-lg"
        >
          {hits.map((hit) => (
            <li key={`${hit.icao}-${hit.faa}`}>
              <button
                type="button"
                role="option"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[#1a2028]"
                onClick={() => selectHit(hit)}
              >
                <span className="font-avionics text-sm font-semibold text-[var(--ink-text)]">
                  {hit.icao}
                  {hit.faa && hit.faa !== hit.icao ? (
                    <span className="text-[var(--ink-muted)]"> / {hit.faa}</span>
                  ) : null}
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  {hit.name} — {hit.city}, {hit.state}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
