import Link from 'next/link';
import Image from 'next/image';
import StarRating from '@/components/ui/StarRating';

export default function CourseCard({ course }: { course: any }) {
  return (
    <Link href={`/courses/${course.slug}`} className="no-underline group">
      <div className="card-course h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Badge */}
          {course.badge && (
            <div className="absolute top-2.5 left-2.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                course.badge === 'bestseller'
                  ? 'bg-amber-400 text-amber-900'
                  : course.badge === 'new'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}>
                {course.badge === 'bestseller' ? 'Bestseller' : course.badge === 'new' ? 'New' : 'Free'}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-sm font-bold text-text-primary leading-snug line-clamp-2 mb-1.5 group-hover:text-brand-green transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-xs text-text-secondary mb-2">{course.instructor}</p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <StarRating rating={course.rating} size="sm" showValue />
            <span className="text-[10px] text-text-secondary">({course.reviewCount})</span>
          </div>

          {/* Metadata */}
          <p className="text-xs text-text-secondary mb-3">
            {course.lessonCount} Lessons • {course.duration}h total
          </p>

          {/* Pricing — pushed to bottom */}
          <div className="flex items-center gap-2 flex-wrap mt-auto">
            {course.price === null ? (
              <span className="text-base font-bold text-green-600">FREE</span>
            ) : (
              <>
                <span className="text-base font-bold text-text-primary">
                  Rs. {course.price.toLocaleString('en-PK')}
                </span>
                {course.originalPrice && (
                  <span className="text-xs text-text-secondary line-through">
                    Rs. {course.originalPrice.toLocaleString('en-PK')}
                  </span>
                )}
                {course.discountPercent && (
                  <span className="discount-pill">{course.discountPercent}% off</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
