// components/RegistrationForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type FormInputs = {
  id?: string;
  fullName: string;
  photo: FileList | string;
  phoneNumber: string;
  university: string;
  responsibility: string;
  barcode?: string;
};

const responsibilities = [
  "Athlete",
  "Coach",
  "Media",
  "Referee",
  "Executive Committee",
  "Local Organizer",
  "Head of Delegation"
];

interface RegistrationFormProps {
  editingParticipant?: FormInputs | null;
}

export function RegistrationForm({ editingParticipant }: RegistrationFormProps) {
  const { data: session } = useSession();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormInputs>({
    defaultValues: {
      responsibility: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  }
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponsibility, setLastResponsibility] = useState<string>(
    responsibilities[0] // Default to the first responsibility in the list
  );
  useEffect(() => {
    if (editingParticipant) {
      reset(editingParticipant);
      setPhotoPreview(editingParticipant.photo as string);
      setLastResponsibility(editingParticipant.responsibility); // Set initial responsibility from the participant
    } else {
      reset({ responsibility: lastResponsibility });
      setPhotoPreview(null);
    }
  
    if (session?.user?.name) {
      setValue("university", session.user.name);
    }
  }, [editingParticipant, reset, session?.user?.name, setValue, lastResponsibility]);
  

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmitForm: SubmitHandler<FormInputs> = async (data) => {
    try {
      setIsSubmitting(true);
  
      let photoData = data.photo;
      if (data.photo instanceof FileList) {
        const file = data.photo[0];
        photoData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
  
      const apiUrl = '/api/register';
      const method = 'POST';
  
      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingParticipant?.id,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          university: session?.user?.name,
          responsibility: data.responsibility,
          photo: photoData,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      console.log('Success: Participant updated');
      setLastResponsibility(data.responsibility); // Update last responsibility after successful submission
      reset({ responsibility: data.responsibility }); // Reset with the current responsibility
      setPhotoPreview(null);
  
    } catch (error) {
      console.error('Error submitting participant:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          {...register("fullName", { required: "Full name is required" })}
        />
        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
      </div>

      <div>
        <Label htmlFor="photo">Photo Upload</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          {...register("photo", { 
            required: !editingParticipant && "Photo is required",
            onChange: handlePhotoChange 
          })}
        />
        {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo.message}</p>}
        {photoPreview && (
          <img src={photoPreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-full" />
        )}
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          {...register("phoneNumber", {
            required: "Phone number is required",
            pattern: {
              value: /^\d{10}$/,
              message: "Phone number must be 10 digits"
            }
          })}
        />
        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
      </div>

      <div>
        <Label htmlFor="university">University</Label>
        <Input
          id="university"
          value={session?.user?.name || ''}
          disabled
          className="bg-gray-100"
        />
      </div>

      <div>
        <Label htmlFor="responsibility">Responsibility</Label>
        <Select
          onValueChange={(value) => {
            setValue("responsibility", value);
            setLastResponsibility(value); // Update last responsibility
          }}
          value={watch("responsibility") || lastResponsibility}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a responsibility" />
          </SelectTrigger>
          <SelectContent>
            {responsibilities.map((resp) => (
              <SelectItem key={resp} value={resp}>
                {resp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.responsibility && (
          <p className="text-red-500 text-xs mt-1">{errors.responsibility.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : editingParticipant ? 'Update Participant' : 'Register Participant'}
      </Button>
    </form>
  );
}