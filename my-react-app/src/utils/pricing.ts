import type { CourseResponse } from '../types/course.types';

/**
 * Get the effective price for a course (considering active discounts)
 */
export const getEffectivePrice = (course: CourseResponse): number => {
  if (course.discountedPrice !== null && course.discountedPrice !== undefined) {
    const now = new Date();
    const expiryDate = course.discountExpiryDate ? new Date(course.discountExpiryDate) : null;
    
    // If no expiry date or discount is still valid
    if (!expiryDate || now <= expiryDate) {
      return course.discountedPrice;
    }
  }
  
  return course.originalPrice ?? 0;
};

/**
 * Format price in Vietnamese currency
 */
export const formatPrice = (price: number): string => {
  if (price === 0) {
    return 'Miễn phí';
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Check if course has an active discount
 */
export const hasActiveDiscount = (course: CourseResponse): boolean => {
  if (!course.discountedPrice || !course.discountExpiryDate) return false;
  return new Date() <= new Date(course.discountExpiryDate);
};

/**
 * Calculate discount percentage
 */
export const getDiscountPercentage = (course: CourseResponse): number => {
  if (!course.originalPrice || !course.discountedPrice) return 0;
  if (course.originalPrice === 0) return 0;
  
  const discount = ((course.originalPrice - course.discountedPrice) / course.originalPrice) * 100;
  return Math.round(discount);
};

/**
 * Validate pricing for course creation/update
 */
export const validatePricing = (originalPrice?: number, discountedPrice?: number): string | null => {
  if (discountedPrice !== undefined && discountedPrice !== null && originalPrice !== undefined && originalPrice !== null) {
    if (discountedPrice >= originalPrice) {
      return 'Giá khuyến mãi phải nhỏ hơn giá gốc';
    }
    if (discountedPrice < 0) {
      return 'Giá khuyến mãi không được âm';
    }
  }
  
  if (originalPrice !== undefined && originalPrice !== null && originalPrice < 0) {
    return 'Giá gốc không được âm';
  }
  
  return null;
};
