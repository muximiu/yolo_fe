"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if the device is mobile or tablet
    const checkDeviceType = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const isTablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches;
      setIsMobileOrTablet(isMobile || isTablet);
    };

    // Initial check
    checkDeviceType();

    // Add event listener for window resize
    window.addEventListener("resize", checkDeviceType);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkDeviceType);
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleTakePhoto = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Create FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Call the backend API endpoint
      const response = await fetch(
        "https://inference-server-8mhx.onrender.com/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      // Get the response as JSON
      const data = await response.json();
      
      console.log("Response received:", data);
      
      // Navigate to results page with data
      const encodedData = encodeURIComponent(JSON.stringify(data));
      router.push(`/result?data=${encodedData}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(`Inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Spaghetti Detection</h1>
        
        {isMobileOrTablet && (
          <button 
            className={styles.photoButton} 
            onClick={handleTakePhoto}
          >
            Take Photo 📷 
          </button>
        )}

        {isMobileOrTablet ? (
          <h2 className={styles.title2}>or select an image</h2>
        ) : (
          <h2 className={styles.title2}>Select a photo and then run inference</h2>
        )}
        
        <div 
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <div className={styles.previewContainer}>
              <Image 
                src={preview} 
                alt="Preview" 
                fill 
                style={{ objectFit: 'contain' }} 
              />
            </div>
          ) : (
            <div className={styles.placeholder}>
              <p>Drag and drop an image here, or click to select</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className={styles.fileInput}
          />
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.uploadButton} 
            onClick={handleUpload} 
            disabled={!file || uploading}
          >
            {uploading ? 'Processing...' : 'Run inference'}
          </button>
        </div>

        {uploadError && (
          <div className={styles.error}>
            {uploadError}
          </div>
        )}
      </main>
    </div>
  );
}
