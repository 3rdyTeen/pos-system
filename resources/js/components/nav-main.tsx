import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Icon } from '@/lib/icon';
import { type NavNode } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

function containsActive(node: NavNode, url: string): boolean {
    return node.url === url || node.children.some((child) => containsActive(child, url));
}

function NavTreeItem({ node, url, depth }: { node: NavNode; url: string; depth: number }) {
    const hasChildren = node.children.length > 0;

    if (!hasChildren) {
        if (depth === 0) {
            return (
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={node.url === url} tooltip={{ children: node.name }}>
                        <Link href={node.url} prefetch>
                            <Icon name={node.icon} />
                            <span>{node.name}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            );
        }

        return (
            <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild isActive={node.url === url}>
                    <Link href={node.url} prefetch>
                        <Icon name={node.icon} />
                        <span>{node.name}</span>
                    </Link>
                </SidebarMenuSubButton>
            </SidebarMenuSubItem>
        );
    }

    const label = (
        <>
            <Icon name={node.icon} />
            <span>{node.name}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        </>
    );

    const subTree = (
        <CollapsibleContent>
            <SidebarMenuSub>
                {node.children.map((child) => (
                    <NavTreeItem key={child.id} node={child} url={url} depth={depth + 1} />
                ))}
            </SidebarMenuSub>
        </CollapsibleContent>
    );

    return (
        <Collapsible asChild defaultOpen={containsActive(node, url)} className="group/collapsible">
            {depth === 0 ? (
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={{ children: node.name }}>{label}</SidebarMenuButton>
                    </CollapsibleTrigger>
                    {subTree}
                </SidebarMenuItem>
            ) : (
                <SidebarMenuSubItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuSubButton>{label}</SidebarMenuSubButton>
                    </CollapsibleTrigger>
                    {subTree}
                </SidebarMenuSubItem>
            )}
        </Collapsible>
    );
}

export function NavMain({ items = [] }: { items: NavNode[] }) {
    const page = usePage();

    if (items.length === 0) {
        return null;
    }

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <NavTreeItem key={item.id} node={item} url={page.url} depth={0} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
