import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Camera, Image as ImageIcon, User, Fingerprint } from 'lucide-react';

const ProcessSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const steps = [
    {
      icon: <Camera className="h-10 w-10" />,
      title: 'Capture',
      description: 'Capture fingerprint and face images using your device camera or upload existing images.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: <ImageIcon className="h-10 w-10" />,
      title: 'Review',
      description: 'Preview and confirm the quality of the captured images before proceeding.',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      icon: <User className="h-10 w-10" />,
      title: 'Register',
      description: 'Enter personal details to associate with the biometric data and submit for registration.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: <Fingerprint className="h-10 w-10" />,
      title: 'Match & Verify',
      description: 'The system processes the images, searches for matches in the database, and instantly returns the verification result.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="process" className="py-20 relative overflow-hidden bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How It <span className="text-gradient">Works</span>
          </motion.h2>
          <motion.p 
            className="text-foreground/70"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our streamlined process delivers accurate biometric verification in milliseconds,
            all while maintaining the highest security standards.
          </motion.p>
        </div>

        <div 
          ref={ref}
          className="relative"
        >
          {/* Progress line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-muted transform -translate-x-1/2 hidden md:block"></div>
          <motion.div 
            className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-accent transform -translate-x-1/2 origin-top hidden md:block"
            style={{ height: lineWidth }}
          ></motion.div>

          <div className="space-y-16 md:space-y-0">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                className={`flex flex-col md:grid md:grid-cols-2 md:gap-8 items-center ${
                  index % 2 === 1 ? 'md:grid-flow-dense' : ''
                }`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Content Side */}
                <div className={`text-center md:text-left ${index % 2 === 1 ? 'md:col-start-2' : ''}`}>
                  <div className="hidden md:flex items-center mb-4 space-x-2">
                    <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
                    <div className="h-px w-12 bg-muted"></div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-foreground/70 max-w-md">{step.description}</p>
                </div>

                {/* Icon Side */}
                <div className={`relative mb-8 md:mb-0 ${index % 2 === 1 ? 'md:col-start-1' : ''}`}>
                  <div className="relative">
                    <div className={`w-24 h-24 rounded-full ${step.bgColor} flex items-center justify-center border border-muted mx-auto glow`}>
                      <div className={step.color}>{step.icon}</div>
                    </div>
                    
                    {/* Number label */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                  </div>

                  {/* Connector for mobile */}
                  {index < steps.length - 1 && (
                    <div className="h-12 w-1 bg-muted mx-auto mt-4 md:hidden"></div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
