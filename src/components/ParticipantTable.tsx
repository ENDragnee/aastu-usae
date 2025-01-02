"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Participant {
  id: string;
  name: string;
  photo: string;
  phone_number: string;
  university: string;
  responsibility: string;
  unique_id: string;
  barcode_id: string;
}

interface ParticipantTableProps {
  onDelete: (id: string) => void;
  onEdit: (participant: Participant) => void;
}

export function ParticipantTable({ onDelete, onEdit }: ParticipantTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const response = await fetch("/api/participants");
      if (!response.ok) {
        throw new Error("Failed to fetch participants");
      }
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await onDelete(deleteId);
        setParticipants((prev) =>
          prev.filter((participant) => participant.id !== deleteId)
        );
        setDeleteId(null);
      } catch (error) {
        console.error("Error deleting participant:", error);
      }
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Photo</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>University</TableHead>
            <TableHead>Responsibility</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow key={participant.id}>
              <TableCell>{participant.name}</TableCell>
              <TableCell>
                <img
                  src={participant.photo}
                  alt={participant.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              </TableCell>
              <TableCell>{participant.phone_number}</TableCell>
              <TableCell>{participant.university}</TableCell>
              <TableCell>{participant.responsibility}</TableCell>
              <TableCell>{participant.unique_id}</TableCell>
              <TableCell>{participant.barcode_id}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(participant.id)}
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the participant's
                          data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
