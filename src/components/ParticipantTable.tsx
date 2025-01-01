import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/alert-dialog"

interface Participant {
  id: string;
  fullName: string;
  photo: string;
  phoneNumber: string;
  university: string;
  responsibility: string;
  barcode: string;
}

interface ParticipantTableProps {
  participants: Participant[];
  onDelete: (id: string) => void;
  onEdit: (participant: Participant) => void;
}

export function ParticipantTable({ participants, onDelete, onEdit }: ParticipantTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
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
              <TableCell>{participant.fullName}</TableCell>
              <TableCell>
                <img src={participant.photo} alt={participant.fullName} className="w-10 h-10 rounded-full object-cover" />
              </TableCell>
              <TableCell>{participant.phoneNumber}</TableCell>
              <TableCell>{participant.university}</TableCell>
              <TableCell>{participant.responsibility}</TableCell>
              <TableCell>{participant.id}</TableCell>
              <TableCell>{participant.barcode}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button onClick={() => onEdit(participant)} variant="outline" size="sm">
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(participant.id)}>
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
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
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

