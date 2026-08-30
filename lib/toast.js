"use client";

// lib/toast.js
//
// Catatan implementasi: PRD awalnya menyebut paket pihak ketiga "goey-toast"
// (dibangun di atas Sonner + Framer Motion) untuk notifikasi toast.
// Paket tersebut ternyata tidak kompatibel dengan React 19 di Next.js 15
// (menyebabkan error saat `next build`: "Class extends value undefined"
// pada error-boundary internalnya). Supaya proyek tetap bisa di-build,
// dibuat wrapper tipis sendiri langsung di atas `sonner` + `framer-motion`
// — sesuai deskripsi teknis yang sama di PRD — dengan API (`gooeyToast`,
// `<GooeyToaster />`) yang sengaja dibuat mirip supaya mudah diganti lagi
// ke paket resmi kapan pun kompatibilitasnya sudah diperbaiki.

import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function toastFn(title, opts = {}) {
  return toast(title, { description: opts.description, id: opts.id, duration: opts.duration });
}

toastFn.success = (title, opts = {}) =>
  toast.success(title, { description: opts.description, id: opts.id, duration: opts.duration });

toastFn.error = (title, opts = {}) =>
  toast.error(title, { description: opts.description, id: opts.id, duration: opts.duration });

toastFn.warning = (title, opts = {}) =>
  toast.warning(title, { description: opts.description, id: opts.id, duration: opts.duration });

toastFn.info = (title, opts = {}) =>
  toast(title, { description: opts.description, id: opts.id, duration: opts.duration });

// "Update in place": sonner cukup dipanggil ulang dengan `id` yang sama.
toastFn.update = (id, { title, type, description } = {}) => {
  if (type === "success") return toast.success(title, { id, description });
  if (type === "error") return toast.error(title, { id, description });
  if (type === "warning") return toast.warning(title, { id, description });
  return toast(title, { id, description });
};

toastFn.dismiss = (idOrFilter) => toast.dismiss(idOrFilter);

export const gooeyToast = toastFn;

// Toaster dibungkus dengan sedikit animasi morph ala "gooey" lewat
// Framer Motion pada kontainernya; styling detail toast individual
// memakai class bawaan Sonner (lihat app/globals.css untuk override warna).
export function GooeyToaster(props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Toaster richColors closeButton {...props} />
      </motion.div>
    </AnimatePresence>
  );
}
