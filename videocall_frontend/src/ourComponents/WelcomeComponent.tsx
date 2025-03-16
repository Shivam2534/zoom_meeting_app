"use client";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { VideoIcon } from "lucide-react";
import { Link } from "react-router-dom";

function WelcomeComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-xl rounded-2xl border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary mb-2">
            Hey 👋, Welcome!
          </CardTitle>
          <p className="text-sm text-gray-600">
            Ready to connect with others? Start a video call and experience
            seamless communication.
          </p>
        </CardHeader>
        <Link to={"/sender"}>
          <CardContent className="flex flex-col items-center gap-4 mt-4">
            <VideoIcon className="h-12 w-12 text-primary mb-2" />
            <Button size="lg" className="w-full">
              Start a Video Call
            </Button>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}

export { WelcomeComponent };
