import { z } from 'zod';

export const signUpClientSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  phoneNumber: z.string().min(9, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpPharmacySchema = z.object({
  fullName: z.string().min(2, 'Pharmacist full name is required'),
  email: z.string().email('Enter a valid email address'),
  phoneNumber: z.string().min(9, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  pharmacyName: z.string().min(2, 'Pharmacy name is required'),
  address: z.string().min(4, 'Pharmacy address is required'),
  licenseNumber: z.string().min(3, 'ONPC pharmacist registration number is required'),
  pharmacyLicenseNumber: z.string().min(3, 'DPML operating license number is required'),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const reservationSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(50),
  patientName: z.string().min(2).optional(),
  phoneNumber: z.string().min(9, 'A valid mobile money number is required'),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const addMedicationSchema = z.object({
  name: z.string().min(2),
  genericName: z.string().optional(),
  description: z.string().optional(),
  dosage: z.string().optional(),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(0),
  categoryId: z.string().uuid().optional(),
  requiresPrescription: z.boolean().optional(),
});
