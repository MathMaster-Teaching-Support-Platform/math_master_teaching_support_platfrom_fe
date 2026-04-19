export interface PricingCourseInfo {
  originalPrice?: number | null;
  discountedPrice?: number | null;
  discountExpiryDate?: string | null;
}

/**
 * Checks if the course currently has an active discount that hasn't expired.
 * Also validates that the discounted price is properly set and less than the original price.
 */
export function isDiscountActive(course: PricingCourseInfo): boolean {
  if (
    course.originalPrice == null ||
    course.originalPrice <= 0 ||
    course.discountedPrice == null ||
    course.discountedPrice < 0 ||
    course.discountedPrice >= course.originalPrice
  ) {
    // Basic structural conditions not met
    return false;
  }

  // Check if expiration date has passed
  if (course.discountExpiryDate) {
    const expiry = new Date(course.discountExpiryDate);
    if (expiry <= new Date()) {
      return false; // Timer expired
    }
  }

  return true;
}

/**
 * Returns the effective price a student would pay for the course at this exact moment.
 * Safely falls back to the original price if the discount is invalid or expired.
 */
export function getEffectivePrice(course: PricingCourseInfo): number {
  if (isDiscountActive(course) && course.discountedPrice != null) {
    return course.discountedPrice;
  }
  return course.originalPrice || 0;
}
