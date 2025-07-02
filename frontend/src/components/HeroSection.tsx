import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Fingerprint, Shield, Check, Star } from 'lucide-react';
import Link from 'next/link';

const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section 
      ref={ref}
      className="relative min-h-screen overflow-hidden grid-pattern flex items-center pt-20"
    >
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -inset-[10%] opacity-30"
          style={{ y: backgroundY }}
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/30 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/30 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-accent/20 blur-[80px]" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ y: textY }}
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 border border-primary/30 mb-4">
              <span className="text-sm font-medium text-primary">Next-Gen Identity Verification</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="text-gradient glow-text">Biometric</span> Verification 
              <br />Reimagined for the Future
            </h1>
            
            <p className="text-lg text-foreground/80 max-w-lg">
              Advanced fingerprint and thumb recognition that works in milliseconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/capture" className="hero-button group flex items-center gap-2">
                <span className="text-white font-bold">Try it now</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link href="/search" className="hero-button group flex items-center gap-2">
                <span className="text-white font-bold">Search</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-secondary/20 rounded-full">
                  <Check className="h-4 w-4 text-secondary" />
                </div>
                <span className="text-sm text-foreground/70">99.9% Accuracy</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary/20 rounded-full">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground/70">ISO 27001 Certified</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1 bg-accent/20 rounded-full">
                  <Star className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm text-foreground/70">Trusted by 500+ Companies</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative">
              {/* Main Image */}
              <div className="rounded-xl overflow-hidden border border-muted glow">
                <div className="relative z-10 bg-card p-6 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                  
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Fingerprint className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Fingerprint Scan</h3>
                        <p className="text-sm text-muted-foreground">Secure identity verification</p>
                      </div>
                    </div>
                    
                    <div className="aspect-video bg-background/50 rounded-lg overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-56 bg-muted/30 rounded-lg border border-primary/20 relative animate-pulse-glow">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Fingerprint className="h-20 w-20 text-primary/60" />
                          </div>
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <div className="h-1 w-24 bg-primary/40 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Scan indicator */}
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary animate-shimmer" style={{
                        backgroundSize: '80rem 100%',
                        backgroundImage: 'linear-gradient(to right, transparent, rgba(138, 43, 226, 0.5), transparent)'
                      }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm flex flex-col">
                        <span className="text-muted-foreground">Status</span>
                        <span className="text-foreground font-medium flex items-center gap-1">
                          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                          Processing
                        </span>
                      </div>
                      
                      <div className="text-sm flex flex-col items-end">
                        <span className="text-muted-foreground">Match Score</span>
                        <span className="text-primary font-medium">98.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -right-6 -bottom-6 p-4 bg-card rounded-lg border border-muted shadow-lg animate-float">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium">Match Found</span>
                </div>
              </div>
              
              <div className="absolute -left-4 top-1/4 p-3 bg-card rounded-lg border border-muted shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-secondary" />
                  </div>
                  <span className="text-xs font-medium">Secure</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
