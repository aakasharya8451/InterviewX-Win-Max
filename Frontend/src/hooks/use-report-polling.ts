"use client";

import { useRef, useCallback } from "react";
import axios from "axios";

interface UseReportPollingReturn {
  startReportPolling: () => void;
  stopReportPolling: () => void;
}

export function useReportPolling(
  onReportReceived: (rating: number) => void,
  onLoadingChange: (loading: boolean) => void
): UseReportPollingReturn {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const stopReportPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    jobIdRef.current = null;
  }, []);

  const pollJobStatus = useCallback(async () => {
    if (!jobIdRef.current) return;

    try {
      const response = await axios.get(
        `http://localhost:8000/job-status/${jobIdRef.current}`
      );

      if (response.status === 200 && response.data.number) {
        // Job is complete
        const rating = response.data.number;
        if (typeof rating === "number" && rating >= 1 && rating <= 3) {
          onReportReceived(rating);
          onLoadingChange(false);
          stopReportPolling();
        }
      }
      // If status is 202, job is still processing, continue polling
    } catch (error) {
      console.error("Error polling job status:", error);
      // Continue polling even on error
    }
  }, [onReportReceived, onLoadingChange, stopReportPolling]);

  const startReportPolling = useCallback(async () => {
    onLoadingChange(true);

    try {
      // Start the report job
      const response = await axios.post("http://localhost:8000/report");

      if (response.status === 202 && response.data.job_id) {
        jobIdRef.current = response.data.job_id;
        console.log("Report job started with ID:", jobIdRef.current);

        // Start polling for job status
        pollingRef.current = setInterval(pollJobStatus, 2000); // Poll every 2 seconds
      } else if (response.status === 400) {
        // Call not ended yet
        console.error("Cannot generate report: Call not ended");
        onLoadingChange(false);
      }
    } catch (error) {
      console.error("Error starting report job:", error);
      onLoadingChange(false);
    }
  }, [onLoadingChange, pollJobStatus]);

  return {
    startReportPolling,
    stopReportPolling,
  };
}
