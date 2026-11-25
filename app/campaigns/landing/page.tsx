import AgentPrompts from "../../components/campaign/AgentPrompts";
import CampaignFilm from "../../components/campaign/CampaignFilm";
import { getMetadata } from "../../services/metadataService";
import { withBasePath } from "../../services/sitePath";

const title = "DocumentDB - The Open-Source Document Database built on PostgreSQL";
const description = "Try Agent-Kit with a prompt. Build a working app on DocumentDB, the MIT-licensed document database built on PostgreSQL.";

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
        tagline="DocumentDB. Built on PostgreSQL. MIT licensed."
        heading="The Open-Source Document Database built on PostgreSQL"
        description={description}
        primary={primary}
        secondary={secondary}
      >
        <AgentPrompts primary={primary} secondary={secondary} />
      </CampaignFilm>
    </main>
  );
}
