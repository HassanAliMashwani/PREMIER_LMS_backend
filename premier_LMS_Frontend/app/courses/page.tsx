'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { SkeletonCard } from '@/components/ui/Skeleton';
import CourseCard from '@/components/courses/CourseCard';
import api from '@/lib/api';
import { categories } from '@/lib/mockData';

const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;
const sortOptions = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
];

function CoursesContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState('popular');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [showCount, setShowCount] = useState(12);
  const [filterOpen, setFilterOpen] = useState(false);
  const [coursesList, setCoursesList] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    api.get('/courses')
      .then((res) => {
        setCoursesList(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch courses:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleCat = (c: string) =>
    setSelectedCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const toggleLevel = (l: string) =>
    setSelectedLevels((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));

  const clearFilters = () => {
    setSearch('');
    setSelectedCats([]);
    setSelectedLevels([]);
    setPriceFilter('all');
    setSort('popular');
    setShowCount(12);
  };

  const filtered = useMemo(() => {
    // Map backend database courses to CourseCard format
    const mapped = coursesList.map((dbCourse) => {
      const reviewsCount = dbCourse.reviews?.length || 0;
      const rating = reviewsCount > 0 
        ? Number((dbCourse.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewsCount).toFixed(1))
        : 4.8;
      const lessonCount = dbCourse.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 24;

      return {
        id: dbCourse.id,
        title: dbCourse.name,
        slug: dbCourse.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        thumbnail: dbCourse.thumbnail || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop',
        badge: dbCourse.badge,
        instructor: dbCourse.instructorName || 'Premier Academy Faculty',
        rating,
        reviewCount: reviewsCount || 15,
        lessonCount,
        duration: dbCourse.duration || 36,
        price: dbCourse.discountedFee === 0 ? null : dbCourse.discountedFee,
        originalPrice: dbCourse.originalFee,
        discountPercent: dbCourse.originalFee > dbCourse.discountedFee 
          ? Math.round(((dbCourse.originalFee - dbCourse.discountedFee) / dbCourse.originalFee) * 100)
          : undefined,
        category: dbCourse.category || 'Tax & Accounting',
        level: dbCourse.level || 'Intermediate',
        tags: [dbCourse.category || 'Tax', dbCourse.level || 'Intermediate'],
        enrollmentCount: 120,
      };
    });

    let result = [...mapped];
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q)));
    }
    // Category
    if (selectedCats.length > 0) result = result.filter((c) => selectedCats.includes(c.category));
    // Level
    if (selectedLevels.length > 0) result = result.filter((c) => selectedLevels.includes(c.level));
    // Price
    if (priceFilter === 'free') result = result.filter((c) => c.price === null);
    if (priceFilter === 'paid') result = result.filter((c) => c.price !== null);
    // Sort
    switch (sort) {
      case 'popular': result.sort((a, b) => b.enrollmentCount - a.enrollmentCount); break;
      case 'newest': result.sort((a, b) => b.id.localeCompare(a.id)); break;
      case 'price-asc': result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break;
      case 'price-desc': result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
    }
    return result;
  }, [search, selectedCats, selectedLevels, priceFilter, sort, coursesList]);

  const visible = filtered.slice(0, showCount);
  const hasMore = showCount < filtered.length;

  const filterSidebar = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((c) => (
            <label key={c} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={selectedCats.includes(c)} onChange={() => toggleCat(c)}
                className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green accent-brand-green" />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-3">Level</h3>
        <div className="space-y-2">
          {levels.map((l) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={selectedLevels.includes(l)} onChange={() => toggleLevel(l)}
                className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green accent-brand-green" />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-3">Price</h3>
        <div className="flex gap-2">
          {(['all', 'free', 'paid'] as const).map((p) => (
            <button key={p} onClick={() => setPriceFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                priceFilter === p
                  ? 'bg-brand-green text-white border-brand-green'
                  : 'bg-white text-text-secondary border-border-light hover:border-brand-green'
              }`}>
              {p === 'all' ? 'All' : p === 'free' ? 'Free' : 'Paid'}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      <button onClick={clearFilters}
        className="text-sm text-brand-green hover:text-brand-green-dark transition-colors font-medium">
        Clear All Filters
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-bg-light">
      <div className="container-main py-6 md:py-10">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Courses' }]} />

        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-4 mb-6">All Courses</h1>

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-border-light rounded-lg bg-white
                         text-text-primary placeholder:text-gray-400 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all" />
          </div>
          {/* Sort */}
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary
                       focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all">
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {/* Mobile filter toggle */}
          <button onClick={() => setFilterOpen(!filterOpen)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar — desktop */}
          <aside className="hidden sm:block w-56 shrink-0">
            {filterSidebar}
          </aside>

          {/* Mobile filter drawer */}
          {filterOpen && (
            <div className="fixed inset-0 z-40 sm:hidden">
              <div className="absolute inset-0 bg-black/30" onClick={() => setFilterOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-6 shadow-xl overflow-y-auto animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-text-primary">Filters</h2>
                  <button onClick={() => setFilterOpen(false)} className="text-text-secondary hover:text-text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {filterSidebar}
              </div>
            </div>
          )}

          {/* Main grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-text-primary mb-1">No courses found</h3>
                <p className="text-sm text-text-secondary mb-4">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="btn-signup text-sm">Clear Filters</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-4">{filtered.length} course{filtered.length !== 1 ? 's' : ''} found</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visible.map((c) => <CourseCard key={c.id} course={c} />)}
                </div>
                {hasMore && (
                  <div className="text-center mt-8">
                    <button onClick={() => setShowCount((p) => p + 12)}
                      className="px-8 py-2.5 text-sm font-semibold border border-brand-green text-brand-green rounded-lg
                                 hover:bg-brand-green hover:text-white transition-all">
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-light" />}>
      <CoursesContent />
    </Suspense>
  );
}
