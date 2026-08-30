"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Store, CheckCircle2, Loader2, Search, Link as LinkIcon, AlertCircle } from "lucide-react";

const MIN_INPUT_LENGTH = 2;
const DEBOUNCE_DELAY_MS = 5000; // Wait 5 seconds after user stops typing

export default function StoreSearchInput({
  namaToko,
  onChangeNamaToko,
  linkMaps,
  onChangeLinkMaps,
}) {
  const [inputValue, setInputValue] = useState(namaToko || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timerCountdown, setTimerCountdown] = useState(0);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Session Token, Timer, dan AbortController Refs
  const sessionTokenRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const wrapperRef = useRef(null);

  // Synchronize external prop changes (e.g. from modal edit mode)
  useEffect(() => {
    if (namaToko !== undefined && namaToko !== inputValue) {
      setInputValue(namaToko);
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

  // Session token management
  const getOrCreateSessionToken = useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    return sessionTokenRef.current;
  }, []);

  // Cleanup timers & active fetch controller
  const clearSearchState = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setTimerCountdown(0);
  }, []);

  // Memanggil API Google Places Autocomplete (New) setelah 5 detik hening
  const executeAutocompleteSearch = useCallback(
    async (query) => {
      clearSearchState();
      setError(null);
      setLoading(true);
      setOpen(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const token = getOrCreateSessionToken();

      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: query,
            sessionToken: token,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.error || "Terjadi kesalahan saat mencari lokasi.");
          setSuggestions([]);
        } else {
          setSuggestions(data.places || []);
          if ((data.places || []).length === 0) {
            setError("Tidak ada lokasi yang cocok ditemukan.");
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        setError("Koneksi terputus. Silakan coba lagi.");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [clearSearchState, getOrCreateSessionToken]
  );

  // Handling pergerakan input saat pengguna mengetik
  function handleInputChange(e) {
    const val = e.target.value;
    setInputValue(val);
    onChangeNamaToko(val);
    setError(null);

    // 1. Reset timer dan batalkan request lama yang belum selesai
    clearSearchState();

    // 2. Jika input kurang dari minimum (2 karakter), bersihkan hasil & sembunyikan dropdown
    if (!val || val.trim().length < MIN_INPUT_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    // 3. Set status loading & aktifkan timer debounce 5 DETIK
    setLoading(true);
    setOpen(true);
    setTimerCountdown(5);

    // Interval hitung mundur visual 5s untuk UX pengguna
    countdownIntervalRef.current = setInterval(() => {
      setTimerCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set Timeout 5 detik setelah berhenti mengetik
    debounceTimerRef.current = setTimeout(() => {
      executeAutocompleteSearch(val.trim());
    }, DEBOUNCE_DELAY_MS);
  }

  // Handling ketika saran tempat dipilih dari Autocomplete (New)
  function handleSelectPlace(place) {
    const name = place.name;
    const reviewUrl =
      place.review_url ||
      (place.place_id ? `https://search.google.com/local/writereview?placeid=${place.place_id}` : "");

    setInputValue(name);
    onChangeNamaToko(name);
    onChangeLinkMaps(reviewUrl);

    // Reset session token setelah prediksi dipilih
    sessionTokenRef.current = null;

    clearSearchState();
    setOpen(false);
    setLoading(false);
  }

  const isPlaceSelected = Boolean(linkMaps) && linkMaps.includes("placeid=ChIJ");

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

      {/* Input Utama Autocomplete */}
      <div className="relative">
        <input
          type="text"
          className="input-field input-field-has-icon-left input-field-has-icon-right text-sm font-medium"
          placeholder="Ketik nama toko (contoh: Kopi Senja Kediri)…"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.trim().length >= MIN_INPUT_LENGTH && (suggestions.length > 0 || loading || error)) {
              setOpen(true);
            }
          }}
          required
        />
        <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {loading && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {timerCountdown > 0 ? <span>Mencari dlm {timerCountdown}s…</span> : <span>Memuat…</span>}
            </div>
          )}
          {!loading && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
              Autocomplete (New)
            </span>
          )}
        </div>
      </div>

      {/* DROPDOWN HASIL PREDIKSI AUTOCOMPLETE (NEW) */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              {timerCountdown > 0 ? (
                <span>Menunggu 5 detik setelah Anda berhenti mengetik ({timerCountdown}s)…</span>
              ) : (
                <span>Mengambil saran Autocomplete (New) dari Google…</span>
              )}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-amber-600 bg-amber-50/50 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>{error}</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Pilih Lokasi dari Google Places Autocomplete:
              </div>
              {suggestions.map((place, idx) => (
                <button
                  key={place.place_id || idx}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
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
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              Ketik minimal 2 karakter dan tunggu 5 detik untuk melihat daftar lokasi.
            </div>
          )}
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
              Otomatis dibuatkan link direct review saat memilih toko dari Autocomplete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
