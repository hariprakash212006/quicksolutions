import { Request, Response } from 'express';
import Subscriber from '../models/Subscriber';

export const subscribeEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      res.status(200).json({ success: true, message: 'Already subscribed' });
      return;
    }

    await Subscriber.create({ email });
    res.status(201).json({ success: true, message: 'Successfully subscribed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
