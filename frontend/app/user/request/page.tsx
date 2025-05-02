"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import toast from "react-hot-toast";
import { io, type Socket } from "socket.io-client";

export default function UserRequestPage() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:8000", {
      autoConnect: false,
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("Connected to socket server", socketInstance.id);
    });

    socketInstance.on("request_accepted", (data) => {
      console.log("Request accepted data:", data);
      setStatus(`Your request has been accepted! Redirecting to chat...`);
      toast.success("Request accepted by an operator!");

      setIsLoading(true);
      setTimeout(() => {
        window.location.href = `/chat/${data.roomId}`;
      }, 2000);
    });

    socketInstance.connect();
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // 🟢 Polling: check status every 5s when requestId changes
  useEffect(() => {
    if (!requestId) return;

    const interval = setInterval(() => {
      checkRequestStatus(requestId);
    }, 5000);

    return () => clearInterval(interval);
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/request/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGZiODQ0NzExNDE1Zjk0Yzg3ZDg2ZiIsInJvbGUiOiJ1c2VyIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzQ2MDE0MTYwLCJleHAiOjE3NDYxMDA1NjB9.MdHRl4pRuXExeO76egK38q5jouI7TOi5ybgAzCitThg`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Failed to create request");
      }

      const data = await response.json();
      const newRequestId = data.request._id;

      setRequestId(newRequestId);
      setStatus("Request sent! Waiting for an operator to respond...");
      toast.success("Request sent successfully!");

      if (socket && socket.connected) {
        socket.emit("new_request", { id: newRequestId, message });
        console.log("📤 Emitting new_request with ID:", newRequestId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send request");
    } finally {
      setIsLoading(false);
    }
  };

  const checkRequestStatus = async (requestId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/request/check-status/${requestId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGZiODQ0NzExNDE1Zjk0Yzg3ZDg2ZiIsInJvbGUiOiJ1c2VyIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzQ2MDE0MTYwLCJleHAiOjE3NDYxMDA1NjB9.MdHRl4pRuXExeO76egK38q5jouI7TOi5ybgAzCitThg`,
        }
      }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Poll result:", data);

        if (data.status === "accepted") {
          setStatus("Request accepted, redirecting to chat room...");
          setIsLoading(true);
          window.location.href = `/chat/${data.roomId}`;
        }
      } else {
        toast.error("Failed to check request status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error checking request status");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Support Request</CardTitle>
          <CardDescription className="text-center">
            Describe your issue and we&apos;ll connect you with an operator
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status && (
            <Alert className="mb-4">
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Describe your issue here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="resize-none"
                disabled={isLoading || !!requestId}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !message.trim() || !!requestId}
            >
              {isLoading ? "Sending..." : "Send Request"}
            </Button>

            {requestId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setRequestId(null);
                  setStatus(null);
                  setMessage("");
                }}
              >
                New Request
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
