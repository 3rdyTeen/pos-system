import { BreadcrumbItem, NavNode } from '@/types';

/**
 * Derive breadcrumbs from the DB-driven navigation tree by locating the node
 * whose url matches the current path and collecting its ancestor chain. Returns
 * an empty array when the path is not part of the navigation.
 */
export function buildBreadcrumbs(navigation: NavNode[], url: string): BreadcrumbItem[] {
    const path = url.split('?')[0];

    const find = (nodes: NavNode[], trail: NavNode[]): NavNode[] | null => {
        for (const node of nodes) {
            const nextTrail = [...trail, node];

            if (node.url === path) {
                return nextTrail;
            }

            const found = find(node.children, nextTrail);
            if (found) {
                return found;
            }
        }

        return null;
    };

    const trail = find(navigation, []);

    if (!trail) {
        return [];
    }

    return trail.map((node) => ({ title: node.name, href: node.url }));
}
