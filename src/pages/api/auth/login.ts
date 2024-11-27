import type { NextApiRequest, NextApiResponse } from 'next'
import { loginDb } from '@/app/actions/login'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { email, password } = req.body
    await loginDb(email)
 
    res.status(200).json({ success: true })
  } catch (error) {
    
  }
}