import CommandSnippet from "../components/CommandSnippet";
import { getMetadata } from "../services/metadataService";
import {
  documentdbKubernetesOperatorDocsUrl,
  documentdbKubernetesOperatorGitHubUrl,
} from "../services/externalLinks";

type OperatorBenefitIcon =
  | "database"
  | "foundation"
  | "globe"
  | "replication"
  | "shield"
  | "terminal";

const operatorBenefits = [
  {
    eyebrow: "Workloads",
    title: "Document workloads",
    description:
      "Run DocumentDB with client drivers and tools, then manage it with Kubernetes custom resources.",
    highlights: ["Client drivers", "Tools", "CRDs"],
    icon: "database" as const,
  },
  {
    eyebrow: "Foundation",
    title: "Built on PostgreSQL",
    description:
      "Use CloudNativePG and PostgreSQL under the hood while keeping a document database workflow on Kubernetes.",
    highlights: ["PostgreSQL", "CloudNativePG", "ACID"],
    icon: "foundation" as const,
  },
  {
    eyebrow: "Topology",
    title: "Hybrid and multi-cloud",
    description:
      "Use one operator model across kind, minikube, AKS, EKS, GKE, and connected on-prem clusters.",
    highlights: ["kind + minikube", "AKS / EKS / GKE", "On-prem"],
    icon: "globe" as const,
  },
  {
    eyebrow: "Resilience",
    title: "Failover and recovery",
    description:
      "Add automatic failover, cross-cluster replication, and Backup and ScheduledBackup workflows for recovery.",
    highlights: ["Automatic failover", "Cross-cluster", "Backup CRDs"],
    icon: "replication" as const,
  },
  {
    eyebrow: "Security",
    title: "TLS and access controls",
    description:
      "Choose from four TLS modes and integrate with secrets, SCRAM auth, RBAC, and secure cluster networking.",
    highlights: ["4 TLS modes", "SCRAM", "RBAC"],
    icon: "shield" as const,
  },
  {
    eyebrow: "Operations",
    title: "Day-2 operations",
    description:
      "Use the kubectl plugin plus events and metrics to inspect status, troubleshoot, and promote a new primary when needed.",
    highlights: ["kubectl plugin", "Events", "Metrics"],
    icon: "terminal" as const,
  },
] as const;

function OperatorBenefitGlyph({ icon }: { icon: OperatorBenefitIcon }) {
  switch (icon) {
    case "database":
      return (
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
            d="M4 7.5C4 5.567 7.582 4 12 4s8 1.567 8 3.5S16.418 11 12 11 4 9.433 4 7.5Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 12c0 1.933 3.582 3.5 8 3.5s8-1.567 8-3.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 16.5C4 18.433 7.582 20 12 20s8-1.567 8-3.5"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 7.5v9M20 7.5v9"
          />
        </svg>
      );
    case "foundation":
      return (
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
            d="M4 8h16M4 12h16M4 16h16"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M6 5h12v14H6z"
          />
        </svg>
      );
    case "globe":
      return (
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
            d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9m0-18c-2.5 2.4-4 5.6-4 9s1.5 6.6 4 9"
          />
        </svg>
      );
    case "replication":
      return (
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
            d="M4 7h13m0 0-3-3m3 3-3 3M20 17H7m0 0 3-3m-3 3 3 3"
          />
        </svg>
      );
    case "shield":
      return (
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
            d="M12 3 5 6v6c0 5 3.4 8 7 9 3.6-1 7-4 7-9V6l-7-3Zm-2.5 9 1.7 1.7L14.8 10"
          />
        </svg>
      );
    case "terminal":
      return (
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
            d="M4 6h16v12H4V6Zm4 4 2 2-2 2m4 0h4"
          />
        </svg>
      );
  }
}

const setupSteps = [
  {
    step: "01",
    title: "Prepare the cluster",
    description:
      "Use kind or minikube locally, or a Kubernetes 1.35+ cluster such as AKS, EKS, or GKE to run the operator preview.",
  },
  {
    step: "02",
    title: "Install the operator",
    description:
      "Install cert-manager, then add the DocumentDB operator with Helm. CloudNativePG is included as a chart dependency.",
  },
  {
    step: "03",
    title: "Create a DocumentDB resource",
    description:
      "Apply a DocumentDB custom resource to launch a document database built on PostgreSQL, then expand into replicated topologies as needed.",
  },
] as const;

