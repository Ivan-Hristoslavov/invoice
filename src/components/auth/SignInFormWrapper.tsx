"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { SignInForm } from "./SignInForm";
import { APP_NAME } from "@/config/constants";

export function SignInFormWrapper() {
  return (
    <div className="relative w-full">
      {/* Animated background elements */}
        
        <motion.div
          className="absolute -bottom-32 -left-20 w-96 h-96 bg-primary/5 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 0.5,
            y: [0, -20, 0],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            delay: 1,
            opacity: { duration: 2 }
          }}
        />
        
        {/* Animated lines */}
        <svg className="absolute top-0 left-0 w-full h-full">
          <motion.path
            d="M0,100 Q150,150 300,100 T600,100"
            stroke="rgba(99, 102, 241, 0.1)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.2,
              y: [0, 10, 0] 
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              repeatType: "reverse",
              opacity: { duration: 1 }
            }}
          />
          <motion.path
            d="M0,200 Q150,250 300,200 T600,200"
            stroke="rgba(99, 102, 241, 0.05)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.1,
              y: [0, -10, 0] 
            }}
            transition={{ 
              duration: 7, 
              repeat: Infinity, 
              repeatType: "reverse",
              delay: 0.5,
              opacity: { duration: 1 }
            }}
          />
        </svg>

      <div className="relative z-10">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
} 