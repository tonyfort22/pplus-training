import * as z from 'zod'

export const formSchema = z.object({
  firstName: z.string().min(1, 'This field is required'),
  lastName: z.string().min(1, 'This field is required'),
  email: z.email({ error: 'Please enter a valid email' }),
  category: z.string().min(1, 'Please select an item'),
  description: z.string().min(1, 'This field is required'),
})