const operatorHighlights = [
  "Document workloads",
  "Built on PostgreSQL",
  "MIT licensed",
  "Automatic failover",
  "Backup + ScheduledBackup CRDs",
  "AKS / EKS / GKE",
  "kubectl plugin workflows",
  "Prometheus-ready",
] as const;

const bestFitScenarios = [
  "Teams moving document workloads from local clusters to managed Kubernetes.",
  "Platform teams standardizing PostgreSQL-backed DocumentDB operations across cloud and on-prem clusters.",
  "Operators that need failover, backup, promotion, and recovery workflows across clusters.",
] as const;

const operatorQuickStartCommand = `helm repo add documentdb https://documentdb.github.io/documentdb-kubernetes-operator
helm install documentdb-operator documentdb/documentdb-operator \\
  --namespace documentdb-operator --create-namespace`;

export const metadata = getMetadata({
  title: "DocumentDB Kubernetes Operator",
  description:
    "Run DocumentDB on Kubernetes with a PostgreSQL foundation, replication, HA, backups, TLS, and hybrid or multi-cloud topologies.",
  extraKeywords: [
    "Kubernetes",
    "operator",
    "Helm",
    "document database",
    "PostgreSQL",
    "CloudNativePG",
    "multi-cloud",
    "hybrid",
    "on-prem",
    "cross-cluster replication",
    "high availability",
    "backup",
    "ScheduledBackup",
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
                Run DocumentDB on Kubernetes.{" "}
                <span className="inline-block">Built on PostgreSQL for local, hybrid, and multi-cloud paths.</span>
              </p>
              <p className="mb-7 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
                Install with Helm, manage with custom resources, and add
                failover, replication, backups, TLS, and day-2 workflows from a
                single operator model.
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
              </div>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {operatorHighlights.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-neutral-700 bg-neutral-800/80 px-3.5 py-1.5 text-xs text-gray-200 sm:text-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-neutral-900/90 p-5 shadow-[0_24px_80px_-40px_rgba(16,185,129,0.45)] sm:rounded-3xl sm:p-6">
              <div className="mb-4">
                <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Where it fits
                </span>
                <h2 className="mt-4 text-xl font-semibold text-white sm:text-2xl">
                  Built for Kubernetes-native document database operations
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  Use the operator when you want DocumentDB on PostgreSQL with
                  Kubernetes-native lifecycle management for local clusters, HA
                  topologies, or multi-cluster deployments.
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
                  Preview status
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  The operator is still in preview. Use this page to assess fit,
                  then follow the quick start or multi-cluster guides for the
                  current support envelope.
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
              The operator adds Kubernetes-native lifecycle management,
              recovery, and cross-cluster workflows on top of DocumentDB.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {operatorBenefits.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-neutral-900 sm:p-6"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                  <OperatorBenefitGlyph icon={item.icon} />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  {item.eyebrow}
                </p>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {item.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-gray-200"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
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

          <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6">
            <div className="mb-4 max-w-3xl">
              <p className="text-sm font-semibold text-white">See the install shape</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Install cert-manager first, then add the operator chart. The
                chart includes CloudNativePG as a dependency.
              </p>
            </div>
            <CommandSnippet command={operatorQuickStartCommand} label="Helm" />
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
                  The operator preview targets Kubernetes 1.35+, requires
                  cert-manager to be installed first, and uses CloudNativePG
                  under the hood. Cross-cluster topologies also require network
                  connectivity between clusters and the documented multi-cluster
                  setup.
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
            Start with the quick start, then expand
          </h2>
          <p className="mb-6 text-sm text-gray-400 sm:text-base">
            Use the quick start to launch the operator, then continue with
            replication, hybrid, and multi-cluster guides.
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
          </div>
        </div>
      </section>
    </div>
  );
}
