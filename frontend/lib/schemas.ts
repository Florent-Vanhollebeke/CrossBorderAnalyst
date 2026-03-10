import { z } from 'zod';

export const fiscalSchema = z.object({
  revenue_annual: z.number().positive('Le CA doit etre positif'),
  salary_director: z.number().positive('Le salaire doit etre positif'),
  num_employees: z.number().int().min(0).max(10000),
  average_employee_salary: z.number().min(0).default(0),
  city: z.enum(['Lyon', 'Geneve', 'Lausanne', 'Zurich', 'Basel']),
});

export type FiscalFormData = z.infer<typeof fiscalSchema>;

export const rentSchema = z.object({
  city: z.enum(['Geneve', 'Lausanne', 'Zurich', 'Basel']),
  surface: z.number().min(5).max(10000),
  pieces: z.number().min(1).max(50).optional(),
  etage: z.number().min(-1).max(50).optional(),
  has_parking: z.boolean().default(false),
  has_lift: z.boolean().default(false),
  property_type: z.enum(['bureau', 'commercial']).default('bureau'),
});

export type RentFormData = z.infer<typeof rentSchema>;
