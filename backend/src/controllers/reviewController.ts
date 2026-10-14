import { Request, Response } from 'express';
import Review from '../models/Review';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorMiddleware';

// -- Create Site Review (Customer) --
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { rating, comment } = req.body;
  const userId = req.user?._id;

  const review = await Review.create({
    user: userId,
    rating,
    comment,
    isApproved: false,
  });

  res.status(201).json({ success: true, message: 'Feedback submitted and pending admin approval.', review });
});

// -- Get Approved Reviews (Public) --
export const getApprovedReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await Review.find({ isApproved: true })
    .sort('-createdAt')
    .populate('user', 'name');

  res.json({ success: true, reviews });
});

// -- Admin: Get All Reviews --
export const getAllReviewsAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reviews = await Review.find()
    .sort('-createdAt')
    .populate('user', 'name email');

  res.json({ success: true, reviews });
});

// -- Admin: Approve/Unapprove Review --
export const approveReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  review.isApproved = req.body.isApproved;
  await review.save();

  res.json({ success: true, message: 'Review approval status updated', review });
});

// -- Admin: Delete Review --
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  res.json({ success: true, message: 'Review permanently deleted.' });
});
