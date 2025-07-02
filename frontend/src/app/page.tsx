'use client';
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ProcessSection from "@/components/ProcessSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
    <div className="min-h-screen">
      <HeroSection />
      
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gradient">Start Using Biometric Verify</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link href="/capture">
            <motion.div 
              className="feature-card h-full cursor-pointer"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(138, 43, 226, 0.2)" }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                Register Biometric
                <ArrowRight size={16} className="ml-2 text-primary" />
              </h3>
              <p className="text-foreground/70 mb-4">
                Register new fingerprints with associated user information. Perfect for onboarding new users to the system.
              </p>
              <div className="bg-primary/10 text-primary rounded-full py-1 px-4 text-sm inline-flex">
                Get Started
              </div>
            </motion.div>
          </Link>
          
          <Link href="/search">
            <motion.div 
              className="feature-card h-full cursor-pointer"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 206, 209, 0.2)" }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                Search Database
                <ArrowRight size={16} className="ml-2 text-secondary" />
              </h3>
              <p className="text-foreground/70 mb-4">
                Search for matching fingerprints in the database. Quick verification for existing users.
              </p>
              <div className="bg-secondary/10 text-secondary rounded-full py-1 px-4 text-sm inline-flex">
                Start Searching
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
      
      <FeaturesSection />
      <ProcessSection />
      <CtaSection />
      <Footer />
    </div>
    </>
  );
}