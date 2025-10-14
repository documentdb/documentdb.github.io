"use client";

import { useState, ReactNode, Children, isValidElement } from "react";

interface TabsProps {
  children: ReactNode;
}

interface TabPanelProps {
  children: ReactNode;
  title: string;
}

export function TabPanel({ children, title }: TabPanelProps) {
  return <div>{children}</div>;
}

export function Tabs({ children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  const arrayChildren = Children.toArray(children).filter(child => isValidElement(child));

  return (
    <div>
      <div className="border-b border-neutral-600/30">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {arrayChildren.map((child, index) => {
            if (isValidElement(child)) {
              const title = child.props.title || `Tab ${index + 1}`;
              return (
                <button
                  key={index}
                  onClick={() => handleTabClick(index)}
                  className={`${
                    activeTab === index
                      ? 'border-green-400 text-green-400'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-400'
                  } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none`}
                >
                  {title}
                </button>
              );
            }
            return null;
          })}
        </nav>
      </div>
      <div>
        {arrayChildren.map((child, index) => {
          if (index === activeTab) {
            if (isValidElement(child)) {
              return <div key={index}>{child}</div>;
            }
          }
          return null;
        })}
      </div>
    </div>
  );
}
