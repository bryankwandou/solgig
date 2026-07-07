import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ScrollProgress } from "@/components/motion";
import {
  ProofStrip,
  HowItWorks,
  AgentSection,
  SellersBuyers,
  TrustFlow,
  FeedPreview,
  FinalCta,
  Footer,
} from "@/components/landing/Sections";

export default function LandingPage() {
  return (
    <main>
      <ScrollProgress />
      <Nav />
      <Hero />
      <ProofStrip />
      <HowItWorks />
      <AgentSection />
      <SellersBuyers />
      <TrustFlow />
      <FeedPreview />
      <FinalCta />
      <Footer />
    </main>
  );
}
