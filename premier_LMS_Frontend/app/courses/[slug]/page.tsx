'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StarRating from '@/components/ui/StarRating';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/AuthContext';

const tabs = ['Overview', 'Curriculum', 'Instructor', 'Reviews'] as const;

import api from '@/lib/api';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Overview');
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [instructor, setInstructor] = useState<any>(null);

  const slug = params.slug as string;

  useEffect(() => {
    setLoading(true);
    api.get('/courses')
      .then((res) => {
        const found = res.data.find(
          (c: any) => c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
        );
        if (found) {
          const reviewsCount = found.reviews?.length || 0;
          const rating = reviewsCount > 0 
            ? Number((found.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewsCount).toFixed(1))
            : 4.8;
          const lessonCount = found.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 24;

          const mapped = {
            id: found.id,
            title: found.name,
            slug: found.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: found.description || 'Learn professional practices in tax & accounting.',
            longDescription: found.longDescription || 'This course provides complete, practical training.',
            instructor: found.instructorName || 'Premier Academy Faculty',
            instructorId: 'faculty-1',
            category: found.category || 'Taxation & Audits',
            level: found.level || 'Intermediate',
            duration: found.duration || 36,
            lessonCount,
            rating,
            reviewCount: reviewsCount || 15,
            enrollmentCount: 120,
            price: found.discountedFee === 0 ? null : found.discountedFee,
            originalPrice: found.originalFee,
            discountPercent: found.originalFee > found.discountedFee 
              ? Math.round(((found.originalFee - found.discountedFee) / found.originalFee) * 100)
              : undefined,
            language: found.language || 'Urdu & English',
            whatYouWillLearn: found.whatYouWillLearn && found.whatYouWillLearn.length > 0 
              ? found.whatYouWillLearn 
              : ['Understand core concepts and frameworks', 'Apply knowledge to real-world scenarios'],
            requirements: found.requirements && found.requirements.length > 0 
              ? found.requirements 
              : ['Basic understanding of accounting principles'],
            modules: found.modules || [],
            reviews: found.reviews || [],
          };
          setCourse(mapped);
          setInstructor({
            name: found.instructorName || 'Premier Academy Faculty',
            title: found.instructorTitle || 'Senior Tax Consultants & Practitioners',
            rating: 4.9,
            coursesCount: 8,
            studentsCount: 1200,
            bio: found.instructorBio || 'Our faculty consists of leading tax consultants, legal experts, and chartered accountants in Pakistan with decades of experience.',
            image: found.instructorImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load course details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const toggleModule = (id: string) =>
    setOpenModules((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const totalLessons = course ? course.modules.reduce((acc: number, mod: any) => acc + mod.lessons.length, 0) : 0;
  const handleEnroll = () => {
    if (!user) router.push('/auth/signup');
    else router.push('/admission');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-light">
        <div className="container-main py-10"><SkeletonDetailPage /></div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Course Not Found</h1>
          <Link href="/courses" className="text-brand-green font-semibold no-underline">← Back to Courses</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-light">
      {/* Hero */}
      <div className="bg-brand-green">
        <div className="container-main py-8 md:py-12">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: course.title },
          ]} />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white px-2.5 py-1 rounded">
                  {course.category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-gold/20 text-accent-gold px-2.5 py-1 rounded">
                  {course.level}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
                {course.title}
              </h1>
              <p className="text-mint/80 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
                {course.description}
              </p>

              {/* Instructor + stats */}
              <div className="flex flex-wrap items-center gap-4">
                {instructor && (
                  <div className="flex items-center gap-2">
                    <Image src={instructor.image} alt={instructor.name} width={36} height={36}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white/20" />
                    <span className="text-sm font-medium text-white">{instructor.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <StarRating rating={course.rating} size="sm" />
                  <span className="text-sm text-mint/70 ml-1">{course.rating} ({course.reviewCount} reviews)</span>
                </div>
                <span className="text-sm text-mint/70">{course.enrollmentCount.toLocaleString()} students</span>
                <span className="text-sm text-mint/70">Updated {course.lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border-light mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab
                      ? 'border-brand-green text-brand-green'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}>{tab}</button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === 'Overview' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-3">About This Course</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">{course.longDescription}</p>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-3">What You&apos;ll Learn</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.whatYouWillLearn.map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary mb-3">Requirements</h2>
                  <ul className="space-y-2">
                    {course.requirements.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-text-primary mt-1">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Curriculum */}
            {activeTab === 'Curriculum' && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-sm text-text-secondary mb-4">{course.modules.length} modules • {totalLessons} lessons • {course.duration}h total</p>
                {course.modules.map((mod: any) => (
                  <div key={mod.id} className="border border-border-light rounded-lg overflow-hidden">
                    <button onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <svg className={`w-4 h-4 text-text-secondary transition-transform ${openModules.includes(mod.id) ? 'rotate-90' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-semibold text-text-primary">{mod.title}</span>
                      </div>
                      <span className="text-xs text-text-secondary">{mod.lessons.length} lessons</span>
                    </button>
                    {openModules.includes(mod.id) && (
                      <div className="border-t border-border-light bg-gray-50/50">
                        {mod.lessons.map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center justify-between px-4 py-3 border-b border-border-light last:border-b-0">
                            <div className="flex items-center gap-3">
                              {lesson.isPreview ? (
                                <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                              <span className="text-sm text-text-secondary">{lesson.title}</span>
                              {lesson.isPreview && <span className="text-[10px] font-medium text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded">Preview</span>}
                            </div>
                            <span className="text-xs text-text-secondary shrink-0">{lesson.duration} min</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Instructor */}
            {activeTab === 'Instructor' && instructor && (
              <div className="animate-fade-in">
                <div className="flex items-start gap-5">
                  <Image src={instructor.image} alt={instructor.name} width={80} height={80}
                    className="w-20 h-20 rounded-full object-cover border-2 border-border-light" />
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">{instructor.name}</h2>
                    <p className="text-sm text-text-secondary mb-2">{instructor.title}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <StarRating rating={instructor.rating} size="sm" /> {instructor.rating}
                      </span>
                      <span>{instructor.coursesCount} courses</span>
                      <span>{instructor.studentsCount.toLocaleString()} students</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed mt-6">{instructor.bio}</p>
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'Reviews' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold text-text-primary">{course.rating}</span>
                  <div>
                    <StarRating rating={course.rating} size="md" />
                    <p className="text-xs text-text-secondary mt-0.5">{course.reviewCount} reviews</p>
                  </div>
                </div>
                {course.reviews.map((rev: any) => (
                  <div key={rev.id} className="border-b border-border-light pb-5 last:border-b-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-brand-green">{rev.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{rev.name}</p>
                        <p className="text-[10px] text-text-secondary">{rev.date}</p>
                      </div>
                    </div>
                    <StarRating rating={rev.rating} size="sm" />
                    <p className="text-sm text-text-secondary leading-relaxed mt-2">{rev.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-border-light rounded-xl p-6 lg:sticky lg:top-24 shadow-card">
              {/* Price */}
              <div className="mb-5">
                {course.price === null ? (
                  <span className="text-3xl font-bold text-green-600">FREE</span>
                ) : (
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-bold text-text-primary">Rs. {course.price.toLocaleString('en-PK')}</span>
                    {course.originalPrice && (
                      <span className="text-base text-text-secondary line-through">Rs. {course.originalPrice.toLocaleString('en-PK')}</span>
                    )}
                    {course.discountPercent && <span className="discount-pill text-sm">{course.discountPercent}% off</span>}
                  </div>
                )}
              </div>

              {/* Enroll */}
              <button onClick={handleEnroll}
                className="w-full btn-signup py-3 text-base mb-4">
                {course.price === null ? 'Enroll for Free' : 'Enroll Now'}
              </button>

              {/* Course info */}
              <div className="space-y-3 border-t border-border-light pt-4">
                {[
                  { label: 'Duration', value: `${course.duration} hours` },
                  { label: 'Lessons', value: `${course.lessonCount}` },
                  { label: 'Level', value: course.level },
                  { label: 'Language', value: course.language },
                  { label: 'Certificate', value: 'Yes' },
                  { label: 'Access', value: 'Lifetime' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="font-medium text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Share */}
              <div className="border-t border-border-light pt-4 mt-4">
                <p className="text-xs font-medium text-text-secondary mb-2">Share this course</p>
                <div className="flex gap-2">
                  {['Facebook', 'Twitter', 'LinkedIn'].map((s) => (
                    <button key={s} className="w-8 h-8 rounded-full border border-border-light flex items-center justify-center
                                               text-text-secondary hover:border-brand-green hover:text-brand-green transition-all text-xs font-bold">
                      {s[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
