'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { liveClasses, courses, batches } from '@/lib/mockData';
import CourseCard from '@/components/courses/CourseCard';
import api from '@/lib/api';

export default function Home() {
  const upcomingScrollRef = useRef<HTMLDivElement>(null);
  const activePastScrollRef = useRef<HTMLDivElement>(null);
  const [dbBatches, setDbBatches] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      // 1. Fetch batches
      try {
        const { data } = await api.get('/batches/public');
        if (active) {
          if (data && data.length > 0) {
            setDbBatches(data);
          } else {
            // Fallback batches
            const fallback = batches.map((b, idx) => ({
              id: b.id,
              name: b.title,
              thumbnail: b.thumbnail,
              startDate: idx % 2 === 0 
                ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString() 
                : new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            }));
            setDbBatches(fallback);
          }
        }
      } catch (err) {
        console.error('Failed to load public batches:', err);
        if (active) {
          const fallback = batches.map((b, idx) => ({
            id: b.id,
            name: b.title,
            thumbnail: b.thumbnail,
            startDate: idx % 2 === 0 
              ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString() 
              : new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          }));
          setDbBatches(fallback);
        }
      }

      // 2. Fetch public upcoming classes
      try {
        const { data } = await api.get('/classes/public/upcoming');
        if (active) {
          if (data && data.length > 0) {
            const mapped = data.map((cls: any) => {
              const start = new Date(cls.scheduledStart);
              const mock = liveClasses.find(
                (lc) => lc.title.toLowerCase() === cls.title.toLowerCase()
              );
              return {
                id: cls.id,
                category: cls.courseName || mock?.category || 'Live Class',
                title: cls.title,
                date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                instructor: mock?.instructor || 'Premier Expert',
                thumbnail: mock?.thumbnail || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=450&fit=crop',
              };
            });
            setDbClasses(mapped);
          } else {
            setDbClasses(liveClasses);
          }
        }
      } catch (err) {
        console.error('Failed to load upcoming classes:', err);
        if (active) setDbClasses(liveClasses);
      }
 
      // 3. Fetch courses
      try {
        const { data } = await api.get('/courses');
        if (active) {
          if (data && data.length > 0) {
            const mapped = data.map((dbCourse: any) => {
              const reviewsCount = dbCourse.reviews?.length || 0;
              const rating = reviewsCount > 0 
                ? Number((dbCourse.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewsCount).toFixed(1))
                : 4.8;
              const lessonCount = dbCourse.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 24;
 
              return {
                id: dbCourse.id,
                title: dbCourse.name,
                slug: dbCourse.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: dbCourse.description || 'Learn professional practices in tax & accounting.',
                longDescription: dbCourse.longDescription || '',
                instructor: dbCourse.instructorName || 'Premier Expert',
                instructorId: 'instr-1',
                category: dbCourse.category || 'Income Tax',
                level: dbCourse.level || 'Intermediate',
                duration: dbCourse.duration || 12,
                modules: dbCourse.modules || [],
                rating,
                reviewCount: reviewsCount || 15,
                enrollmentCount: 120,
                price: dbCourse.discountedFee === 0 ? null : dbCourse.discountedFee,
                originalPrice: dbCourse.originalFee,
                discountPercent: dbCourse.originalFee > dbCourse.discountedFee 
                  ? Math.round(((dbCourse.originalFee - dbCourse.discountedFee) / dbCourse.originalFee) * 100)
                  : undefined,
                thumbnail: dbCourse.thumbnail || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop',
                lessonCount,
                tags: [dbCourse.category || 'Tax', dbCourse.level || 'Intermediate'],
                badge: dbCourse.badge,
                lastUpdated: 'June 2026',
                language: dbCourse.language || 'English & Urdu',
              };
            });
            setDbCourses(mapped);
          } else {
            setDbCourses(courses);
          }
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
        if (active) setDbCourses(courses);
      }
 
      if (active) setLoading(false);
    }
 
    loadData();
 
    return () => {
      active = false;
    };
  }, []);
 
  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (!ref.current) return;
    const amount = 320;
    ref.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };
 
  const getMediaUrl = (path?: string) => {
    if (!path) return 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/^\.?\//, '');
    return `${api.defaults.baseURL}/uploads/${cleanPath}`;
  };
 
  const upcomingBatches = dbBatches.filter(
    (b) => new Date(b.startDate) > new Date()
  );
  
  const activePastBatches = dbBatches.filter(
    (b) => new Date(b.startDate) <= new Date()
  );
 
  return (
    <main>
      {/* ════════════════════════════════════════════════════════
          HERO BANNER
         ════════════════════════════════════════════════════════ */}
      <section
        id="hero-banner"
        className="w-full"
        style={{
          background: 'linear-gradient(135deg, #1a4a3a 0%, #1a4a3a 30%, #2a6a52 55%, #c9a84c 100%)',
        }}
      >
        <div className="container-main py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Welcome to Premier Academy
          </h1>
          <p className="text-white/70 mt-3 text-base md:text-lg max-w-xl">
            Pakistan&apos;s Premier Tax &amp; Accounting Education Platform
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          UPCOMING LIVE CLASSES
         ════════════════════════════════════════════════════════ */}
      <section id="live-classes-section" className="py-10 md:py-14">
        <div className="container-main">
          <h2 className="section-title mb-6">Upcoming Live Classes</h2>

          <div className="flex gap-5 overflow-x-auto hide-scrollbar pb-4">
            {dbClasses.map((lc, index) => (
              <div
                key={lc.id}
                className="card-live shrink-0 w-[280px] sm:w-[300px] aspect-[4/3] relative group"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Background image */}
                <Image
                  src={lc.thumbnail}
                  alt={lc.title}
                  fill
                  className="object-cover"
                  sizes="300px"
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* LIVE Badge */}
                <div className="absolute top-3 left-3">
                  <span className="live-badge">LIVE</span>
                </div>

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider mb-1">
                    {lc.category}
                  </p>
                  <h3 className="text-white text-sm font-bold leading-snug mb-2 line-clamp-2 group-hover:text-amber-300 transition-colors">
                    {lc.title}
                  </h3>
                  <p className="text-white/60 text-[11px]">
                    {lc.date} • {lc.time} • {lc.instructor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          COURSES
         ════════════════════════════════════════════════════════ */}
      <section id="courses-section" className="py-10 md:py-14 bg-white">
        <div className="container-main">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="section-title">Courses</h2>
              <span className="count-badge">{dbCourses.length}</span>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-brand-green hover:text-brand-green-dark transition-colors flex items-center gap-1 no-underline">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dbCourses.map((course, index) => (
              <div key={course.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          BATCHES
         ════════════════════════════════════════════════════════ */}
      <section id="batches-section" className="py-10 md:py-14 bg-bg-light space-y-12">
        {/* UPCOMING BATCHES */}
        <div className="container-main">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="section-title">Upcoming Batches</h2>
              <span className="count-badge">{upcomingBatches.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admission" className="text-sm font-semibold text-brand-green hover:text-brand-green-dark transition-colors flex items-center gap-1 no-underline">
                Apply for Admission
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Carousel Arrows */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => scrollContainer(upcomingScrollRef, 'left')}
                  className="w-8 h-8 rounded-full border border-border-light bg-white flex items-center justify-center
                             hover:border-brand-green hover:text-brand-green transition-all duration-200
                             active:scale-95"
                  aria-label="Scroll upcoming batches left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollContainer(upcomingScrollRef, 'right')}
                  className="w-8 h-8 rounded-full border border-border-light bg-white flex items-center justify-center
                             hover:border-brand-green hover:text-brand-green transition-all duration-200
                             active:scale-95"
                  aria-label="Scroll upcoming batches right"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Batch Carousel */}
          <div
            ref={upcomingScrollRef}
            className="flex gap-5 overflow-x-auto hide-scrollbar pb-4 scroll-smooth"
          >
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="shrink-0 w-[300px] sm:w-[320px] bg-white border border-border-light rounded-xl overflow-hidden animate-pulse">
                  <div className="w-full aspect-[16/9] bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : upcomingBatches.length > 0 ? (
              upcomingBatches.map((batch, index) => (
                <div
                  key={batch.id}
                  className="card-batch shrink-0 w-[300px] sm:w-[320px] group"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {/* Banner thumbnail */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t-xl bg-bg-light">
                    <img
                      src={getMediaUrl(batch.thumbnail)}
                      alt={batch.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Title and date info */}
                  <div className="p-4 bg-white border border-t-0 border-border-light rounded-b-xl">
                    <h3 className="text-sm font-bold text-text-primary leading-snug line-clamp-2 group-hover:text-brand-green transition-colors">
                      {batch.name}
                    </h3>
                    <p className="text-[10px] text-text-secondary mt-2 font-semibold">
                      Starts: {new Date(batch.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full bg-white border border-border-light rounded-xl p-8 text-center text-text-secondary text-xs italic">
                No upcoming batches scheduled.
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE & PAST BATCHES */}
        <div className="container-main">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="section-title">Active &amp; Past Batches</h2>
              <span className="count-badge">{activePastBatches.length}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Carousel Arrows */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => scrollContainer(activePastScrollRef, 'left')}
                  className="w-8 h-8 rounded-full border border-border-light bg-white flex items-center justify-center
                             hover:border-brand-green hover:text-brand-green transition-all duration-200
                             active:scale-95"
                  aria-label="Scroll active batches left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollContainer(activePastScrollRef, 'right')}
                  className="w-8 h-8 rounded-full border border-border-light bg-white flex items-center justify-center
                             hover:border-brand-green hover:text-brand-green transition-all duration-200
                             active:scale-95"
                  aria-label="Scroll active batches right"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Active & Past Batch Carousel */}
          <div
            ref={activePastScrollRef}
            className="flex gap-5 overflow-x-auto hide-scrollbar pb-4 scroll-smooth"
          >
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="shrink-0 w-[300px] sm:w-[320px] bg-white border border-border-light rounded-xl overflow-hidden animate-pulse">
                  <div className="w-full aspect-[16/9] bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : activePastBatches.length > 0 ? (
              activePastBatches.map((batch, index) => (
                <div
                  key={batch.id}
                  className="card-batch shrink-0 w-[300px] sm:w-[320px] group"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {/* Banner thumbnail */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t-xl bg-bg-light">
                    <img
                      src={getMediaUrl(batch.thumbnail)}
                      alt={batch.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Title */}
                  <div className="p-4 bg-white border border-t-0 border-border-light rounded-b-xl">
                    <h3 className="text-sm font-bold text-text-primary leading-snug line-clamp-2 group-hover:text-brand-green transition-colors">
                      {batch.name}
                    </h3>
                    <p className="text-[10px] text-text-secondary mt-2 font-semibold">
                      Started: {new Date(batch.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full bg-white border border-border-light rounded-xl p-8 text-center text-text-secondary text-xs italic">
                No active or past batches found.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

