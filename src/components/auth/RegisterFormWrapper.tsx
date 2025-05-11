"use client";

import { motion } from "framer-motion";
import { RegisterForm } from "./RegisterForm";
import { APP_NAME } from "@/config/constants";

export function RegisterFormWrapper() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Animated circles */}
        <motion.div
          className="absolute top-10 -right-20 w-80 h-80 bg-primary/10 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 0.5,
            y: [0, 15, 0],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            opacity: { duration: 2 }
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-10 w-72 h-72 bg-primary/5 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 0.5,
            y: [0, -20, 0],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            delay: 1,
            opacity: { duration: 2 }
          }}
        />
        
        {/* Animated triangle accent */}
        <motion.div 
          className="absolute top-1/3 right-1/4 h-12 w-12"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.3,
            scale: 1,
            rotate: [0, 180],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            opacity: { duration: 3 }
          }}
        >
          <div className="h-full w-full bg-primary/20 rotate-45"></div>
        </motion.div>
        
        {/* Animated lines */}
        <svg className="absolute top-0 left-0 w-full h-full">
          <motion.path
            d="M0,150 Q100,200 250,150 T500,150"
            stroke="rgba(99, 102, 241, 0.1)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.2,
              y: [0, 20, 0] 
            }}
            transition={{ 
              duration: 7, 
              repeat: Infinity, 
              repeatType: "reverse",
              opacity: { duration: 1 }
            }}
          />
          <motion.path
            d="M0,300 Q200,350 350,300 T600,300"
            stroke="rgba(99, 102, 241, 0.05)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.1,
              y: [0, -15, 0] 
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              repeatType: "reverse",
              delay: 1,
              opacity: { duration: 1 }
            }}
          />
        </svg>
      </div>

      <div className="relative z-10">
        <RegisterForm />
      </div>
    </div>
  );
} 