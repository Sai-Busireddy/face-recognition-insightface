
import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Shield, Zap, Clock, Database, Users } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Fingerprint className="h-10 w-10" />,
      title: 'Multi-modal Biometrics',
      description: 'Combine fingerprints and other biometric identifiers for layered security and enhanced accuracy.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30'
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: 'Bank-level Security',
      description: 'End-to-end encryption and secure storage protocols ensure your biometric data remains protected.',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary/30'
    },
    {
      icon: <Zap className="h-10 w-10" />,
      title: 'Lightning Fast',
      description: 'Results in milliseconds with our optimized algorithms and distributed computing infrastructure.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30'
    },
    {
      icon: <Clock className="h-10 w-10" />,
      title: 'Real-time Monitoring',
      description: 'Track verification status and receive instant notifications for security events.',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30'
    },
    {
      icon: <Database className="h-10 w-10" />,
      title: 'Scalable Database',
      description: 'Handles billions of records with intelligent indexing and retrieval systems.',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary/30'
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: 'Cross-platform Integration',
      description: 'Integrate seamlessly with existing workflows through our comprehensive API.',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30'
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Powerful <span className="text-gradient">Features</span> for Modern Identity Verification
          </motion.h2>
          <motion.p 
            className="text-foreground/70"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our state-of-the-art technology combines advanced algorithms and secure infrastructure 
            to deliver unmatched biometric verification.
          </motion.p>
        </div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="feature-card group"
              variants={itemVariants}
            >
              <div className={`rounded-lg p-4 inline-flex ${feature.bgColor} mb-4`}>
                <div className={`${feature.color}`}>{feature.icon}</div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 group-hover:text-gradient transition-all duration-300">
                {feature.title}
              </h3>
              
              <p className="text-foreground/70">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
