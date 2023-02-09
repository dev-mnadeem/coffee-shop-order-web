import { createContext, useCallback, useContext, useMemo } from 'react';
import { listItems } from '../api/items';
import { listDiscounts } from '../api/discounts';
import { createMenuPricingEngine } from '../domain/pricing';
import useAsync from '../hooks/useAsync';

/**
 * The menu -- items plus the paired-item offers -- fetched once and shared.
 *
 * Both the Items screen and the Order screen need the item list, and the
 * order form also needs the discount table to price a basket. Fetching them
 * per screen meant four requests for two pieces of data and a visible flash
 * of "No Data Retrieved" on every navigation. One provider, one fetch, and
 * the pricing engine is memoised alongside the data it closes over.
 */

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const load = useCallback(async ({ signal }) => {
    const [items, discounts] = await Promise.all([
      listItems({ signal }),
      listDiscounts({ signal }),
    ]);
    return { items, discounts };
  }, []);

  const { status, data, error, reload, setData } = useAsync(load, {
    initialData: { items: [], discounts: [] },
  });

  const items = useMemo(() => (data && data.items) || [], [data]);
  const discounts = useMemo(() => (data && data.discounts) || [], [data]);

  /** Drop an item from the cached menu without a round trip. */
  const removeItem = useCallback(
    (id) =>
      setData((current) => ({
        items: (current.items || []).filter((item) => Number(item.id) !== Number(id)),
        discounts: (current.discounts || []).filter(
          (discount) =>
            Number(discount.item_id) !== Number(id) &&
            Number(discount.discount_with_item_id) !== Number(id)
        ),
      })),
    [setData]
  );

  const value = useMemo(
    () => ({
      status,
      error,
      items,
      discounts,
      reload,
      removeItem,
      pricing: createMenuPricingEngine(discounts),
    }),
    [status, error, items, discounts, reload, removeItem]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

/** @returns {{ status: string, error: Error|null, items: object[], discounts: object[], reload: () => void, removeItem: (id: number) => void, pricing: object }} */
export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used inside a <MenuProvider>');
  return context;
}

export default MenuProvider;
