"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CommandSnippet from "./CommandSnippet";

export type QuickStartStep = {
  step: string;
  description: string;
};

type QuickStartTabsProps = {
  dockerCommand: string;
  dockerSteps: QuickStartStep[];
  vscodeSteps: QuickStartStep[];
  /** Deep link that opens the extension's DocumentDB Local setup wizard. */
  vscodeDeepLinkUrl: string;
  /** Marketplace page, linked from the caption so the install is explained, not hidden. */
  vscodeMarketplaceUrl: string;
  /** Full Docker guide, linked from the Terminal panel's footer. */
  dockerDocsUrl: string;
  /**
   * The VS Code guide's setup section, which lists every other way to open the wizard.
   * Linked from the VS Code panel's footer.
   */
  vscodeDocsUrl: string;
};

// "Terminal" rather than "Docker": both paths run the same Docker image, and labelling one of
// them "Docker" implies the other avoids Docker.
const TABS = [
  { id: "terminal", label: "Terminal" },
  { id: "vscode", label: "VS Code" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function StepList({ steps }: { steps: QuickStartStep[] }) {
  return (
    <ol className="mt-5 overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/50">
      {steps.map((item) => (
        <li
          key={item.step}
          className="grid grid-cols-[auto_1fr] items-start gap-3 border-t border-neutral-800/80 px-4 py-3.5 first:border-t-0"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-[11px] font-semibold text-blue-200">
            {item.step}
          </span>
          <p className="text-sm leading-6 text-gray-300">{item.description}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * How long after the setup button is used before the retry line appears. Long enough for
 * VS Code to open and take focus on a normal machine; short enough that someone still
 * looking at the page finds it. It is phrased so it does no harm if setup did work.
 */
const RETRY_HINT_DELAY_MS = 4000;

/**
 * The retry line under the VS Code steps. The deep link can do nothing visible: no VS Code
 * installed, or on managed devices whose policy sets a private marketplace, a cold-started
 * VS Code fails the install and a second click succeeds. The live region is always mounted
 * so it exists before its content arrives, which is what makes the arrival announced.
 * Exported so the visible state can be rendered in a test without a DOM library.
 */
export function SetupRetryHint({
  visible,
  deepLinkUrl,
  marketplaceUrl,
}: {
  visible: boolean;
  deepLinkUrl: string;
  marketplaceUrl: string;
}) {
  return (
    <div role="status">
      {visible && (
        <p className="mt-4 text-sm leading-6 text-gray-400">
          Nothing happened? Try{" "}
          <a
            href={deepLinkUrl}
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            Set up in VS Code
          </a>{" "}
          again, or install the extension from the{" "}
          <Link
            href={marketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            Marketplace
          </Link>{" "}
          first.
        </p>
      )}
    </div>
  );
}

export default function QuickStartTabs({
  dockerCommand,
  dockerSteps,
  vscodeSteps,
  vscodeDeepLinkUrl,
  vscodeMarketplaceUrl,
  dockerDocsUrl,
  vscodeDocsUrl,
}: QuickStartTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("terminal");
  // Deliberately never reset on a tab switch: the advice stays true once the link was used.
  const [setupOpened, setSetupOpened] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!setupOpened) {
      return;
    }
    const timer = window.setTimeout(() => setShowRetry(true), RETRY_HINT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [setupOpened]);

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    tabRefs.current[id]?.focus();
  };

  // Arrow keys move between tabs, which is what a tablist is expected to do; without it the
  // only way through is Tab, and that leaves the panel. Home/End jump to the ends, per the
  // ARIA authoring practices for tabs.
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
        aria-label="Ways to run DocumentDB locally"
        className="mb-4 flex w-full rounded-full border border-neutral-700 bg-neutral-900/80 p-1 sm:inline-flex sm:w-auto"
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
              // Only the selected tab is in the tab order; arrow keys move between them.
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={onTabKeyDown}
              // Solid active state so the tablist reads as a control rather than as another
              // badge next to the "Quick start" chip and the numbered step markers.
              className={`flex-1 rounded-full px-5 py-3 text-sm font-semibold transition-colors sm:flex-none ${
                isActive
                  ? "bg-neutral-700 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="quickstart-panel-terminal"
        aria-labelledby="quickstart-tab-terminal"
        hidden={activeTab !== "terminal"}
      >
        <CommandSnippet command={dockerCommand} label="bash" />
        <StepList steps={dockerSteps} />
        <p className="mt-4 text-sm leading-6 text-gray-400">
          Want a GUI? The{" "}
          <button
            type="button"
            onClick={() => selectTab("vscode")}
            aria-label="Switch to the VS Code tab"
            className="font-semibold text-blue-300 underline-offset-2 transition-colors hover:text-blue-200 hover:underline"
          >
            VS Code extension
          </button>{" "}
          connects to this container too.
        </p>
        <div className="mt-4 text-sm">
          <Link
            href={dockerDocsUrl}
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            Full Docker guide
          </Link>
        </div>
      </div>

      <div
        role="tabpanel"
        id="quickstart-panel-vscode"
        aria-labelledby="quickstart-tab-vscode"
        hidden={activeTab !== "vscode"}
      >
        {/*
          No Docker prerequisite here. Both paths need Docker and the Terminal tab does not say
          so, so saying it only here made the guided path look like the one with extra
          requirements. The guide covers Docker properly, readiness states included.
        */}
        <p className="mb-4 text-sm leading-6 text-gray-300">
          <strong className="font-semibold text-white">
            Choose this for the smoothest experience.
          </strong>{" "}
          VS Code sets up DocumentDB Local and creates a ready-to-use connection
          for you. One click, confirm the prompts, then follow the wizard.
        </p>
        {/*
          One button carries the whole flow. VS Code itself offers to install a missing
          extension when a vscode:// link targets it, then re-opens the link, so a separate
          "Install the extension" action was a step the visitor never has to take.
        */}
        <a
          href={vscodeDeepLinkUrl}
          aria-describedby="quickstart-vscode-setup-caption"
          onClick={() => setSetupOpened(true)}
          className="inline-flex w-full items-center justify-center rounded-md bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 sm:w-auto"
        >
          Set up in VS Code
        </a>
        <p
          id="quickstart-vscode-setup-caption"
          className="mt-3 text-sm leading-6 text-gray-400"
        >
          Opens VS Code and its setup wizard. If you do not have the{" "}
          <Link
            href={vscodeMarketplaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            DocumentDB for VS Code
          </Link>{" "}
          extension, VS Code offers to install it first.
        </p>
        <StepList steps={vscodeSteps} />
        {/*
          Troubleshooting stays out of the happy path: below the steps, so its arrival never
          shifts what is being read, and after a delay, so people for whom VS Code is already
          opening are not shown doubt.
        */}
        <SetupRetryHint
          visible={showRetry}
          deepLinkUrl={vscodeDeepLinkUrl}
          marketplaceUrl={vscodeMarketplaceUrl}
        />
        <p className="mt-4 text-sm leading-6 text-gray-400">
          Not working in VS Code? The{" "}
          <Link
            href={vscodeDocsUrl}
            className="font-semibold text-blue-300 transition-colors hover:text-blue-200"
          >
            full VS Code guide
          </Link>{" "}
          shows how to open the wizard from the activity bar or the Command
          Palette.
        </p>
        <p className="mt-4 text-sm leading-6 text-gray-400">
          Prefer to start it yourself? The{" "}
          <button
            type="button"
            onClick={() => selectTab("terminal")}
            aria-label="Switch to the Terminal tab"
            className="font-semibold text-blue-300 underline-offset-2 transition-colors hover:text-blue-200 hover:underline"
          >
            Terminal
          </button>{" "}
          tab runs the same image with one command.
        </p>
      </div>
    </div>
  );
}
