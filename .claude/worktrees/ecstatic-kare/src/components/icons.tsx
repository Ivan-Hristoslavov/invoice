import React from "react";
import { CreditCard as CreditCardIcon } from "lucide-react";

export function CreditCard(props: React.SVGProps<SVGSVGElement>) {
  return <CreditCardIcon {...props} />;
}

export function ApplePayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6.66 17.52A5.11 5.11 0 0 1 12 13.35c2.07 0 4.72 2.15 6.68 2.15 2.12 0 3.5-1.98 3.5-4 0-1.58-.9-3.27-2-4.12C18.93 6.26 17.05 6 15.5 6c-1.94 0-4.7 1.07-6.86 1.07A5.82 5.82 0 0 1 6.66 17.5z" />
      <path d="M6.67 13.33a3.33 3.33 0 0 1 3.33-3.33 3.33 3.33 0 0 1 3.33 3.33 3.33 3.33 0 0 1-3.33 3.33 3.33 3.33 0 0 1-3.33-3.33z" />
    </svg>
  );
}

export function GooglePayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.7 13.5H12v4h8a7.84 7.84 0 0 1-2.91 4.4 11.36 11.36 0 0 1-8.29 1.7 10.07 10.07 0 0 1-7.31-6.4A13.17 13.17 0 0 1 4.44 7.8c1.11-1.51 2.52-2.63 4.36-2.8 1.81-.17 3.57.3 5.12 1.61l3.93-3.9a10.8 10.8 0 0 0-8.37-1.79C5.26 1.5 1.9 5.2 2.01 9.47v5.53c.1 3.59 2.4 6.8 5.6 8.4 3.54 1.76 7.82 1.23 10.95-.87a10.63 10.63 0 0 0 3.4-4.4c.62-1.7.61-6.53.02-8.63-1.2-1.1-4.28-2.02-4.28-2.02V13.5z" />
    </svg>
  );
} 