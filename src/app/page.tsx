'use client'

import React, { useState } from 'react';
import { RegistrationForm } from '@/components/RegistrationForm';
import { ParticipantTable } from '@/components/ParticipantTable';
import { Users, UserPlus, LogOut, LayoutDashboard } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  const [activeTab, setActiveTab] = useState("register");

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">Sports Festival Manager</h1>
          </div>
          <Button
            onClick={() => signOut()}
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-4 mb-8 bg-white p-1 rounded-xl border shadow-sm max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("register")}
            className={`flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "register"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            New Registration
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "manage"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Participants
          </button>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === "register" && (
            <Card className="border-t-4 border-t-blue-500 shadow-md">
              <CardHeader>
                <CardTitle>Registration</CardTitle>
                <CardDescription>Enter participant details for the sports festival.</CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationForm />
              </CardContent>
            </Card>
          )}

          {activeTab === "manage" && (
            <Card className="border-t-4 border-t-green-500 shadow-md">
              <CardHeader>
                <CardTitle>Participants List</CardTitle>
                <CardDescription>View and manage registered members.</CardDescription>
              </CardHeader>
              <CardContent>
                <ParticipantTable />
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 py-3 bg-white border-t border-gray-200 text-center text-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <p className="font-medium text-gray-600">
          &copy; {new Date().getFullYear()} ASCII Technologies
        </p>
      </footer>
    </div>
  );
}
