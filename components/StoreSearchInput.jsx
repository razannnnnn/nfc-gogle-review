"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import usePlacesAutocomplete from "use-places-autocomplete";
import { MapPin, Store, CheckCircle2, Loader2, Search, Link as LinkIcon } from "lucide-react";

export default function StoreSearchInput({
  namaToko,
  onChangeNamaToko,
  linkMaps,
  onChangeLinkMaps,
}) {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [searchingApi, setSearchingApi] = useState(false);
  const wrapperRef = useRef(null);

  // Cek apakah Google Maps Places JS SDK sudah termuat
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
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Hook Google Places Autocomplete
  const {
    ready,
    value,
    suggestions: { status, data: sdkSuggestions },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "id" },
    },
    debounce: 250,
    defaultValue: namaToko || "",
  });

  useEffect(() => {
    if (namaToko !== undefined && namaToko !== value) {
      setValue(namaToko, false);
    }
  }, [namaToko]);

  // Click outside listener untuk menutup dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Alternative API Search jika JS SDK belum/tidak aktif
  const fetchApiSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setApiSuggestions([]);
      return;
    }
    setSearchingApi(true);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.places)) {
        setApiSuggestions(json.places);
        setOpen(true);
      }
    } catch (err) {
      console.error("[API Search Error]", err);
    } finally {
      setSearchingApi(false);
    }
  }, []);

  // Handling perubahan input saat mengetik
  function handleInputChange(e) {
    const val = e.target.value;
    setValue(val);
    onChangeNamaToko(val);
    setOpen(true);

    // Jika JS SDK tidak dimuat/ready, gunakan backend API search fallback
    if (!googleLoaded || !ready) {
      fetchApiSuggestions(val);
    }
  }

  // Handling ketika saran tempat dipilih dari dropdown JS SDK
  function handleSelectSdk(prediction) {
    const { place_id, structured_formatting, description } = prediction;
    const name = structured_formatting?.main_text || description;
    const reviewUrl = `https://search.google.com/local/writereview?placeid=${place_id}`;

    setValue(name, false);
    clearSuggestions();
    setOpen(false);

    onChangeNamaToko(name);
    onChangeLinkMaps(reviewUrl);
  }

  // Handling ketika saran dipilih dari API Backend fallback
  function handleSelectApi(place) {
    const name = place.name;
    const reviewUrl = place.place_id
      ? `https://search.google.com/local/writereview?placeid=${place.place_id}`
      : place.review_url || place.maps_url;

    setValue(name, false);
    setOpen(false);

    onChangeNamaToko(name);
    onChangeLinkMaps(reviewUrl);
  }

  const isPlaceSelected =
    Boolean(linkMaps) && linkMaps.includes("placeid=ChIJ");

  const showSdkDropdown = open && googleLoaded && status === "OK" && sdkSuggestions.length > 0;
  const showApiDropdown = open && (!googleLoaded || !ready) && apiSuggestions.length > 0;

  return (
    <div ref={wrapperRef} className="space-y-2 relative">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800">
          Cari Nama Toko / Tempat Google Maps
        </label>
        {isPlaceSelected && (
          <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Place ID Terhubung
          </span>
        )}
      </div>

      {/* Input Utama Pencarian Google Maps */}
      <div className="relative">
        <input
          type="text"
          className="input-field input-field-has-icon-left input-field-has-icon-right text-sm font-medium"
          placeholder="Ketik nama toko Anda (contoh: Kopi Senja Kediri)…"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if ((sdkSuggestions.length > 0 && googleLoaded) || apiSuggestions.length > 0) {
              setOpen(true);
            }
          }}
          required
        />
        <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {searchingApi ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
              GMaps
            </span>
          )}
        </div>
      </div>

      {/* DROPDOWN HASIL PENCARIAN GOOGLE MAPS (JS SDK) */}
      {showSdkDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Pilih Lokasi Toko dari Google Maps:
          </div>
          {sdkSuggestions.map((prediction) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text },
            } = prediction;

            return (
              <button
                key={place_id}
                type="button"
                onClick={() => handleSelectSdk(prediction)}
                className="w-full text-left p-3 hover:bg-emerald-50/70 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-3"
              >
                <div className="mt-0.5 h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
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

      {/* DROPDOWN HASIL PENCARIAN API BACKEND FALLBACK */}
      {showApiDropdown && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Hasil Pencarian Tempat Google Maps:
          </div>
          {apiSuggestions.map((place, idx) => (
            <button
              key={place.place_id || idx}
              type="button"
              onClick={() => handleSelectApi(place)}
              className="w-full text-left p-3 hover:bg-emerald-50/70 border-b border-slate-100 last:border-0 transition-colors flex items-start gap-3"
            >
              <div className="mt-0.5 h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {place.name}
                </p>
                {place.address && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                    <span className="truncate">{place.address}</span>
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Link Google Maps Terhubung / Manual Input Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-xs text-slate-500 hover:text-emerald-600 font-medium inline-flex items-center gap-1 transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          {manualMode
            ? "Sembunyikan URL Google Maps"
            : linkMaps
            ? "Lihat URL Direct 5-Star Review"
            : "Atau paste URL Google Maps manual"}
        </button>

        {manualMode && (
          <div className="mt-2 animate-fade-in space-y-1">
            <input
              type="text"
              className="input-field text-xs font-mono bg-slate-50"
              placeholder="https://search.google.com/local/writereview?placeid=..."
              value={linkMaps}
              onChange={(e) => onChangeLinkMaps(e.target.value)}
            />
            <p className="text-[11px] text-slate-400">
              Otomatis dibuatkan link direct review saat mengetik nama toko di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
