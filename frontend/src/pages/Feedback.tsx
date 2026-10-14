import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Star, MessageSquareQuote } from 'lucide-react';

interface Review {
  _id: string;
  user: { name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export const Feedback: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get('/api/reviews');
        if (res.data.success) {
          setReviews(res.data.reviews);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login to submit feedback');
    setSubmitting(true);
    try {
      const res = await axios.post('/api/reviews', form);
      if (res.data.success) {
        alert(res.data.message);
        setForm({ rating: 5, comment: '' });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRow: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= Math.round(rating) ? 'fill-amber-400 stroke-none' : 'stroke-slate-300 dark:stroke-slate-600'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-4 pt-6 sm:pt-16 pb-24 sm:pb-16 space-y-8 sm:space-y-12">
      <div className="text-center space-y-3 sm:space-y-4">
        <img 
          src="/logo/logo.png" 
          alt="Quick Solutions Logo" 
          className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-md mx-auto mb-2 hover:scale-105 transition-transform"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden w-16 h-16 bg-brand-100 dark:bg-brand-900/40 rounded-full flex items-center justify-center mx-auto text-brand-600 dark:text-brand-400">
          <MessageSquareQuote className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Customer Feedback</h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto">
          Read what our valued customers have to say about their experience with Quick Solutions For U.
        </p>
      </div>

      {user ? (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl mx-auto">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Leave Your Feedback</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm({ ...form, rating: s })}
                    className="p-1 focus:outline-none transition hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${s <= form.rating ? 'fill-amber-400 stroke-none' : 'stroke-slate-300 dark:stroke-slate-700'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Your Experience</label>
              <textarea
                required
                rows={4}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                placeholder="Share your thoughts about our service and products..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      ) : (
        <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400 font-semibold mb-4">Please log in to submit your feedback.</p>
          <a href="/login" className="inline-block px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl">Sign In</a>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="font-bold text-xl text-slate-900 dark:text-white">Recent Approved Feedback</h3>
        {loading ? (
          <p className="text-slate-500">Loading feedback...</p>
        ) : reviews.length === 0 ? (
          <p className="text-slate-500">No feedback approved yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div key={rev._id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{rev.user?.name || 'Customer'}</div>
                  <StarRow rating={rev.rating} />
                </div>
                <p className="text-slate-600 dark:text-slate-400 italic">"{rev.comment}"</p>
                <div className="text-xs text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
