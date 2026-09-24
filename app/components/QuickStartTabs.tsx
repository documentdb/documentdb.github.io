"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import CommandSnippet from "./CommandSnippet";

type QuickStartTabsProps = {
  dockerCommand: string;
  vscodeDeepLinkUrl: string;
  dockerDocsUrl: string;
  vscodeDocsUrl: string;
};

const TABS = [
  { id: "command", label: "Docker command", description: "Run it yourself" },
  { id: "guided", label: "Guided setup", description: "VS Code extension" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function QuickStartTabs({
  dockerCommand,
  vscodeDeepLinkUrl,
  dockerDocsUrl,
  vscodeDocsUrl,
}: QuickStartTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("command");
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    tabRefs.current[id]?.focus();
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);

    switch (event.key) {
      case "ArrowRight":
      case "ArrowLeft": {
        event.preventDefault();
        const delta = event.key === "ArrowRight" ? 1 : -1;
        selectTab(TABS[(currentIndex + delta + TABS.length) % TABS.length].id);
        break;
      }
      case "Home":
        event.preventDefault();
        selectTab(TABS[0].id);
        break;
      case "End":
        event.preventDefault();
        selectTab(TABS[TABS.length - 1].id);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Ways to set up DocumentDB locally"
        className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-neutral-700 bg-neutral-900/80 p-1"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              type="button"
              role="tab"
              id={`quickstart-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`quickstart-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={onTabKeyDown}
              className={`min-h-14 min-w-0 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${
                isActive
                  ? "bg-neutral-700 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {tab.label}
              <span
                className={`mt-1 block text-xs font-normal ${
                  isActive ? "text-gray-300" : "text-gray-400"
                }`}
              >
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="quickstart-panel-command"
        aria-labelledby="quickstart-tab-command"
        hidden={activeTab !== "command"}
      >
        <p className="mb-4 text-sm leading-6 text-gray-300">
          Replace the username and password, then run the command.
        </p>
        <CommandSnippet command={dockerCommand} label="bash" />
        <p className="mt-4 text-sm leading-6 text-gray-300">
          Then connect with your preferred client.
        </p>
        <div className="mt-3 text-sm">
          <Link
            href={dockerDocsUrl}
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            Docker setup guide
          </Link>
        </div>
      </div>

      <div
        role="tabpanel"
        id="quickstart-panel-guided"
        aria-labelledby="quickstart-tab-guided"
        hidden={activeTab !== "guided"}
      >
        <p className="mb-4 text-sm leading-6 text-gray-300">
          The VS Code extension creates your local database, generates
          credentials, and saves a connection.
        </p>
        <a
          href={vscodeDeepLinkUrl}
          aria-describedby="quickstart-vscode-setup-caption"
          className="inline-flex w-full items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 sm:w-auto"
        >
          Set up in VS Code
        </a>
        <p
          id="quickstart-vscode-setup-caption"
          className="mt-3 text-sm leading-6 text-gray-400"
        >
          Don&apos;t have VS Code?{" "}
          <Link
            href="https://code.visualstudio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            Download it
          </Link>{" "}
          first.
        </p>
        <p className="mt-4 text-sm leading-6 text-gray-300">
          When setup finishes, select Open Connection.
        </p>
        <div className="mt-4 text-sm">
          <Link
            href={vscodeDocsUrl}
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            VS Code setup guide
          </Link>
        </div>
      </div>
    </div>
  );
}
