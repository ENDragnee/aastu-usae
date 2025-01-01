'use client'

import React, { useState, useEffect } from 'react';
import { RegistrationForm } from '@/components/RegistrationForm';
import { ParticipantTable } from '@/components/ParticipantTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionProvider } from "next-auth/react";


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
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleSubmit = async (data: Participant) => {
    try {
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id ? `/api/participants/${data.id}` : '/api/participants';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        fetchParticipants();
        setEditingParticipant(null);
        setActiveTab("manage");
      }
    } catch (error) {
      console.error('Error submitting participant:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/participants/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error deleting participant:', error);
    }
  };

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setActiveTab("register");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Sports Festival Management</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">Registration</TabsTrigger>
          <TabsTrigger value="manage">Manage Participants</TabsTrigger>
        </TabsList>
        <TabsContent value="register">
          <RegistrationForm onSubmit={handleSubmit} editingParticipant={editingParticipant} />
        </TabsContent>
        <TabsContent value="manage">
          <ParticipantTable
            participants={participants}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

