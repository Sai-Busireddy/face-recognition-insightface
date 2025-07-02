"use client";

import { useState, useTransition, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserCircle2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface PersonFormProps {
  faceImage?: string;
  thumbImage?: string;
}

export default function PersonForm({ faceImage, thumbImage }: PersonFormProps) {
  const { data: session } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    fetchToken();
  }, []);

  async function fetchToken() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST_URL}/api/token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setToken(data.token);
    } catch (error) {
      console.error("Error fetching token:", error);
      toast.error("Failed to authenticate", {
        description: "Please try again later"
      });
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error("You must be logged in to save information.");
      return;
    }

    if (!token) {
      toast.error("Authentication required", {
        description: "Please wait while we authenticate you"
      });
      await fetchToken();
      return;
    }

    setSuccess(null);
    setError(null);
    startTransition(async () => {
      try {
        toast.info("Saving user information...");
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
          method: "POST",
          body: JSON.stringify({
            user_id : session.user.id,
            first_name: firstName,
            last_name: lastName,
            address: address,
            additional_info: additionalInfo,
            face_image: faceImage,
            thumb_image: thumbImage
          }),
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        
        const data = await res.json();
        
        if (data.success) {
          setSuccess("Saved successfully!");
          setFirstName("");
          setLastName("");
          setAddress("");
          setAdditionalInfo("");
          toast.success("Person information saved successfully!");
        } else {
          setError("Failed to save.");
          toast.error("Failed to save person information.");
        }
      } catch (err) {
        console.error('Error details:', err);
        setError("Failed to save.");
        toast.error("Failed to save person information.");
      }
    });
  };

  return (
    <Card className="glass overflow-hidden border border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-2 text-primary">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <UserCircle2 className="w-6 h-6" />
          </motion.div>
          Person Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <motion.form 
          onSubmit={handleSave} 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="space-y-2">
              <Input
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-animated bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/40"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-animated bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/40"
                required
              />
            </div>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Textarea
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-animated min-h-[80px] bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/40"
              required
            />
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Textarea
              placeholder="Additional Information"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="input-animated min-h-[100px] bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary/40"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-300 relative overflow-hidden group"
              disabled={loading || !faceImage || !thumbImage || !token}
            >
              <div className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Save Information
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
          </motion.div>

          {success && (
            <motion.div 
              className="flex items-center text-green-500 bg-green-500/10 p-3 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div 
              className="flex items-center text-red-500 bg-red-500/10 p-3 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </motion.div>
          )}
        </motion.form>
      </CardContent>
    </Card>
  );
}