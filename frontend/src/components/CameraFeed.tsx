"use client";

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, RotateCcw, Check, X, Crop as CropIcon } from "lucide-react";
import { motion } from "framer-motion";

type CaptureType = "face" | "thumb";

interface CameraFeedProps {
  onCapture: (imgSrc: string, type: CaptureType) => void;
}

export default function CameraFeed({ onCapture }: CameraFeedProps) {
  const webcamRef = useRef<Webcam>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [captureType, setCaptureType] = useState<CaptureType>("thumb");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setIsCameraOn(false);
        setIsCropping(true);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setCapturedImage(reader.result);
          setIsCropping(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = crop.width;
        canvas.height = crop.height;

        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width,
          crop.height
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.9);
      });
    },
    []
  );

  const applyCrop = async () => {
    if (completedCrop && imgRef.current && onCapture) {
      try {
        const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
        onCapture(croppedImageUrl, captureType);
        resetCropState();
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
  };

  const skipCrop = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage, captureType);
      resetCropState();
    }
  };

  const cancelCrop = () => {
    resetCropState();
  };

  const resetCropState = () => {
    setCapturedImage(null);
    setIsCropping(false);
    setCrop({
      unit: '%',
      width: 50,
      height: 50,
      x: 25,
      y: 25
    });
    setCompletedCrop(undefined);
  };

  return (
    <Card className="h-full flex flex-col glass animate-fade-in border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              {isCropping ? (
                <CropIcon className="w-6 h-6 text-primary" />
              ) : (
                <Camera className="w-6 h-6 text-primary" />
              )}
            </div>
            <span>{isCropping ? "Crop Image" : "Camera Feed"}</span>
          </motion.div>
          {!isCropping && (
            <Select value={captureType} onValueChange={v => setCaptureType(v as CaptureType)}>
              <SelectTrigger className="w-40 input-animated bg-background/50 backdrop-blur-sm">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="face">Face Capture</SelectItem>
                <SelectItem value="thumb">Thumb Capture</SelectItem>
              </SelectContent>
            </Select>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div 
          className={`w-full ${isCropping ? 'min-h-[400px]' : 'aspect-video'} bg-muted/30 rounded-xl flex items-center justify-center relative overflow-hidden backdrop-blur-sm border border-primary/10`}
          whileHover={{ scale: isCropping ? 1 : 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {isCropping && capturedImage ? (
            <motion.div 
              className="w-full flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined}
                className="w-full max-h-[60vh] flex items-center justify-center"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={capturedImage}
                  className="max-w-full max-h-[60vh] w-auto h-auto object-contain rounded-xl"
                />
              </ReactCrop>
            </motion.div>
          ) : isCameraOn ? (
            <motion.div 
              className="w-full h-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover rounded-xl"
                videoConstraints={{ facingMode: "user" }}
              />
            </motion.div>
          ) : (
            <motion.div 
              className="text-muted-foreground flex flex-col items-center p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Camera className="w-12 h-12 text-primary/50" />
              </div>
              <span className="text-center">Camera feed or uploaded image will appear here</span>
            </motion.div>
          )}
        </motion.div>

        {isCropping ? (
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 transition-all duration-300"
              onClick={cancelCrop}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300 transition-all duration-300"
              onClick={skipCrop}
            >
              Skip Crop
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white transition-all duration-300" 
              onClick={applyCrop}
              disabled={!completedCrop}
            >
              <Check className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 hover:border-primary/30 transition-all duration-300"
                onClick={() => setIsCameraOn((on) => !on)}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isCameraOn ? "Stop Camera" : "Start Camera"}
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-white transition-all duration-300" 
                onClick={handleCapture}
                disabled={!isCameraOn}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Capture
              </Button>
            </div>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-background text-sm text-muted-foreground">or</span>
              </div>
            </div>

            <motion.label 
              className="w-full cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-2 p-4 bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 hover:border-primary/30 transition-all duration-300">
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </motion.label>
          </>
        )}
      </CardContent>
      
      {/* Hidden canvas for cropping operations */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
}