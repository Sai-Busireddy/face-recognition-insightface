"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CameraFeed from "@/components/CameraFeed";
import ImagePreview from "@/components/ImagePreview";
import PersonForm from "@/components/PersonForm";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import React from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [faceImage, setFaceImage] = useState<string | undefined>();
  const [thumbImage, setThumbImage] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const handleCapture = (img: string, type: "face" | "thumb") => {
    if (type === "face") {
      setFaceImage(img);
      if (!thumbImage) setCurrentStep(2);
    } else {
      setThumbImage(img);
      if (!faceImage) setCurrentStep(2);
    }
    if (faceImage && thumbImage) setCurrentStep(3);
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mt-14 text-gradient mb-4">
            Capture Biometrics
          </h1>
          <p className="text-lg text-violet-700 dark:text-violet-300 max-w-2xl mx-auto">
            Register new fingerprint records with user information for secure identity management
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex mb-8 items-center justify-center">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <motion.div 
                className={`h-3 w-3 rounded-full ${currentStep >= step ? 'bg-primary' : 'bg-muted'}`}
                animate={{ scale: currentStep === step ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.5, repeat: currentStep === step ? Infinity : 0, repeatDelay: 1 }}
              />
              {step < 3 && (
                <div className={`h-0.5 w-16 mx-1 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <motion.div 
            className="group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`h-full transition-all duration-300 ${currentStep === 1 ? 'ring-2 ring-primary/50' : ''} group-hover:shadow-xl`}>
              <CameraFeed onCapture={handleCapture} />
            </div>
          </motion.div>

          <motion.div 
            className="group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className={`h-full transition-all duration-300 ${currentStep === 2 ? 'ring-2 ring-primary/50' : ''} group-hover:shadow-xl`}>
              <ImagePreview faceImage={faceImage} thumbImage={thumbImage} />
            </div>
          </motion.div>

          <motion.div 
            className="group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={`h-full transition-all duration-300 ${currentStep === 3 ? 'ring-2 ring-primary/50' : ''} group-hover:shadow-xl`}>
              <PersonForm faceImage={faceImage} thumbImage={thumbImage} />
            </div>
          </motion.div>
        </div>

        {/* Step descriptions */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <motion.div 
            className={`p-6 rounded-xl backdrop-blur-sm ${currentStep === 1 ? 'bg-primary/10 border border-primary/20' : 'bg-white/50 dark:bg-black/20 border border-violet-200/20 dark:border-violet-700/20'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-semibold text-lg mb-3 text-violet-900 dark:text-violet-100">Step 1: Capture Images</h3>
            <p className="text-sm text-violet-700 dark:text-violet-300">Start by capturing face and thumb images using the camera or upload existing images.</p>
          </motion.div>

          <motion.div 
            className={`p-6 rounded-xl backdrop-blur-sm ${currentStep === 2 ? 'bg-primary/10 border border-primary/20' : 'bg-white/50 dark:bg-black/20 border border-violet-200/20 dark:border-violet-700/20'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-semibold text-lg mb-3 text-violet-900 dark:text-violet-100">Step 2: Preview Images</h3>
            <p className="text-sm text-violet-700 dark:text-violet-300">Review the captured images to ensure they are clear and properly captured.</p>
          </motion.div>

          <motion.div 
            className={`p-6 rounded-xl backdrop-blur-sm ${currentStep === 3 ? 'bg-primary/10 border border-primary/20' : 'bg-white/50 dark:bg-black/20 border border-violet-200/20 dark:border-violet-700/20'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold text-lg mb-3 text-violet-900 dark:text-violet-100">Step 3: Enter Information</h3>
            <p className="text-sm text-violet-700 dark:text-violet-300">Fill in the person&apos;s details to complete the registration process.</p>
          </motion.div>
        </div>

        {/* Quick Access Button */}
        <div className="mt-12 text-center">
          <Link 
            href="/search" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:transform active:translate-y-0 group"
          >
            <Search className="w-5 h-5" />
            <span>Search Records</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
