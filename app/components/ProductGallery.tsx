"use client";

import { useState } from "react";
import Image from "next/image";

type ProductGalleryProps = {
  thumbnail: string;
  images: string[];
  title: string;
};

export default function ProductGallery({ thumbnail, images, title }: ProductGalleryProps) {
  const allImages = [thumbnail, ...(images || [])].filter(Boolean);
  const [activeImage, setActiveImage] = useState(allImages[0]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Main Image */}
      <div className="relative w-full aspect-square md:aspect-auto md:flex-1 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                activeImage === img ? "border-brand-green" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${title} ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
