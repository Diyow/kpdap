import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  href: string;
  text: string;
  className?: string;
}

export default function BackLink({ href, text, className = "" }: BackLinkProps) {
  return (
    <Link 
      href={href} 
      className={`inline-flex items-center gap-2 text-brand-green font-medium hover:text-brand-darkgreen mb-6 group transition-colors w-fit ${className}`}
    >
      <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
      {text}
    </Link>
  );
}
