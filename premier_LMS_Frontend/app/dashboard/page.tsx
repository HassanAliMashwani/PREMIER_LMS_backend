'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useModal } from '@/lib/ModalContext';
import api from '@/lib/api';

const sidebarItems = [
  { id: 'courses', label: 'My Courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'classes', label: 'Live Classes', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { id: 'recordings', label: 'Recordings', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const formatDuration = (totalMinutes: number): string => {
  if (!totalMinutes) return "0 mins";
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  }
  return `${mins} min${mins !== 1 ? 's' : ''}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { showAlert } = useModal();
  const [activeTab, setActiveTab] = useState('courses');
  const [profile, setProfile] = useState<any>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [pastClasses, setPastClasses] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Settings / Password change
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [submittingPw, setSubmittingPw] = useState(false);

  // Recording playback state
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Expanded course accordion state
  const [expandedCourses, setExpandedCourses] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }

    async function fetchDashboardData() {
      try {
        const [profileRes, classesRes, pastClassesRes, recordingsRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/classes/my/upcoming'),
          api.get('/classes/my/past'),
          api.get('/classes/my/recordings'),
        ]);

        setProfile(profileRes.data);
        setUpcomingClasses(classesRes.data);
        setPastClasses(pastClassesRes.data);
        setRecordings(recordingsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard backend data:', err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchDashboardData();
  }, [user, isLoading, router]);

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Map real database enrollments to UI courses
  const enrolledCourses = (profile?.enrollments || []).map((enrollment: any) => {
    const isCompleted = !enrollment.isActive || enrollment.batch?.status === 'completed';
    const realBatchName = enrollment.batch?.name || enrollment.batchName || 'N/A';

    return {
      id: enrollment.course.id,
      title: enrollment.course.name,
      slug: enrollment.course.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      thumbnail: enrollment.course.thumbnail || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop',
      batchName: realBatchName,
      isActive: enrollment.isActive,
      isCompleted,
      batchStatus: enrollment.batch?.status || (enrollment.isActive ? 'classes' : 'completed'),
    };
  });

  const handlePlayRecording = async (classId: string) => {
    setPlayingId(classId);
    try {
      const { data } = await api.post(`/classes/${classId}/recording-token`);
      const token = data.token;
      window.open(`/dashboard/recordings/player?token=${token}`, '_blank');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to authorize recording playback. Please try again.';
      showAlert('Access Denied', errMsg);
    } finally {
      setPlayingId(null);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPw !== confirmPw) {
      setPwError('New passwords do not match');
      return;
    }

    setSubmittingPw(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setPwSuccess('Password changed successfully! Logging out...');
      setTimeout(() => {
        logout();
        router.push('/auth/login');
      }, 1500);
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmittingPw(false);
    }
  };

  // Group recordings by course name
  const recordingsByCourse = recordings.reduce((acc: { [courseName: string]: any[] }, rec) => {
    if (!acc[rec.courseName]) {
      acc[rec.courseName] = [];
    }
    acc[rec.courseName].push(rec);
    return acc;
  }, {});

  // Sort lectures inside each course group by classNo
  Object.keys(recordingsByCourse).forEach((courseName) => {
    recordingsByCourse[courseName].sort((a, b) => {
      const numA = parseInt(a.classNo || '0', 10);
      const numB = parseInt(b.classNo || '0', 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return (a.classNo || '').localeCompare(b.classNo || '');
    });
  });

  const courseDetailsMap = Object.keys(recordingsByCourse).reduce((acc: { [courseName: string]: any }, courseName) => {
    const matchedEnrollment = enrolledCourses.find(
      (ec: any) => ec.title.toLowerCase() === courseName.toLowerCase()
    );

    acc[courseName] = matchedEnrollment || {
      title: courseName,
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop',
      batchName: 'N/A',
    };
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-bg-light">
      <div className="container-main py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            {/* User card */}
            <div className="bg-white border border-border-light rounded-xl p-5 mb-4 text-center">
              <Image src={user.avatar} alt={user.name} width={64} height={64}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-accent-gold" />
              <h2 className="text-sm font-bold text-text-primary">{user.name}</h2>
              <p className="text-xs text-text-secondary mt-0.5">{user.email}</p>
            </div>

            {/* Nav */}
            <nav className="bg-white border border-border-light rounded-xl overflow-hidden">
              {sidebarItems.map((item) => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-border-light last:border-b-0 ${
                    activeTab === item.id
                      ? 'text-brand-green bg-brand-green/5'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-50'
                  }`}>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
              <button onClick={() => { logout(); router.push('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </nav>
          </aside>

          {/* Main */}
          <div className="flex-1">
            {activeTab === 'courses' && (
              <div>
                <h1 className="text-xl font-bold text-text-primary mb-6">My Courses</h1>
                {enrolledCourses.length === 0 ? (
                  <div className="bg-white border border-border-light rounded-xl p-12 text-center">
                    <p className="text-text-secondary mb-4">You haven&apos;t enrolled in any courses yet.</p>
                    <Link href="/courses" className="btn-signup inline-block no-underline">Browse Courses</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {enrolledCourses.map((c: any) => (
                      <Link key={c.id} href={`/courses/${c.slug}`} className="no-underline group">
                        <div className="bg-white border border-border-light rounded-xl overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all">
                          <div className="relative w-full aspect-[16/9] overflow-hidden">
                            <Image src={c.thumbnail} alt={c.title} fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="300px" />
                            {c.isCompleted && (
                              <div className="absolute top-2 right-2 bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                Completed
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="text-sm font-bold text-text-primary line-clamp-2 mb-3 group-hover:text-brand-green transition-colors">
                              {c.title}
                            </h3>
                            {/* Batch & Status */}
                            <div className="flex items-center justify-between text-xs mt-3 border-t border-border-light pt-2">
                              <span className="text-text-secondary font-medium">Batch: {c.batchName}</span>
                              <span className={`font-bold uppercase tracking-wider text-[10px] ${
                                c.isCompleted
                                  ? "text-text-secondary"
                                  : c.batchStatus === "admission"
                                  ? "text-amber-500"
                                  : "text-brand-green"
                              }`}>
                                {c.isCompleted
                                  ? "Completed"
                                  : c.batchStatus === "admission"
                                  ? "Admission"
                                  : "Active"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'classes' && (
              <div className="space-y-10">
                {/* Upcoming Live Classes Section */}
                <div>
                  <h1 className="text-xl font-bold text-text-primary mb-6">Upcoming Live Classes</h1>
                  {upcomingClasses.length === 0 ? (
                    <div className="bg-white border border-border-light rounded-xl p-8 text-center text-text-secondary text-sm">
                      No upcoming live classes scheduled at this time.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingClasses.map((cls) => {
                        const start = new Date(cls.scheduledStart);

                        return (
                          <div key={cls.id} className="bg-white border border-border-light rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-card-hover transition-all">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span>
                                <span className="text-xs text-text-secondary font-medium">{cls.batchName}</span>
                              </div>
                              <h3 className="text-base font-bold text-text-primary mb-1">{cls.title}</h3>
                              <p className="text-xs text-text-secondary">
                                {cls.courseName} • {start.toLocaleString()}
                              </p>
                            </div>
                            <Link href={`/dashboard/classes/${cls.id}`} className="btn-signup whitespace-nowrap no-underline text-center px-4 py-2 text-sm">
                              Join Meeting
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Past / Completed Classes Section */}
                <div>
                  <h1 className="text-xl font-bold text-text-primary mb-6">Past / Completed Classes</h1>
                  {pastClasses.length === 0 ? (
                    <div className="bg-white border border-border-light rounded-xl p-8 text-center text-text-secondary text-sm">
                      No completed classes found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastClasses.map((cls) => {
                        const start = new Date(cls.scheduledStart);

                        return (
                          <div key={cls.id} className="bg-white border border-border-light rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/50 transition-all opacity-90">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">COMPLETED</span>
                                <span className="text-xs text-text-secondary font-medium">{cls.batchName}</span>
                              </div>
                              <h3 className="text-sm font-bold text-text-primary mb-1">{cls.title}</h3>
                              <p className="text-xs text-text-secondary">
                                {cls.courseName} • Completed on: {start.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'recordings' && (
              <div>
                <h1 className="text-xl font-bold text-text-primary mb-6">Recorded Sessions</h1>
                {Object.keys(recordingsByCourse).length === 0 ? (
                  <div className="bg-white border border-border-light rounded-xl p-12 text-center text-text-secondary">
                    No recordings posted for your courses yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Object.keys(recordingsByCourse).map((courseName) => (
                      <div key={courseName} className="bg-white border border-border-light rounded-xl overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex flex-col">
                        {/* Course Thumbnail */}
                        <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
                          <Image 
                            src={courseDetailsMap[courseName].thumbnail} 
                            alt={courseName} 
                            fill
                            className="object-cover" 
                            sizes="300px" 
                          />
                          <div className="absolute top-2 right-2 bg-brand-green text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                            {recordingsByCourse[courseName].length} Lecture{recordingsByCourse[courseName].length !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-text-primary line-clamp-2 mb-1">
                              {courseName}
                            </h3>
                            <p className="text-xs text-text-secondary mb-4">
                              Batch: {courseDetailsMap[courseName].batchName}
                            </p>
                          </div>

                          <div className="space-y-3 pt-2 border-t border-border-light">
                            {/* Main Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const firstLecture = recordingsByCourse[courseName][0];
                                  if (firstLecture) {
                                    handlePlayRecording(firstLecture.id);
                                  }
                                }}
                                disabled={playingId !== null}
                                className="btn-signup flex-1 no-underline text-center text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                {playingId && recordingsByCourse[courseName].some((r: any) => r.id === playingId) ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  'Watch Course'
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setExpandedCourses((prev) => ({
                                    ...prev,
                                    [courseName]: !prev[courseName],
                                  }));
                                }}
                                className="border border-border-light hover:bg-gray-50 text-text-primary rounded-lg px-2.5 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>Lectures</span>
                                <svg 
                                  className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${expandedCourses[courseName] ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor" 
                                  strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>

                            {/* Expandable Lecture List */}
                            {expandedCourses[courseName] && (
                              <div className="mt-3 pt-2 max-h-52 overflow-y-auto custom-scrollbar space-y-1.5 border-t border-dashed border-border-light">
                                {recordingsByCourse[courseName].map((rec) => (
                                  <div 
                                    key={rec.id} 
                                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100/70 border border-border-light/40 transition-all text-xs"
                                  >
                                    <div className="flex-1 min-w-0 pr-2">
                                      <p className="font-semibold text-text-primary truncate">
                                        {rec.classNo ? `[Class ${rec.classNo}] ` : ''}{rec.title}
                                      </p>
                                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-text-secondary">
                                        <svg className="w-3 h-3 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{formatDuration(rec.duration)}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handlePlayRecording(rec.id)}
                                      disabled={playingId !== null}
                                      className="bg-brand-green/10 hover:bg-brand-green/20 text-brand-green font-bold p-1.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                    >
                                      {playingId === rec.id ? (
                                        <span className="w-3.5 h-3.5 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                                      ) : (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-border-light rounded-xl p-6">
                <h1 className="text-xl font-bold text-text-primary mb-6">Profile</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Full Name</label>
                    <input type="text" value={profile?.name || user.name} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-gray-50 text-text-primary" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                    <input type="email" value={profile?.email || user.email} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-gray-50 text-text-primary" readOnly />
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-4">Profile editing coming soon.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white border border-border-light rounded-xl p-6">
                <h1 className="text-xl font-bold text-text-primary mb-6">Security Settings</h1>
                {pwError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
                    {pwSuccess}
                  </div>
                )}
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Current Password</label>
                    <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">New Password</label>
                    <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm New Password</label>
                    <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                  </div>
                  <button type="submit" disabled={submittingPw} className="btn-signup px-6 py-2 text-sm disabled:opacity-50">
                    {submittingPw ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
