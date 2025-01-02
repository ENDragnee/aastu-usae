'use client'

import React, { useState, useEffect } from 'react';
import { RegistrationForm } from '../components/RegistrationForm';
import { ParticipantTable } from '../components/ParticipantTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button"


interface Participant {
  id: string;
  fullName: string;
  photo: string;
  phoneNumber: string;
  university: string;
  responsibility: string;
  barcode: string;
}

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [activeTab, setActiveTab] = useState("register");

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const response = await fetch('/api/participants');
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/participants?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete participant');
      }

      fetchParticipants();
    } catch (error) {
      console.error('Error deleting participant:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center flex flex-auto">
        <p>Sports Festival Management</p>
        <Button
          className="ml-auto"
          onClick={() => signOut()} 
        >
          Sign Out
        </Button>

      </h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">Registration</TabsTrigger>
          <TabsTrigger value="manage">Manage Participants</TabsTrigger>
        </TabsList>
        <TabsContent value="register">
          <RegistrationForm editingParticipant={editingParticipant} />
        </TabsContent>
        <TabsContent value="manage">
          <ParticipantTable
            participants={participants}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}