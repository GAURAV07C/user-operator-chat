"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { io, type Socket } from "socket.io-client";
import { ArrowLeft, Send, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  sender: "user" | "operator";
  content: string;
  timestamp: Date;
  type: "text" | "image";
}

export default function ChatPage() {
  const session = useSession();
  const { roomId } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobile();

  useEffect(() => {
    //   // In a real app, connect to your actual Socket.IO server
    const socketInstance = io("http://localhost:8000", {
      autoConnect: false,
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("Connected to socket server");
      // Join the room
      socketInstance.emit("join_room", { roomId });
    });

    socketInstance.on("message", (data) => {
      const newMessage: Message = {
        id: data.id,
        sender: data.sender,
        content: data.content,
      
        timestamp: new Date(data.timestamp),
        type: data.type || "text",
      };

      setMessages((prev) => [...prev, newMessage]);
    });

    //   // Simulate connection in development
    //   setSocket(socketInstance);

    //   // Simulate initial messages
    //   // const initialMessages: Message[] = [
    //   //   {
    //   //     id: "m_1",
    //   //     sender: "user",
    //   //     content: "Hello, I need help with my order",
    //   //     timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    //   //     type: "text",
    //   //   },
    //   //   {
    //   //     id: "m_2",
    //   //     sender: "operator",
    //   //     content:
    //   //       "Hi there! I'd be happy to help. Could you please provide your order number?",
    //   //     timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
    //   //     type: "text",
    //   //   },
    //   //   {
    //   //     id: "m_3",
    //   //     sender: "user",
    //   //     content: "My order number is #12345",
    //   //     timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
    //   //     type: "text",
    //   //   },
    //   //   {
    //   //     id: "m_4",
    //   //     sender: "operator",
    //   //     content: "Thank you! Let me check that for you.",
    //   //     timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    //   //     type: "text",
    //   //   },
    //   // ];

    //   // setMessages(initialMessages);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomId) return;

      try {
        const res = await fetch(`http://localhost:8000/api/chat/${roomId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MGZiODExNzExNDE1Zjk0Yzg3ZDg2YiIsInJvbGUiOiJvcGVyYXRvciIsImVtYWlsIjoib3BlcmF0b3JAZXhhbXBsZS5jb20iLCJpYXQiOjE3NDU5ODQyNzksImV4cCI6MTc0NjA3MDY3OX0.u3V3xRYJ85gLpcx5RdxWe73TGYbAhFHuvfJ_RW3CRHE`, // Make sure to use the correct token
          },
        });
        const data = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fetchedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg._id,
          sender: msg.senderId === session.data?.user?.role ? "operator" : "user",
          content: msg.message,
          timestamp: new Date(msg.timestamp),
          type: msg.type,
        }));

        setMessages(fetchedMessages);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();
  }, [roomId, session.data?.user?.role]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!input.trim()) return;

    setIsLoading(true);

    try {
      // Send message to the backend API
      const res = await fetch("http://localhost:8000/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data?.user?.accessToken}`, // Use the user's token for authentication
        },
        body: JSON.stringify({
          roomId,
          senderId: session.data?.user?.id ,
          message: input,
          role: session.data?.role,
          type: "text",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      // setSocket(data);
      // Update frontend state with the new message
      const newMessage: Message = {
        id: data.data._id,
        sender: "operator", // Assume operator is sending the message
        content: input,
        
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, newMessage]);
      setInput(""); // Clear the input field

      // Emit the message using socket.io in case real-time updates are needed
      socket?.emit("send_message", {
        roomId,
        message: input,
      
        sender: session.data?.role,
        type: "text",
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Log file upload
    console.log("File Upload:", {
      roomId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      timestamp: new Date().toISOString(),
    });

    setIsLoading(true);

    // Simulate uploading
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;

        const newMessage: Message = {
          id: `m_${Date.now()}`,
          sender: "operator", // Assuming the current user is the operator
          content: imageUrl,
          timestamp: new Date(),
          type: "image",
        };

        setMessages((prev) => [...prev, newMessage]);
        setIsLoading(false);

        // In a real app, you would upload the image to a server and then emit the message with the image URL
        // socket?.emit('send_message', { roomId, message: imageUrl, sender: 'operator', type: 'image' });
      };
      reader.readAsDataURL(file);
    }, 1500);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-4">
          <h1 className="font-semibold">Chat Room: {roomId}</h1>
        </div>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "operator" ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={`max-w-[80%] p-3 ${
                  message.sender === "operator"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.type === "text" ? (
                  <p>{message.content}</p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={message.content || "/placeholder.svg"}
                    alt="Shared image"
                    className="max-w-full rounded-md"
                  />
                )}
                <div
                  className={`text-xs mt-1 ${
                    message.sender === "operator"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size={isMobile ? "icon" : "default"}
            disabled={!input.trim() || isLoading}
          >
            {isMobile ? <Send className="h-5 w-5" /> : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
