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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Define allowed image formats
  const allowedFormats = {
    mimeTypes: ["image/jpeg", "image/png", "image/bmp", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".bmp", ".webp"],
  };

  // Helper function to check if a file is a valid image format
  const isValidImageFormat = (file: File): boolean => {
    return allowedFormats.mimeTypes.includes(file.type);
  };

  // Get the list of accepted file types for input element
  const acceptedFileTypes = allowedFormats.mimeTypes.join(",");

  // Format allowed extensions for display
  const allowedExtensionsText = allowedFormats.extensions.join(", ");

  useEffect(() => {
    // Check if the device is mobile or tablet
    const checkDeviceType = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const isTablet = window.matchMedia(
        "(min-width: 768px) and (max-width: 1024px)"
      ).matches;
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

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("File input changed:", e.target.files);
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    []
  );

  const handleFile = useCallback(
    (selectedFile: File) => {
      if (!isValidImageFormat(selectedFile)) {
        setUploadError(
          `Please select a valid image format: ${allowedExtensionsText}`
        );
        return;
      }

      setFile(selectedFile);
      setUploadError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    },
    [allowedExtensionsText]
  );

  const handleTakePhoto = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Create FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Call the backend API endpoint
      const response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/predict",
        {
          method: "POST",
          body: formData,
          credentials: "omit",
          headers: {
            Accept: "*/*",
          },
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
      console.error("Error uploading file:", error);
      setUploadError(
        `Inference failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleIOSFileSelection = () => {
    const newInput = document.createElement("input");
    newInput.type = "file";
    newInput.accept = acceptedFileTypes;

    newInput.addEventListener("change", (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input?.files && input.files[0]) {
        handleFile(input.files[0]);
      }
    });

    newInput.click();
  };

  useEffect(() => {
    setInterval(() => {
      const value = fileInputRef.current?.files;
      console.log("File input value:", value);
    }, 1000);
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Spaghetti Detection</h1>

        {isMobileOrTablet && (
          <>
            <button className={styles.photoButton} onClick={handleTakePhoto}>
              Take Photo 📷
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept={acceptedFileTypes}
              capture="environment"
              onChange={handleFileInput}
              className={styles.fileInput}
            />
          </>
        )}

        {isMobileOrTablet ? (
          <h2 className={styles.title2}>or select an image</h2>
        ) : (
          <h2 className={styles.title2}>
            Select a photo and then run inference
          </h2>
        )}

        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current?.click();
            }
          }}
        >
          {preview ? (
            <div className={styles.previewContainer}>
              <Image
                src={preview}
                alt="Preview"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : (
            <div className={styles.placeholder}>
              <p>Drag and drop an image here, or click to select</p>
              <p style={{ fontSize: "0.8em", marginTop: "1em" }}>
                {allowedExtensionsText}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileInput}
            onInput={handleFileInput}
            onClick={() => {
              // Check if running on iOS Safari
              const isIOS =
                /iPad|iPhone|iPod/.test(navigator.userAgent) && true;
              const isSafari =
                /Safari/.test(navigator.userAgent) &&
                !/Chrome/.test(navigator.userAgent);

              if (isIOS && isSafari) {
                handleIOSFileSelection();
              }
            }}
            className={styles.fileInput}
          />
        </div>

        {uploadError && <div className={styles.error}>{uploadError}</div>}

        <div className={styles.actions}>
          <button
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? "Processing..." : "Run inference"}
          </button>
        </div>
      </main>
    </div>
  );
}
