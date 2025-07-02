
import React from 'react';
import { Fingerprint } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Fingerprint className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-gradient">BiometriVerify</span>
            </div>
            <p className="text-foreground/70 mb-4">
              Next-generation biometric verification for enhanced security and seamless authentication.
            </p>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} BiometriVerify. All rights reserved.
            </p>
          </div>
          
          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <ul className="space-y-3">
              {['Fingerprint Scanner', 'Multi-modal Auth', 'Enterprise Suite', 'Developer API', 'Mobile SDK'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-foreground/70 hover:text-primary transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              {['Documentation', 'API Reference', 'Sample Code', 'Tutorials', 'Blog', 'Community'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-foreground/70 hover:text-primary transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Contact', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-foreground/70 hover:text-primary transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-muted flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            Designed for secure biometric identity verification
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-foreground/70 hover:text-primary transition-colors duration-200">
              Twitter
            </a>
            <a href="#" className="text-foreground/70 hover:text-primary transition-colors duration-200">
              LinkedIn
            </a>
            <a href="#" className="text-foreground/70 hover:text-primary transition-colors duration-200">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
