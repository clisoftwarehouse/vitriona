import { CTA } from './_components/cta';
import { FAQ } from './_components/faq';
import { Hero } from './_components/hero';
import { Footer } from './_components/footer';
import { Navbar } from './_components/navbar';
import { Pricing } from './_components/pricing';
import { AIAddOn } from './_components/ai-addon';
import { Features } from './_components/features';
import { HowItWorks } from './_components/how-it-works';

export default function Home() {
  return (
    <div className='min-h-screen'>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <AIAddOn />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
