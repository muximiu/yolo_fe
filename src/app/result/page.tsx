"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "../page.module.css";

interface Detection {
  id: number;
  class_name: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface ResultData {
  inference_image_path: string;
  original_image_path: string;
  detections: Detection[];
  detection_count: number;
}

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setResultData(parsedData);
        
        const baseUrl = "https://yolo-server-fnyw.onrender.com";
        setImageUrl(`${baseUrl}${parsedData.inference_image_path}`);
      } catch (error) {
        console.error('Error parsing result data:', error);
      }
    } else {
      // Redirect back to home if no data
      router.push('/');
    }
  }, [searchParams, router]);

  const handleBackClick = () => {
    router.push('/');
  };

  if (!resultData || !imageUrl) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <h1 className={styles.title}>Loading results...</h1>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Inference Result</h1>
        
        <div className={styles.resultContainer}>
          {/* <h2>Inference Result</h2> */}
          {/* <p>Found {resultData.detection_count}</p> */}
          {/* <br />           */}
          <div className={styles.previewContainer}>
            <img 
              src={imageUrl} 
              alt="Inference Result" 
              style={{ objectFit: 'contain', maxWidth: '90%', maxHeight: '100%' }}
            />
          </div>
          
          {/* {resultData.detections.length > 0 && (
            <div className={styles.detectionsContainer}>
              <h3>Detections</h3>
              <ul className={styles.detectionsList}>
                {resultData.detections.map(detection => (
                  <li key={detection.id} className={styles.detectionItem}>
                    <strong>{detection.class_name}</strong> - Confidence: {(detection.confidence * 100).toFixed(2)}%
                  </li>
                ))}
              </ul>
            </div>
          )} */}
          
          <button 
            className={styles.backButton} 
            onClick={handleBackClick}
          >
            Back to Upload
          </button>
        </div>
      </main>
    </div>
  );
} 