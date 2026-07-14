import * as LucideIcons from 'lucide-react';
import { Circle, type LucideIcon } from 'lucide-react';

const iconMap = LucideIcons as unknown as Record<string, LucideIcon>;

/**
 * Convert a kebab-case lucide icon name (as stored on a navigation record,
 * e.g. "layout-grid") to its PascalCase component export ("LayoutGrid").
 */
function kebabToPascal(name: string): string {
    return name
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

/**
 * Resolve a stored icon name to a lucide component, falling back to Circle.
 */
export function resolveIcon(name?: string | null): LucideIcon {
    if (!name) {
        return Circle;
    }

    return iconMap[kebabToPascal(name)] ?? Circle;
}

/**
 * Render a lucide icon by its stored kebab-case name.
 */
export function Icon({ name, className }: { name?: string | null; className?: string }) {
    const Component = resolveIcon(name);

    return <Component className={className} />;
}
