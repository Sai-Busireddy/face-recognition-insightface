"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ImageIcon, CheckCircle2 } from "lucide-react";

interface ImagePreviewProps {
  faceImage?: string;
  thumbImage?: string;
}

export default function ImagePreview({ faceImage, thumbImage }: ImagePreviewProps) {
  return (
    <Card className="h-full flex flex-col glass animate-fade-in border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <span>Image Preview</span>
          </motion.div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <motion.div 
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Face Image</span>
            {faceImage && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
          </div>
          <motion.div 
            className="w-80 h-80 bg-muted/30 rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-sm border border-primary/10 relative group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {faceImage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex items-center justify-center"
              >
                <Image
                  src={faceImage}
                  alt="Face Preview"
                  width={320}
                  height={320}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ) : (
              <motion.div 
                className="text-muted-foreground flex flex-col items-center p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <ImageIcon className="w-12 h-12 text-primary/50" />
                </div>
                <span className="text-center">Face Image Preview</span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        <motion.div 
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Thumb Image</span>
            {thumbImage && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </motion.div>
            )}
          </div>
          <motion.div 
            className="w-80 h-80 bg-muted/30 rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-sm border border-primary/10 relative group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {thumbImage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex items-center justify-center"
              >
                <Image
                  src={thumbImage}
                  alt="Thumb Preview"
                  width={320}
                  height={320}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ) : (
              <motion.div 
                className="text-muted-foreground flex flex-col items-center p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <ImageIcon className="w-12 h-12 text-primary/50" />
                </div>
                <span className="text-center">Thumb Image Preview</span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
