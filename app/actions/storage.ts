"use server";

import { createClient } from "@supabase/supabase-js";


// Initialize Supabase admin client for server actions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Extracts the file path from a Supabase public URL
 */
const extractFilePath = (url: string, bucketName: string) => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const bucketIndex = pathSegments.indexOf(bucketName);
    
    if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
      // Return everything after the bucket name
      return pathSegments.slice(bucketIndex + 1).join('/');
    }
  } catch (e) {
    console.error("Invalid URL:", url);
  }
  
  // Fallback: simple string replacement
  const publicUrlBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/`;
  if (url.startsWith(publicUrlBase)) {
    return url.replace(publicUrlBase, '');
  }
  
  return null;
};

/**
 * Deletes files from a Supabase storage bucket given their public URLs
 */
export async function deleteStorageFiles(urls: string[], bucketName: string) {
  if (!urls || urls.length === 0) return { success: true };

  try {
    const filePaths = urls
      .map(url => extractFilePath(url, bucketName))
      .filter(Boolean) as string[];

    if (filePaths.length === 0) return { success: true };

    const { error } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);

    if (error) {
      console.error(`Failed to delete files from ${bucketName}:`, error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteStorageFiles:", error);
    return { success: false, error: error.message };
  }
}
