"use client";

import { useState, useEffect, useRef } from "react";
import usePlacesAutocomplete from "use-places-autocomplete";
import { MapPin, Store, CheckCircle2, Loader2, Search, Link as LinkIcon } from "lucide-react";

function AutocompleteWithHook({
  namaToko,
  onChangeNamaToko,
  linkMaps,
  onChangeLinkMaps,
}) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "id" },
    },
    debounce: 300,
    defaultValue: namaToko || "",
  });

  const [open, setOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showManualLink, setShowManualLink] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (namaToko && namaToko !== value) {
      setValue(namaToko, false);
    }
  }, [namaToko]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInput(e) {
    const val = e.target.value;
    setValue(val);
    onChangeNamaToko(val);
    setSelectedPlace(null);
    setOpen(true);
  }

  function handleSelect(prediction) {
    const { place_id, structured_formatting, description } = prediction;
    const name = structured_formatting?.main_text || description;

    setValue(name, false);
    clearSuggestions();
    setOpen(false);

    const reviewUrl = `https://search.google.com/local/writereview?placeid=${place_id}`;

    setSelectedPlace(prediction);
    onChangeNamaToko(name);
    onChangeLinkMaps(reviewUrl);
  }

  return (
    <div ref={wrapperRef} className="space-y-3 relative">
      <div>
        <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
          <span>Nama Toko / Usaha</span>
          {selectedPlace && (
            <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Google Place Terpilih
            </span>
          )}
        </label>
        <div className="relative mt-1">
          <input
            className="input-field pr-10"
            placeholder="Cari nama toko Anda di Google Maps…"
            value={value}
            onChange={handleInput}
            onFocus={() => {
              if (data.length > 0) setOpen(true);
            }}
            disabled={!ready}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {!ready ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Suggestions dari use-places-autocomplete */}
      {open && status === "OK" && data.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
          {data.map((prediction) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text },
            } = prediction;

            return (
              <button
                key={place_id}
                type="button"
                onClick={() => handleSelect(prediction)}
                className="w-full text-left p-3 hover:bg-emerald-50/60 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-2.5"
              >
                <div className="mt-0.5 h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {main_text}
                  </p>
                  {secondary_text && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{secondary_text}</span>
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Manual Link Editor */}
      <div>
        <button
          type="button"
          onClick={() => setShowManualLink(!showManualLink)}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {showManualLink
            ? "Sembunyikan Link Google Maps"
            : linkMaps
            ? "Lihat / Edit Link Google Maps"
            : "Isi link Google Maps manual"}
        </button>

        {showManualLink && (
          <div className="mt-2 animate-fade-in">
            <input
              className="input-field text-xs font-mono"
              placeholder="https://maps.app.goo.gl/..."
              value={linkMaps}
              onChange={(e) => onChangeLinkMaps(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Otomatis terisi saat memilih toko dari pencarian di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoreSearchInput(props) {
  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    const timer = setInterval(() => {
      if (typeof window !== "undefined" && window.google?.maps?.places) {
        setGoogleLoaded(true);
        clearInterval(timer);
      }
    }, 300);

    return () => clearInterval(timer);
  }, []);

  if (!googleLoaded) {
    // Fallback tampilan input biasa ketika script Google Places sedang memuat / belum dikonfigurasi
    return (
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Nama Toko / Usaha</label>
          <input
            className="input-field mt-1"
            placeholder="Contoh: Kopi Senja Kediri"
            value={props.namaToko || ""}
            onChange={(e) => props.onChangeNamaToko(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Link Google Maps Toko</label>
          <input
            className="input-field mt-1 text-xs font-mono"
            placeholder="Tempel link dari Google Maps (atau ketik nama toko di atas)"
            value={props.linkMaps || ""}
            onChange={(e) => props.onChangeLinkMaps(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return <AutocompleteWithHook {...props} />;
}
