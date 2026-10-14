"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.approveReview = exports.getAllReviewsAdmin = exports.getApprovedReviews = exports.createReview = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
// -- Create Site Review (Customer) --
exports.createReview = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { rating, comment } = req.body;
    const userId = req.user?._id;
    const review = await Review_1.default.create({
        user: userId,
        rating,
        comment,
        isApproved: false,
    });
    res.status(201).json({ success: true, message: 'Feedback submitted and pending admin approval.', review });
});
// -- Get Approved Reviews (Public) --
exports.getApprovedReviews = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const reviews = await Review_1.default.find({ isApproved: true })
        .sort('-createdAt')
        .populate('user', 'name');
    res.json({ success: true, reviews });
});
// -- Admin: Get All Reviews --
exports.getAllReviewsAdmin = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const reviews = await Review_1.default.find()
        .sort('-createdAt')
        .populate('user', 'name email');
    res.json({ success: true, reviews });
});
// -- Admin: Approve/Unapprove Review --
exports.approveReview = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const review = await Review_1.default.findById(req.params.id);
    if (!review)
        throw new errorMiddleware_1.AppError('Review not found', 404);
    review.isApproved = req.body.isApproved;
    await review.save();
    res.json({ success: true, message: 'Review approval status updated', review });
});
// -- Admin: Delete Review --
exports.deleteReview = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const review = await Review_1.default.findByIdAndDelete(req.params.id);
    if (!review)
        throw new errorMiddleware_1.AppError('Review not found', 404);
    res.json({ success: true, message: 'Review permanently deleted.' });
});
