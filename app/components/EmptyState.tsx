import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref
}: EmptyStateProps) {
  return (
    <div className="flex-1 w-full flex flex-col bg-brand-lightbg items-center justify-center py-20 min-h-[60vh] px-4">
      <Icon size={64} className="text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold text-brand-text mb-2 text-center">{title}</h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">{description}</p>
      <Link 
        href={actionHref} 
        className="bg-brand-green text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-darkgreen transition-colors"
      >
        {actionText}
      </Link>
    </div>
  );
}
