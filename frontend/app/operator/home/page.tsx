"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";

interface Request {
  id: string;
  userEmail: string;
  message: string;
  timestamp: Date;
  isNew: boolean;
}

export default function OperatorHomePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [newRequestCount, setNewRequestCount] = useState(0);
  const router = useRouter();

  const playNotificationSound = () => {
    const audio = document.getElementById(
      "notificationSound"
    ) as HTMLAudioElement;
    if (audio) {
      audio.play().catch((e) => console.error("Error playing sound:", e));
    }
  };

  // Fetch requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/request/requests", {
          method: "GET",
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGZiODExNzExNDE1Zjk0Yzg3ZDg2YiIsInJvbGUiOiJvcGVyYXRvciIsImVtYWlsIjoib3BlcmF0b3JAZXhhbXBsZS5jb20iLCJpYXQiOjE3NDU5ODQyNzksImV4cCI6MTc0NjA3MDY3OX0.u3V3xRYJ85gLpcx5RdxWe73TGYbAhFHuvfJ_RW3CRHE`, // Make sure to use the correct token
          },
        });
        const data = await res.json();

        const mappedRequests = data.map((req: any) => ({
          id: req._id,
          userEmail: req.userId?.email || "Unknown User",
          message: req.message,
          timestamp: new Date(req.createdAt),
          isNew: req.status === "pending",
        }));

        setRequests(mappedRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();

    // Initialize socket.io client
    const socketInstance = io("http://localhost:8000", {
      autoConnect: true,
      reconnectionAttempts: 5,
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("Connected to socket server");
    });

    socketInstance.on("new_request", (data) => {
      const newRequest: Request = {
        id: data.id,
        userEmail: data.userEmail,
        message: data.message,
        timestamp: new Date(),
        isNew: true,
      };

      setRequests((prev) => [newRequest, ...prev]); // Add the new request at the top
      setNewRequestCount((prev) => prev + 1); // Increase the new request count
      playNotificationSound(); // Play notification sound
    });
    socketInstance.connect();
    // Clean up socket connection on component unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    const acceptedRequest = requests.find((req) => req.id === requestId);

    if (!acceptedRequest) {
      toast.error("Request not found.");
      return;
    }

    toast.success("Request accepted! Redirecting to chat...");

    try {
      const res = await fetch(
        `http://localhost:8000/api/request/accept/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGZiODExNzExNDE1Zjk0Yzg3ZDg2YiIsInJvbGUiOiJvcGVyYXRvciIsImVtYWlsIjoib3BlcmF0b3JAZXhhbXBsZS5jb20iLCJpYXQiOjE3NDU5ODQyNzksImV4cCI6MTc0NjA3MDY3OX0.u3V3xRYJ85gLpcx5RdxWe73TGYbAhFHuvfJ_RW3CRHE`, // Use correct token
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to accept request.");
        return;
      }

      if (data.roomId) {
        setTimeout(() => {
          router.push(`/chat/${data.roomId}`);
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while accepting the request.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <audio id="notificationSound" src="/notification.mp3" />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Operator Dashboard</h1>
        </div>

        <div className="flex items-center mb-6">
          <h2 className="text-xl font-semibold">Support Requests</h2>
          {newRequestCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {newRequestCount} new
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className={`transition-all duration-300 ${
                request.isNew ? "animate-fade-in border-green-500" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{request.userEmail}</CardTitle>
                  {request.isNew && <Badge variant="secondary">New</Badge>}
                </div>
                <CardDescription>
                  {new Date(request.timestamp).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="line-clamp-3">{request.message}</p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleAcceptRequest(request.id)}
                  className="w-full"
                >
                  Accept Request
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="text-center p-10 border rounded-lg">
            <p className="text-muted-foreground">
              No support requests at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
