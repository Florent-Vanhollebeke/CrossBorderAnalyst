import { z } from 'zod';

export const fiscalSchema = z.object({
  revenue_annual: z.number()
    .positive('Le CA doit être positif')
    .max(999_999_999, 'Le CA ne peut pas dépasser 999M €')
    .finite(),
  salary_director: z.number()
    .positive('Le salaire doit être positif')
    .max(5_000_000, 'Le salaire du dirigeant ne peut pas dépasser 5M €')
    .finite(),
  num_employees: z.number().int().min(0).max(10000),
  average_employee_salary: z.number()
    .min(0)
    .max(500_000, 'Le salaire moyen ne peut pas dépasser 500k €')
    .default(0),
});

export type FiscalFormData = z.infer<typeof fiscalSchema>;

export const rentSchema = z.object({
  city: z.enum(['Geneve', 'Lausanne', 'Zurich', 'Basel', 'Lyon']),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  surface: z.number().min(5).max(10000),
  pieces: z.number().int().min(1).max(50).optional(),
  etage: z.number().int().min(-5).max(50).optional(),
  has_parking: z.boolean().default(false),
  has_lift: z.boolean().default(false),
  property_type: z.enum(['bureau', 'commercial']).default('bureau'),
  lyon_zone: z.enum(['centre', 'periph', 'secondaire']).optional(),
});

export type RentFormData = z.infer<typeof rentSchema>;
