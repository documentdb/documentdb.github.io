import Link from "next/link";
import { getMetadata } from "../services/metadataService";
import {
  documentdbKubernetesOperatorDocsUrl,
  documentdbKubernetesOperatorGitHubUrl,
} from "../services/externalLinks";

const operatorBenefits = [
  {
    title: "Local to cloud",
    description:
      "Start on kind or minikube, then move to managed or self-managed Kubernetes with the same operator model.",
  },
  {
    title: "Hybrid and multi-cloud",
    description:
      "The docs include concrete AKS, EKS, GKE, and on-prem deployment patterns for teams spanning more than one environment.",
  },
  {
    title: "Cross-cluster replication",
    description:
      "Use documented multi-cluster replication and failover patterns when one cluster is not enough.",
  },
  {
    title: "HA, backup, and TLS",
    description:
      "Add automatic failover, backup resources, and TLS to operate DocumentDB as a real service.",
  },
  {
    title: "Day-2 operations",
    description:
      "Use the kubectl plugin for status, events, and promotion workflows.",
  },
] as const;

const setupSteps = [
  {
    step: "01",
    title: "Prepare the cluster",
    description:
      "Use kind or minikube locally, or a Kubernetes 1.35+ cluster such as AKS, EKS, or GKE.",
  },
  {
    step: "02",
    title: "Install the operator",
    description:
      "Deploy the operator so it can reconcile DocumentDB resources and manage cluster lifecycle operations.",
  },
  {
    step: "03",
    title: "Create a DocumentDB resource",
    description:
      "Apply a DocumentDB custom resource to start locally or grow into replicated topologies as your environment expands.",
  },
] as const;

const operatorHighlights = [
  "kind + minikube quickstart",
  "AKS / EKS / GKE",
  "Hybrid / on-prem guide",
  "Cross-cluster replication",
  "Backup + ScheduledBackup resources",
  "kubectl plugin for operator workflows",
  "TLS-aware deployment model",
] as const;

const bestFitScenarios = [
  "Teams starting on local clusters and growing toward managed Kubernetes.",
  "Platform teams spanning cloud and on-prem Kubernetes environments.",
  "Operators that need cross-cluster replication and promotion workflows.",
] as const;

export const metadata = getMetadata({
  title: "DocumentDB Kubernetes Operator",
  description:
    "Learn how the DocumentDB Kubernetes Operator takes DocumentDB from local Kubernetes clusters to hybrid and multi-cloud topologies with replication, HA, backups, and TLS.",
  extraKeywords: [
    "Kubernetes",
    "operator",
    "Helm",
    "multi-cloud",
    "hybrid",
    "on-prem",
    "cross-cluster replication",
    "high availability",
    "backup",
    "TLS",
  ],
});

export default function KubernetesOperatorPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <section className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.22),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.16),_transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-8 lg:gap-10 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Operator preview
              </p>
              <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                DocumentDB Kubernetes Operator
              </h1>
              <p className="mb-4 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Start on kind or minikube. Expand to{" "}
                <span className="inline-block">hybrid and multi-cloud Kubernetes.</span>
              </p>
              <p className="mb-7 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
                Install with Helm, manage with custom resources, and extend to
                documented cross-cluster replication, failover, backups, and
                TLS.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={documentdbKubernetesOperatorDocsUrl}
                  className="inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 sm:w-auto"
                >
                  Open quick start
                </a>
                <a
                  href={documentdbKubernetesOperatorGitHubUrl}
                  className="inline-flex w-full items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 sm:w-auto"
                >
                  GitHub repository
                </a>
                <Link
                  href="/docs/getting-started"
                  className="inline-flex w-full items-center justify-center rounded-md border border-neutral-600 bg-neutral-800/40 px-6 py-3 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 sm:w-auto"
                >
                  View local install guides
                </Link>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-neutral-900/90 p-5 shadow-[0_24px_80px_-40px_rgba(16,185,129,0.45)] sm:rounded-3xl sm:p-6">
              <div className="mb-4">
                <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Where it fits
                </span>
                <h2 className="mt-4 text-xl font-semibold text-white sm:text-2xl">
                  Built for local, hybrid, and multi-cluster paths
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Use the operator when one cluster is not enough and you want a
                  consistent Kubernetes operating model.
                </p>
              </div>

              <ul className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/50">
                {bestFitScenarios.map((item) => (
                  <li
                    key={item}
                    className="grid grid-cols-[auto_1fr] gap-3 border-t border-neutral-800/80 px-4 py-3.5 first:border-t-0"
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="m5 13 4 4L19 7"
                        />
                      </svg>
                    </span>
                    <p className="text-sm leading-6 text-gray-300">{item}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
                <p className="text-sm font-semibold text-white">
                  Operator highlights
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {operatorHighlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-gray-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Preview status
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  The operator is still in preview. Use this page to assess the
                  fit, then follow the quick start or multi-cluster guides.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              What the operator adds
            </p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              A better fit for Kubernetes-based DocumentDB environments
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-400 sm:text-lg">
              Choose the operator when one cluster is not enough and you want
              the same operating model across local, hybrid, and multi-cloud
              environments.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {operatorBenefits.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-neutral-900 sm:p-6"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 6v12M6 12h12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-800 bg-neutral-900/60 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Setup at a glance
            </p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              The operator flow in three steps
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-400 sm:text-lg">
              Use this page to understand the path. Use the docs for commands,
              topology setup, and current support details.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {setupSteps.map((item) => (
              <article
                key={item.step}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/85 p-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-sm font-semibold text-emerald-200">
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-white">
                  What to expect before you start
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
                  The operator currently targets Kubernetes 1.35+ and depends on
                  cert-manager and CloudNativePG. Cross-cluster topologies also
                  require network connectivity between clusters.
                </p>
              </div>
              <a
                href={documentdbKubernetesOperatorDocsUrl}
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
              >
                Open quick start
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-800 bg-black py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Next step
          </p>
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
            Start local, then expand
          </h2>
          <p className="mb-6 text-sm text-gray-400 sm:text-base">
            Use the quick start for a local cluster. Then continue with the
            hybrid and multi-cloud guides.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={documentdbKubernetesOperatorDocsUrl}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 sm:w-auto"
            >
              Open quick start
            </a>
            <a
              href={documentdbKubernetesOperatorGitHubUrl}
              className="inline-flex w-full items-center justify-center rounded-md border border-neutral-600 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 sm:w-auto"
            >
              GitHub repository
            </a>
            <Link
              href="/docs/getting-started"
              className="inline-flex w-full items-center justify-center rounded-md border border-neutral-600 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 sm:w-auto"
            >
              View local install guides
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
