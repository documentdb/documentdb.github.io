import AgentPrompts from "../../components/campaign/AgentPrompts";
import CampaignFilm from "../../components/campaign/CampaignFilm";
import { getMetadata } from "../../services/metadataService";
import { withBasePath } from "../../services/sitePath";

const title = "DocumentDB for coding agents - Build with one prompt";
const description = "Give your coding agent one prompt and get a working app on an open-source document database built on PostgreSQL.";

export const metadata = {
  ...getMetadata({ title, description, path: "/campaigns/landing/" }),
  robots: { index: false, follow: false },
};

export default function LandingPage() {
  const primary = { label: "Get it running", href: withBasePath("/docs/getting-started/") };
  const secondary = { label: "Choose your deployment", href: withBasePath("/packages/") };

  return (
    <main className="relative overflow-x-clip bg-neutral-950">
      <CampaignFilm
        tagline="Open source. Agent ready. Yours to run."
        heading="One prompt. A working app."
        description={description}
        primary={primary}
        secondary={secondary}
      >
        <AgentPrompts primary={primary} secondary={secondary} />
      </CampaignFilm>
    </main>
  );
}
