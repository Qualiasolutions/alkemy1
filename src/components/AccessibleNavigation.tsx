/**
 * Accessible Navigation Component
 * Implements WCAG 2.1 AA compliant navigation with proper keyboard support and ARIA labels
 */

import React, { useState, useRef, useEffect } from 'react';

interface NavItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
    isDisabled?: boolean;
}

interface AccessibleNavigationProps {
    items: NavItem[];
    activeItem?: string;
    onItemSelect: (itemId: string) => void;
    orientation?: 'horizontal' | 'vertical';
    variant?: 'tabs' | 'menu' | 'toolbar';
    className?: string;
}

export const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({
    items,
    activeItem,
    onItemSelect,
    orientation = 'horizontal',
    variant = 'tabs',
    className = ''
}) => {
    const [focusedItem, setFocusedItem] = useState<string | null>(null);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const getRole = () => {
        switch (variant) {
            case 'tabs':
                return 'tablist';
            case 'menu':
                return 'menu';
            case 'toolbar':
                return 'toolbar';
            default:
                return 'tablist';
        }
    };

    const getItemRole = () => {
        switch (variant) {
            case 'tabs':
                return 'tab';
            case 'menu':
                return 'menuitem';
            case 'toolbar':
                return 'button';
            default:
                return 'tab';
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent, itemId: string) => {
        const currentIndex = items.findIndex(item => item.id === itemId);
        let nextIndex = currentIndex;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                nextIndex = orientation === 'vertical' && event.key === 'ArrowRight'
                    ? currentIndex
                    : (currentIndex + 1) % items.length;
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                nextIndex = orientation === 'horizontal' && event.key === 'ArrowUp'
                    ? currentIndex
                    : currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                break;

            case 'Home':
                event.preventDefault();
                nextIndex = 0;
                break;

            case 'End':
                event.preventDefault();
                nextIndex = items.length - 1;
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!items[currentIndex].isDisabled) {
                    onItemSelect(itemId);
                }
                return;

            case 'Escape':
                event.preventDefault();
                setExpandedItem(null);
                return;

            default:
                return;
        }

        const nextItem = items[nextIndex];
        if (nextItem && !nextItem.isDisabled) {
            setFocusedItem(nextItem.id);

            // Focus the actual element
            const element = containerRef.current?.querySelector(
                `[data-item-id="${nextItem.id}"]`
            ) as HTMLElement;
            element?.focus();
        }
    };

    const handleItemClick = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item?.isDisabled) {
            onItemSelect(itemId);
            setFocusedItem(itemId);
        }
    };

    const getItemAriaSelected = (itemId: string) => {
        if (variant === 'tabs') {
            return activeItem === itemId;
        }
        return undefined;
    };

    const getItemAriaExpanded = (itemId: string) => {
        return expandedItem === itemId;
    };

    const getItemTabIndex = (itemId: string) => {
        if (items.find(item => item.id === itemId)?.isDisabled) {
            return -1;
        }
        return focusedItem === itemId || (!focusedItem && items[0]?.id === itemId) ? 0 : -1;
    };

    return (
        <div
            ref={containerRef}
            className={`accessible-navigation accessible-navigation--${variant} accessible-navigation--${orientation} ${className}`}
            role={getRole()}
            aria-orientation={orientation}
        >
            {items.map((item) => (
                <button
                    key={item.id}
                    data-item-id={item.id}
                    type="button"
                    role={getItemRole()}
                    aria-label={item.label}
                    aria-describedby={item.description ? `${item.id}-desc` : undefined}
                    aria-selected={getItemAriaSelected(item.id)}
                    aria-expanded={getItemAriaExpanded(item.id)}
                    aria-disabled={item.isDisabled}
                    tabIndex={getItemTabIndex(item.id)}
                    disabled={item.isDisabled}
                    className={`nav-item ${
                        activeItem === item.id ? 'nav-item--active' : ''
                    } ${item.isDisabled ? 'nav-item--disabled' : ''}`}
                    onClick={() => handleItemClick(item.id)}
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                    onFocus={() => setFocusedItem(item.id)}
                    onBlur={() => setFocusedItem(null)}
                >
                    <span className="nav-item__icon" aria-hidden="true">
                        {item.icon}
                    </span>
                    <span className="nav-item__label">{item.label}</span>

                    {item.description && (
                        <span
                            id={`${item.id}-desc`}
                            className="nav-item__description"
                            aria-hidden="true"
                        >
                            {item.description}
                        </span>
                    )}
                </button>
            ))}

            <style jsx>{`
                .accessible-navigation {
                    display: flex;
                    gap: 0;
                    border: none;
                    background: transparent;
                    outline: none;
                }

                .accessible-navigation--horizontal {
                    flex-direction: row;
                }

                .accessible-navigation--vertical {
                    flex-direction: column;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    border: 2px solid transparent;
                    border-radius: 6px;
                    background: var(--background-secondary);
                    color: var(--text-primary);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    min-height: 44px; /* WCAG touch target minimum */
                    min-width: 44px;
                    position: relative;
                }

                .nav-item:hover:not(.nav-item--disabled) {
                    background: var(--background-hover);
                    border-color: var(--border-color);
                }

                .nav-item:focus {
                    outline: none;
                    border-color: var(--focus-color);
                    box-shadow: 0 0 0 3px var(--focus-color-alpha);
                }

                .nav-item--active {
                    background: var(--primary-color);
                    color: var(--primary-text);
                    border-color: var(--primary-color);
                }

                .nav-item--disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    pointer-events: none;
                }

                .nav-item__icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }

                .nav-item__label {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .nav-item__description {
                    position: absolute;
                    left: -9999px;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                }

                /* High contrast mode support */
                @media (prefers-contrast: high) {
                    .nav-item {
                        border-width: 3px;
                    }

                    .nav-item:focus {
                        border-width: 4px;
                    }
                }

                /* Reduced motion support */
                @media (prefers-reduced-motion: reduce) {
                    .nav-item {
                        transition: none;
                    }
                }

                /* Screen reader only text */
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
            `}</style>
        </div>
    );
};

export default AccessibleNavigation;