"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The cart stores a denormalised snapshot of each line so the drawer renders
 * instantly with no round trip. These values are for DISPLAY ONLY — the server
 * action re-reads price and stock from the database at checkout, so a stale
 * localStorage cart can never dictate what a customer is charged.
 */
export type CartLine = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string | null;
  unitPricePaisa: number;
  imageUrl: string | null;
  quantity: number;
  /** Stock at the time of adding, used to cap the quantity stepper in the UI. */
  maxStock: number;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeLine: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,

      addLine: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, quantity: Math.min(l.quantity + quantity, l.maxStock) }
                  : l,
              ),
              isOpen: true,
            };
          }
          return {
            lines: [...state.lines, { ...line, quantity: Math.min(quantity, line.maxStock) }],
            isOpen: true,
          };
        }),

      removeLine: (variantId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.variantId !== variantId) })),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.variantId !== variantId)
              : state.lines.map((l) =>
                  l.variantId === variantId
                    ? { ...l, quantity: Math.min(quantity, l.maxStock) }
                    : l,
                ),
        })),

      clear: () => set({ lines: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "claycreations-cart",
      // `isOpen` is ephemeral UI state; persisting it would pop the drawer open
      // on every page load.
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export const selectItemCount = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.quantity, 0);

export const selectSubtotalPaisa = (state: CartState) =>
  state.lines.reduce((sum, line) => sum + line.unitPricePaisa * line.quantity, 0);
