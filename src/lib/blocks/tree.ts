/**
 * Turns the flat `sections` list into the render tree (panel → children).
 * Children of a missing/hidden panel are dropped, matching the creator's intent
 * that hiding a panel hides its whole group.
 */
interface TreeNode { id: string; parent_id: string | null; sort_order: number }

export type WithChildren<T> = T & { children: T[] };

export function buildTree<T extends TreeNode>(items: T[]): WithChildren<T>[] {
  const byOrder = (a: T, b: T) => a.sort_order - b.sort_order;
  const children = new Map<string, T[]>();
  for (const item of items) {
    if (!item.parent_id) continue;
    const list = children.get(item.parent_id) ?? [];
    list.push(item);
    children.set(item.parent_id, list);
  }
  return items
    .filter((item) => !item.parent_id)
    .sort(byOrder)
    .map((item) => ({ ...item, children: (children.get(item.id) ?? []).sort(byOrder) }));
}
