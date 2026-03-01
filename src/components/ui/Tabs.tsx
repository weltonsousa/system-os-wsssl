// src/components/ui/Tabs.tsx
"use client";

import React, { useState } from "react";

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ElementType;
    content: React.ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    return (
        <div className="w-full">
            <div
                role="tablist"
                aria-label="Tabs"
                className="flex space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`panel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-300 ${isActive
                                    ? "bg-white text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-400"
                                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                                }`}
                        >
                            {Icon && <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
            <div className="mt-4 grid grid-cols-1 grid-rows-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <div
                            key={tab.id}
                            role="tabpanel"
                            id={`panel-${tab.id}`}
                            aria-labelledby={`tab-${tab.id}`}
                            tabIndex={isActive ? 0 : -1}
                            className={`col-start-1 row-start-1 transition-all duration-300 ${isActive
                                    ? "opacity-100 scale-100 pointer-events-auto z-10"
                                    : "opacity-0 scale-95 pointer-events-none z-0"
                                }`}
                        >
                            {tab.content}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
