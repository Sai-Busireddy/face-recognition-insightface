'use client';
import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react'; // Import from next-auth
import AuthCard from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, LogIn, Mail } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner'; // Import toast
import { useRouter } from 'next/navigation'; // Import useRouter

const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const SignInContent: React.FC = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/capture';
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter(); // Initialize useRouter

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Use NextAuth's signIn method with the callbackUrl
      const result = await signIn('credentials', {
        redirect: false,
        callbackUrl,
        email: values.email,
        password: values.password,
      });
      
      if (result?.error) {
        console.log("NextAuth Error:", result.error); // Add this line for debugging
        // Display specific error messages from NextAuth
        if (result.error === "Invalid email" || result.error === "Invalid password") {
          toast.error(result.error); // Display the specific error message
        } else {
          toast.error('An unexpected error occurred. Please try again.'); // Generic fallback for other errors
        }
        setIsSubmitting(false);
      } else if (result?.ok) {
        toast.success("Sign in successful!"); // Show success toast
        setIsSubmitting(false);
        router.push(callbackUrl); // Manually redirect on successful sign-in
      }
    } catch (err) {
      toast.error('An error occurred during sign in. Please check your network connection.');
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 bg-grid-pattern">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gradient mb-2">BiometriScan</h1>
        <p className="text-muted-foreground">Cutting-edge biometric verification</p>
      </motion.div>

      <AuthCard 
        title="Welcome Back" 
        description="Sign in to your account to continue"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="you@example.com" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••" 
                        className="pr-10" 
                        {...field} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></span>
                  Signing In...
                </span>
              ) : (
                <>
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </AuthCard>
    </div>
  );
};

const SignIn: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
};

export default SignIn;
