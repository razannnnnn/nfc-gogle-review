"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Store, CheckCircle2, Loader2, Search, Link as LinkIcon } from "lucide-react";

export default function StoreSearchInput({
  namaToko,
  onChangeNamaToko,
  linkMaps,
  onChangeLinkMaps,
}) {
  const [query, setQuery] = useState(namaToko || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showManualLink, setShowManualLink] = useState(false);
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal query state with prop changes
  useEffect(() => {
    setQuery(namaToko || "");
  }, [namaToko]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    onChangeNamaToko(val);
    setSelectedPlace(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data.ok && Array.isArray(data.places)) {
          setSuggestions(data.places);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(place) {
    setSelectedPlace(place);
    setQuery(place.name);
    onChangeNamaToko(place.name);
    onChangeLinkMaps(place.review_url || place.maps_url);
    setOpen(false);
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
            placeholder="Ketik nama toko Anda (mis. Kopi Senja Kediri)…"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Suggestions */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
          {loading && suggestions.length === 0 && (
            <div className="p-4 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              Mencari lokasi di Google Maps…
            </div>
          )}

          {!loading && suggestions.length === 0 && query.trim().length >= 2 && (
            <div className="p-4 text-xs text-slate-500 text-center">
              Toko &quot;{query}&quot; tidak ditemukan otomatis. Isikan lokasi secara manual di bawah.
            </div>
          )}

          {suggestions.map((p, idx) => (
            <button
              key={p.place_id || idx}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full text-left p-3 hover:bg-emerald-50/60 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-2.5"
            >
              <div className="mt-0.5 h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                {p.address && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                    <span className="truncate">{p.address}</span>
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Option to view / edit Google Maps link manually */}
      <div>
        <button
          type="button"
          onClick={() => setShowManualLink(!showManualLink)}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {showManualLink ? "Sembunyikan Link Google Maps" : linkMaps ? "Lihat / Edit Link Google Maps" : "Isi link Google Maps manual"}
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
              Otomatis terisi saat memilih lokasi dari pencarian di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
