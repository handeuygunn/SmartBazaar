import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Star,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Heart,
} from "lucide-react";
import {
  fetchProductById,
  fetchProductReviews,
  createProductReview,
} from "../services/api";
import { CartContext } from "../context/CartContext";
import { useAuth } from "../hooks/useAuth";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useContext(CartContext);
  const { user, toggleFavorite } = useAuth();
  const navigate = useNavigate();

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // New review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const isFavorite = user?.user_metadata?.favorites?.includes(id);

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await toggleFavorite(id);
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchProductById(id);
        setProduct(data);
        const revData = await fetchProductReviews(id);
        setReviews(revData);
      } catch (error) {
        console.error("Failed to load product or reviews", error);
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!comment.trim()) {
      setReviewError("Please write a comment.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");
    try {
      const newReview = await createProductReview(id, {
        user_id: user.id || user.email,
        user_name:
          user.user_metadata?.name || user.email?.split("@")[0] || "User",
        rating,
        comment,
        verified_purchase: true, // Assume true for demo purposes
      });
      setReviews([newReview, ...reviews]);
      setComment("");
      setRating(5);
    } catch (err) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mt-5 text-center py-5">
        <h2>Product Not Found</h2>
      </div>
    );
  }

  return (
    <div className="container mt-4 animate-fade-in">
      <Link
        to="/"
        className="btn btn-link text-decoration-none text-muted mb-4 px-0 d-flex align-items-center gap-2"
      >
        <ArrowLeft size={18} /> Back to products
      </Link>

      <div className="card border-0 shadow-sm overflow-hidden rounded-4">
        <div className="row g-0">
          {/* Image Gallery */}
          <div className="col-md-6 bg-light p-4 p-lg-5 d-flex align-items-center justify-content-center">
            <img
              src={product.image}
              alt={product.title}
              className="img-fluid rounded shadow-sm"
              style={{ maxHeight: "400px", objectFit: "contain" }}
            />
          </div>

          {/* Product Info */}
          <div className="col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
            <div className="mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-primary bg-opacity-10 text-primary">
                {product.category}
              </span>
              <span className="text-muted small fw-medium">
                {product.brand}
              </span>
            </div>

            <h2 className="fw-bold mb-3">{product.title}</h2>

            <div className="d-flex align-items-center mb-4 gap-3">
              <div className="d-flex align-items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={
                      star <= Math.round(product.rating)
                        ? "text-warning fill-warning"
                        : "text-muted opacity-25"
                    }
                    style={
                      star <= Math.round(product.rating)
                        ? { fill: "currentColor" }
                        : {}
                    }
                  />
                ))}
                <span className="ms-2 fw-medium">{product.rating}</span>
              </div>
              <span className="text-muted small">|</span>
              <span className="text-success fw-medium small">
                In Stock ({product.stock})
              </span>
            </div>

            <div className="fs-2 fw-bold text-dark mb-4">
              ${product.price.toFixed(2)}
            </div>

            <p className="text-muted mb-5 line-height-lg">
              Experience premium quality with this {product.title}. Designed
              carefully by {product.brand} to meet all your needs. Perfect for
              everyday use and built to last. Add it to your collection today.
            </p>

            <div className="d-flex flex-column flex-sm-row gap-3 mt-auto">
              {/* Quantity selector */}
              <div
                className="d-flex align-items-center border rounded flex-shrink-0"
                style={{ width: "fit-content" }}
              >
                <button
                  className="btn btn-light border-0 shadow-none px-3"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <div
                  className="px-3 fw-medium text-center"
                  style={{ minWidth: "40px" }}
                >
                  {quantity}
                </div>
                <button
                  className="btn btn-light border-0 shadow-none px-3"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>

              {/* Add to cart */}
              <button
                className="btn btn-primary flex-grow-1 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                onClick={() => addToCart(product, quantity)}
              >
                <ShoppingCart size={20} /> Add to Cart
              </button>

              <button
                className="btn btn-outline-secondary py-2 d-flex align-items-center justify-content-center px-4"
                onClick={handleToggleFavorite}
                aria-label="Toggle Favorite"
              >
                <Heart
                  size={20}
                  className={isFavorite ? "text-danger" : ""}
                  style={isFavorite ? { fill: "currentColor" } : {}}
                />
              </button>
            </div>

            {/* Features */}
            <div className="d-flex flex-column gap-3 mt-5 pt-4 border-top">
              <div className="d-flex align-items-center gap-3 text-muted small">
                <Truck size={20} className="text-primary" /> Free shipping on
                orders over $50
              </div>
              <div className="d-flex align-items-center gap-3 text-muted small">
                <ShieldCheck size={20} className="text-success" /> 30-day money
                back guarantee
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-5 mb-5">
        <h3 className="fw-bold mb-4 border-bottom pb-2">Customer Reviews</h3>

        <div className="row">
          {/* Write a Review Form */}
          <div className="col-md-5 mb-4 mb-md-0 order-md-2">
            <div className="card border-0 shadow-sm p-4 bg-light">
              <h5 className="fw-bold mb-3">Write a Review</h5>
              {user ? (
                <form onSubmit={handleReviewSubmit}>
                  {reviewError && (
                    <div className="alert alert-danger small p-2">
                      {reviewError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Rating</label>
                    <div className="d-flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={24}
                          onClick={() => setRating(star)}
                          style={{
                            cursor: "pointer",
                            fill: star <= rating ? "#ffc107" : "none",
                          }}
                          className={
                            star <= rating
                              ? "text-warning"
                              : "text-muted opacity-50"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-medium">
                      Comment
                    </label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Share your experience with this product..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100 fw-medium"
                    disabled={submittingReview}
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">
                    You need to sign in to write a review.
                  </p>
                  <Link
                    to="/login"
                    className="btn btn-outline-primary fw-medium px-4"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Reviews List */}
          <div className="col-md-7 order-md-1 pe-md-4">
            {reviewsLoading ? (
              <div className="text-center py-4 text-muted small">
                Loading reviews...
              </div>
            ) : reviews.length > 0 ? (
              <div className="d-flex flex-column gap-4">
                {reviews.map((review, idx) => (
                  <div key={review.id || idx} className="border-bottom pb-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-bold mb-1">{review.user_name}</div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  star <= review.rating
                                    ? "text-warning"
                                    : "text-muted opacity-25"
                                }
                                style={
                                  star <= review.rating
                                    ? { fill: "#ffc107" }
                                    : {}
                                }
                              />
                            ))}
                          </div>
                          {review.verified_purchase && (
                            <span
                              className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                              style={{ fontSize: "0.65rem" }}
                            >
                              <ShieldCheck size={10} className="me-1" />{" "}
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-muted small">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString()
                          : "Just now"}
                      </span>
                    </div>
                    <p
                      className="text-muted mb-0 mt-2"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-muted text-center border rounded bg-light bg-opacity-50">
                <Star size={32} className="opacity-25 mb-2" />
                <p className="mb-0">
                  No reviews yet. Be the first to review this product!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
