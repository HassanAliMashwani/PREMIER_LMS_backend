"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useModal } from "@/lib/ModalContext";

interface Class {
  id: string;
  batchName: string;
  courseName: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string;
  jitsiRoomName: string;
  status: string;
  recordingUrl?: string;
  recordingLive: boolean;
  allowStudentScreenshare: boolean;
  allowStudentMic: boolean;
  allowStudentCamera: boolean;
}



const formatDuration = (totalMinutes: number): string => {
  if (!totalMinutes) return "0 mins";
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) {
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
  }
  return `${mins} min${mins !== 1 ? 's' : ''}`;
};

export default function ClassesPage() {
  const { showAlert, showConfirm } = useModal();
  const [batchesHierarchy, setBatchesHierarchy] = useState<any[]>([]);
  const [coursesRecordings, setCoursesRecordings] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'recordings'>('schedule');
  const [selectedCourseForRecordings, setSelectedCourseForRecordings] = useState<string | null>(null);

  // New Recorded Lectures State
  const [showRecordedLectureModal, setShowRecordedLectureModal] = useState(false);
  const [selectedLectureForEdit, setSelectedLectureForEdit] = useState<any | null>(null);
  const [lectureCourseId, setLectureCourseId] = useState("");
  const [lectureClassNo, setLectureClassNo] = useState("");
  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureUrl, setLectureUrl] = useState("");
  const [lectureDurationHours, setLectureDurationHours] = useState("1");
  const [lectureDurationMinutes, setLectureDurationMinutes] = useState("0");
  const [lectureLive, setLectureLive] = useState(false);
  const [coursesList, setCoursesList] = useState<any[]>([]);

  const [courseSubTab, setCourseSubTab] = useState<'lectures' | 'students'>('lectures');
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);

  const fetchCourseStudents = async (courseId: string) => {
    setFetchingStudents(true);
    try {
      const res = await api.get(`/courses/${courseId}/students`);
      setCourseStudents(res.data);
    } catch (err) {
      console.error("Failed to load course students", err);
      showAlert("Error", "Failed to load course students list");
    } finally {
      setFetchingStudents(false);
    }
  };

  useEffect(() => {
    if (selectedCourseForRecordings && courseSubTab === 'students') {
      fetchCourseStudents(selectedCourseForRecordings);
    }
  }, [selectedCourseForRecordings, courseSubTab]);

  const [form, setForm] = useState({
    batchName: "",
    courseName: "",
    title: "",
    scheduledStart: "",
    scheduledEnd: "",
    allowStudentScreenshare: true,
    allowStudentMic: true,
    allowStudentCamera: true,
  });

  const fetchDashboardData = async () => {
    try {
      const hierarchyRes = await api.get("/classes/dashboard/hierarchy");
      setBatchesHierarchy(hierarchyRes.data);

      const recordingsRes = await api.get("/classes/recordings/all");
      setCoursesRecordings(recordingsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    api.get("/batches")
      .then((res) => {
        setBatchesList(res.data);
      })
      .catch((err) => {
        console.error("Failed to load batches:", err);
      });
    api.get("/courses")
      .then((res) => {
        setCoursesList(res.data);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
      });
  }, []);

  const getWeeklyClassCount = () => {
    if (!form.batchName || !form.scheduledStart) return 0;
    
    const batchInHierarchy = batchesHierarchy.find(b => b.name === form.batchName);
    if (!batchInHierarchy) return 0;

    const date = new Date(form.scheduledStart);
    if (isNaN(date.getTime())) return 0;
    
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(date.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let count = 0;
    batchInHierarchy.courses.forEach((course: any) => {
      course.classes?.forEach((cls: any) => {
        const clsDate = new Date(cls.scheduledStart);
        if (clsDate >= startOfWeek && clsDate <= endOfWeek) {
          count++;
        }
      });
    });
    
    return count;
  };




  const handleOpenScheduleModal = (batchName: string, courseName: string) => {
    const foundBatch = batchesList.find((b) => b.name === batchName);
    setSelectedBatch(foundBatch || null);
    setForm({
      batchName,
      courseName,
      title: "",
      scheduledStart: "",
      scheduledEnd: "",
      allowStudentScreenshare: true,
      allowStudentMic: true,
      allowStudentCamera: true,
    });
    setShowModal(true);
  };

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      await api.post("/classes", form);
      setShowModal(false);
      setForm({
        batchName: "",
        courseName: "",
        title: "",
        scheduledStart: "",
        scheduledEnd: "",
        allowStudentScreenshare: true,
        allowStudentMic: true,
        allowStudentCamera: true,
      });
      setSelectedBatch(null);
      await fetchDashboardData();
    } catch (err: any) {
      showAlert("Error", err.response?.data?.message || "Failed to create class");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (cls: Class, status: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/classes/${cls.id}`, { status });
      await fetchDashboardData();
    } catch {
      showAlert("Error", "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (cls: Class) => {
    const confirmed = await showConfirm("Delete Class", `Are you sure you want to delete "${cls.title}"?`);
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await api.delete(`/classes/${cls.id}`);
      await fetchDashboardData();
    } catch {
      showAlert("Error", "Failed to delete class");
    } finally {
      setActionLoading(false);
    }
  };

  // Recorded Lecture CRUD Helpers
  const handleOpenAddRecordingModal = () => {
    setSelectedLectureForEdit(null);
    const courseId = selectedCourseForRecordings || coursesList[0]?.id || "";
    setLectureCourseId(courseId);
    
    // Find next class number
    const siblingLectures = coursesRecordings.filter(
      (l: any) => l.courseId === courseId || l.course?.id === courseId
    );
    const maxClassNo = siblingLectures.reduce((max: number, l: any) => {
      const num = parseInt(l.classNo, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    setLectureClassNo((maxClassNo + 1).toString());
    
    setLectureTitle("");
    setLectureUrl("");
    setLectureDurationHours("1");
    setLectureDurationMinutes("0");
    setLectureLive(false);
    setShowRecordedLectureModal(true);
  };

  const handleOpenEditRecordingModal = (lecture: any) => {
    setSelectedLectureForEdit(lecture);
    setLectureCourseId(lecture.courseId);
    setLectureClassNo(lecture.classNo ? lecture.classNo.toString() : "");
    setLectureTitle(lecture.title);
    setLectureUrl(lecture.recordingUrl);
    
    const totalMins = parseInt(lecture.duration, 10) || 0;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    setLectureDurationHours(hrs.toString());
    setLectureDurationMinutes(mins.toString());
    
    setLectureLive(lecture.recordingLive);
    setShowRecordedLectureModal(true);
  };

  const handleSaveRecordedLecture = async () => {
    if (!lectureCourseId || !lectureTitle || !lectureUrl || !lectureClassNo) {
      showAlert("Error", "Please fill in all required fields (Course, Class/Lecture Number, Title, URL).");
      return;
    }

    const classNoInt = parseInt(lectureClassNo, 10);
    if (isNaN(classNoInt) || classNoInt < 1) {
      showAlert("Error", "Class/Lecture Number must be a positive integer.");
      return;
    }

    const hrsInt = parseInt(lectureDurationHours, 10) || 0;
    const minsInt = parseInt(lectureDurationMinutes, 10) || 0;
    if (hrsInt < 0 || minsInt < 0) {
      showAlert("Error", "Duration hours and minutes cannot be negative.");
      return;
    }
    const totalMinutes = hrsInt * 60 + minsInt;
    if (totalMinutes <= 0) {
      showAlert("Error", "Duration must be greater than 0 minutes.");
      return;
    }

    const isYoutubeUrl = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(lectureUrl);
    if (!isYoutubeUrl) {
      showAlert("Error", "Please enter a valid YouTube Video URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ).");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        courseId: lectureCourseId,
        classNo: classNoInt,
        title: lectureTitle,
        recordingUrl: lectureUrl,
        duration: totalMinutes,
        recordingLive: lectureLive,
      };

      if (selectedLectureForEdit) {
        await api.patch(`/classes/recordings/${selectedLectureForEdit.id}`, payload);
      } else {
        await api.post(`/classes/recordings`, payload);
      }
      setShowRecordedLectureModal(false);
      await fetchDashboardData();
    } catch (err: any) {
      showAlert("Error", err.response?.data?.message || "Failed to save recorded lecture");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLiveRecording = async (lecture: any, isLive: boolean) => {
    setActionLoading(true);
    try {
      await api.patch(`/classes/recordings/${lecture.id}`, {
        recordingLive: isLive,
      });
      await fetchDashboardData();
    } catch (err: any) {
      showAlert("Error", err.response?.data?.message || "Failed to update recorded lecture");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRecording = async (id: string) => {
    const confirmed = await showConfirm("Delete Recording", "Are you sure you want to delete this recorded lecture?");
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await api.delete(`/classes/recordings/${id}`);
      await fetchDashboardData();
    } catch (err: any) {
      showAlert("Error", err.response?.data?.message || "Failed to delete recorded lecture");
    } finally {
      setActionLoading(false);
    }
  };

  const activeBatches = batchesHierarchy.filter(batch => {
    return batch.isActive && new Date(batch.endDate) >= new Date();
  });

  const pastBatches = batchesHierarchy.filter(batch => {
    return !batch.isActive || new Date(batch.endDate) < new Date();
  });

  const renderBatchBlock = (batch: any, isPast: boolean = false) => {
    return (
      <div key={batch.id} className={`bg-white border border-border-light rounded-xl overflow-hidden shadow-sm p-6 space-y-6 ${isPast ? 'opacity-85' : ''}`}>
        {/* Batch Header */}
        <div className="flex items-center justify-between border-b border-border-light pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-3">
              {batch.name}
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                batch.status === "admission"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : batch.status === "classes"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : batch.status === "completed"
                  ? "bg-gray-100 text-gray-500 border border-gray-200"
                  : batch.isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}>
                {batch.status === "admission"
                  ? "Admission Phase"
                  : batch.status === "classes"
                  ? "Classes Phase"
                  : batch.status === "completed"
                  ? "Completed"
                  : batch.isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Duration: {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
            </p>
          </div>
          
          {/* Total Applicants Pill */}
          <div className="bg-brand-green/5 border border-brand-green/10 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-brand-green block">Total Applicants</span>
            <span className="text-lg font-black text-brand-green block -mt-0.5">{batch.totalApplicants}</span>
          </div>
        </div>

        {/* Courses in Batch */}
        <div className="grid grid-cols-1 gap-6">
          {batch.courses.map((course: any) => (
            <div key={course.id} className="bg-bg-light border border-border-light rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Course: {course.name}
                </h3>
                {!isPast && (
                  <button 
                    onClick={() => handleOpenScheduleModal(batch.name, course.name)} 
                    className="btn-signup text-[10px] px-3 py-1 bg-brand-green border-brand-green hover:bg-brand-green/90 text-white cursor-pointer"
                  >
                    + Schedule Class
                  </button>
                )}
              </div>

              {/* Classes Table */}
              {course.classes.length === 0 ? (
                <p className="text-xs text-text-secondary italic pl-1">No classes scheduled for this course in this batch.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse bg-white border border-border-light rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border-light">
                        <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Class Title</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Start Time</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">End Time</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Permissions</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase">Status</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-text-secondary uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {course.classes.map((cls: any) => (
                        <tr key={cls.id} className="hover:bg-bg-light transition-colors">
                          <td className="px-4 py-3 text-xs font-bold text-text-primary">{cls.title}</td>
                          <td className="px-4 py-3 text-xs text-text-primary">
                            {new Date(cls.scheduledStart).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-text-primary">
                            {new Date(cls.scheduledEnd).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-[10px]">
                            <div className="flex gap-1.5 text-text-secondary items-center select-none flex-wrap">
                              <span title="Student Microphone" className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${cls.allowStudentMic ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-100"}`}>
                                Mic: {cls.allowStudentMic ? "On" : "Off"}
                              </span>
                              <span title="Student Camera" className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${cls.allowStudentCamera ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-100"}`}>
                                Cam: {cls.allowStudentCamera ? "On" : "Off"}
                              </span>
                              <span title="Student Screenshare" className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${cls.allowStudentScreenshare ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-100"}`}>
                                Share: {cls.allowStudentScreenshare ? "On" : "Off"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[10px]">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              cls.status === "live" ? "bg-red-500 text-white" : cls.status === "completed" ? "bg-gray-100 text-text-secondary" : "bg-blue-50 text-blue-600"
                            }`}>
                              {cls.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-right">
                            <div className="flex gap-2 justify-end">
                              {cls.status === "scheduled" && (
                                <button onClick={() => handleStatusChange(cls, "live")} className="btn-signup text-[10px] px-2 py-1 bg-green-600 border-green-600 hover:bg-green-700 text-white cursor-pointer">
                                  Go Live
                                </button>
                              )}
                              {cls.status === "live" && (
                                <>
                                  <a href={`/dashboard/classes/${cls.id}`} className="btn-signup text-[10px] px-2 py-1 bg-green-600 border-green-600 hover:bg-green-700 no-underline text-center text-white">
                                    Join
                                  </a>
                                  <button onClick={() => handleStatusChange(cls, "completed")} className="btn-signup text-[10px] px-2 py-1 bg-yellow-600 border-yellow-600 hover:bg-yellow-700 text-white cursor-pointer">
                                    End
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDelete(cls)} className="text-red-500 hover:text-red-700 font-bold px-1 py-0.5 cursor-pointer text-[10px]">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Classes & Lectures</h1>
          <p className="text-xs text-text-secondary mt-1">Manage live schedules and recorded lecture library</p>
        </div>
        <button onClick={() => {
          setForm({
            batchName: "",
            courseName: "",
            title: "",
            scheduledStart: "",
            scheduledEnd: "",
            allowStudentScreenshare: true,
            allowStudentMic: true,
            allowStudentCamera: true,
          });
          setShowModal(true);
        }} className="btn-signup text-xs px-4 py-2">
          + Schedule Class
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border-light mb-6">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'schedule'
              ? 'border-brand-green text-brand-green font-bold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Live Schedule Dashboard
        </button>
        <button
          onClick={() => {
            setActiveTab('recordings');
            setSelectedCourseForRecordings(null);
          }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'recordings'
              ? 'border-brand-green text-brand-green font-bold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Recorded Lectures library
        </button>
      </div>

      {activeTab === 'schedule' ? (
        <div className="space-y-10 animate-fade-in">
          {/* Active Batches Section */}
          <div className="space-y-6">
            <h3 className="text-base font-bold text-text-primary border-b border-border-light pb-2">Active Batches & Schedules</h3>
            {activeBatches.length === 0 ? (
              <p className="text-xs text-text-secondary italic bg-white border border-border-light rounded-xl p-8 text-center shadow-sm">
                No active batches running at this time.
              </p>
            ) : (
              activeBatches.map((batch) => renderBatchBlock(batch, false))
            )}
          </div>

          {/* Past Batches History Section */}
          <div className="space-y-6 pt-4">
            <h3 className="text-base font-bold text-text-secondary border-b border-border-light pb-2">Past Batches & Classes History</h3>
            {pastBatches.length === 0 ? (
              <p className="text-xs text-text-secondary italic bg-white border border-border-light rounded-xl p-8 text-center shadow-sm">
                No completed batches found.
              </p>
            ) : (
              pastBatches.map((batch) => renderBatchBlock(batch, true))
            )}
          </div>
        </div>
      ) : (
        selectedCourseForRecordings === null ? (
          // ===== COURSE DIRECTORY VIEW =====
          <div className="bg-white border border-border-light rounded-xl shadow-sm p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-border-light pb-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Recorded Lectures Library</h2>
                <p className="text-xs text-text-secondary mt-0.5">Select a course to view and manage its recorded classes</p>
              </div>
              <button 
                onClick={handleOpenAddRecordingModal} 
                className="btn-signup text-xs px-3 py-1.5 bg-[#c9a84c] border-[#c9a84c] hover:bg-[#c9a84c]/90 text-white cursor-pointer"
              >
                + Add Recorded Lecture
              </button>
            </div>

            {coursesList.length === 0 ? (
              <p className="text-xs text-text-secondary italic py-8 text-center bg-bg-light border border-border-light rounded-xl">No courses available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesList.map((course) => {
                  const courseLecturesCount = coursesRecordings.filter(
                    (lecture: any) => lecture.courseId === course.id || lecture.course?.id === course.id
                  ).length;

                  return (
                    <div 
                      key={course.id}
                      onClick={() => {
                        setSelectedCourseForRecordings(course.id);
                        setCourseSubTab('lectures');
                      }}
                      className="bg-white border border-border-light hover:border-[#c9a84c]/50 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 cursor-pointer group flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] font-black text-sm group-hover:bg-[#c9a84c] group-hover:text-black transition-colors">
                          {course.name.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase()}
                        </div>
                        <h3 className="text-sm font-bold text-text-primary group-hover:text-[#c9a84c] transition-colors leading-snug line-clamp-2">
                          {course.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-xs text-text-secondary font-medium">
                          {courseLecturesCount} Lecture{courseLecturesCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px] font-bold text-[#c9a84c] group-hover:underline flex items-center gap-1">
                          Manage
                          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (() => {
          const activeCourse = coursesList.find(c => c.id === selectedCourseForRecordings);
          const filteredLectures = coursesRecordings.filter(
            (lecture: any) => lecture.courseId === selectedCourseForRecordings || lecture.course?.id === selectedCourseForRecordings
          );

          return (
            // ===== SPECIFIC COURSE LECTURES VIEW =====
            <div className="bg-white border border-border-light rounded-xl shadow-sm p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <div className="space-y-1">
                  <button 
                    onClick={() => setSelectedCourseForRecordings(null)}
                    className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-all font-semibold"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Courses
                  </button>
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2 mt-1">
                    <span className="text-text-secondary text-sm font-normal">Course:</span>
                    {activeCourse?.name}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {courseSubTab === 'lectures' 
                      ? `${filteredLectures.length} lecture${filteredLectures.length !== 1 ? 's' : ''} uploaded for this course`
                      : `${courseStudents.length} student${courseStudents.length !== 1 ? 's' : ''} enrolled in this course`}
                  </p>
                </div>
                {courseSubTab === 'lectures' && (
                  <button 
                    onClick={handleOpenAddRecordingModal} 
                    className="btn-signup text-xs px-3 py-1.5 bg-[#c9a84c] border-[#c9a84c] hover:bg-[#c9a84c]/90 text-white cursor-pointer"
                  >
                    + Add Recorded Lecture
                  </button>
                )}
              </div>

              {/* Sub-tabs */}
              <div className="flex border-b border-border-light pb-0.5 mb-2">
                <button
                  onClick={() => setCourseSubTab('lectures')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    courseSubTab === 'lectures'
                      ? 'border-[#c9a84c] text-[#c9a84c]'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Recorded Lectures
                </button>
                <button
                  onClick={() => setCourseSubTab('students')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    courseSubTab === 'students'
                      ? 'border-[#c9a84c] text-[#c9a84c]'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Enrolled Students
                </button>
              </div>

              {courseSubTab === 'lectures' ? (
                filteredLectures.length === 0 ? (
                  <div className="text-center py-12 bg-bg-light border border-border-light rounded-xl space-y-3">
                    <p className="text-xs text-text-secondary italic">No recorded lectures uploaded for this course yet.</p>
                    <button 
                      onClick={handleOpenAddRecordingModal} 
                      className="btn-signup text-xs px-3 py-1.5 bg-[#c9a84c] border-[#c9a84c] hover:bg-[#c9a84c]/90 text-white cursor-pointer inline-block"
                    >
                      Upload First Lecture
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse bg-white border border-border-light rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50 border-b border-border-light">
                          <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase w-20">Class No</th>
                          <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase">Lecture Title</th>
                          <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase w-32">Duration</th>
                          <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase">Video URL</th>
                          <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase w-28">Status</th>
                          <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase text-right w-80">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light">
                        {filteredLectures.map((lecture: any) => (
                          <tr key={lecture.id} className="hover:bg-bg-light transition-colors">
                            <td className="px-4 py-3 text-xs font-semibold text-text-secondary">{lecture.classNo || "—"}</td>
                            <td className="px-4 py-3 text-sm font-bold text-text-primary">{lecture.title}</td>
                            <td className="px-4 py-3 text-xs font-semibold text-brand-green">{formatDuration(lecture.duration)}</td>
                            <td className="px-4 py-3 text-xs text-text-secondary truncate max-w-[200px]" title={lecture.recordingUrl}>
                              <span className="underline">{lecture.recordingUrl}</span>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                lecture.recordingLive 
                                  ? "bg-green-50 text-green-700 border border-green-200" 
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}>
                                {lecture.recordingLive ? "Live" : "Draft"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-right">
                              <div className="flex gap-2 justify-end items-center">
                                <button 
                                  onClick={async () => {
                                    try {
                                      const { data } = await api.post(`/classes/${lecture.id}/recording-token`);
                                      window.open(`/dashboard/recordings/player?token=${data.token}`, '_blank');
                                    } catch (err: any) {
                                      showAlert("Error", err.response?.data?.message || "Failed to generate preview token");
                                    }
                                  }} 
                                  className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white font-semibold rounded-lg text-xs transition-all cursor-pointer"
                                >
                                  Preview
                                </button>
                                <button 
                                  onClick={() => handleOpenEditRecordingModal(lecture)} 
                                  className="btn-signup text-xs px-3 py-1.5 bg-bg-light border-border-light text-text-secondary hover:text-text-primary cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleToggleLiveRecording(lecture, !lecture.recordingLive)} 
                                  className={`px-3 py-1.5 font-bold border rounded-lg text-xs transition-all cursor-pointer ${
                                    lecture.recordingLive 
                                      ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200" 
                                      : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  }`}
                                >
                                  {lecture.recordingLive ? "Make Draft" : "Make Live"}
                                </button>
                                <button 
                                  onClick={() => handleDeleteRecording(lecture.id)} 
                                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                fetchingStudents ? (
                  <div className="flex items-center justify-center py-20 bg-bg-light border border-border-light rounded-xl">
                    <div className="w-8 h-8 border-4 border-[#c9a84c]/30 border-t-[#c9a84c] rounded-full animate-spin" />
                  </div>
                ) : courseStudents.length === 0 ? (
                  <div className="text-center py-12 bg-bg-light border border-border-light rounded-xl">
                    <p className="text-xs text-text-secondary italic">No students enrolled in this course yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-secondary">
                        Showing {courseStudents.length} student{courseStudents.length !== 1 ? 's' : ''} enrolled
                      </span>
                      <button
                        onClick={() => {
                          const emails = courseStudents.map(s => s.email).join(', ');
                          navigator.clipboard.writeText(emails);
                          showAlert("Copied!", "All student emails copied as a comma-separated list.");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a84c] border-[#c9a84c] hover:bg-[#c9a84c]/90 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy All Emails for YT Studio
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-white border border-border-light rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-gray-50 border-b border-border-light">
                            <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase">Student Name</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase">Email</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase">WhatsApp</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase">Batch</th>
                            <th className="px-4 py-3 text-xs font-bold text-text-secondary uppercase text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                          {courseStudents.map((student: any) => (
                            <tr key={student.studentId} className="hover:bg-bg-light transition-colors">
                              <td className="px-4 py-3 text-xs font-bold text-text-primary">{student.name}</td>
                              <td className="px-4 py-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-text-secondary">{student.email}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(student.email);
                                      showAlert("Copied!", `Email "${student.email}" copied to clipboard.`);
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                    title="Copy Email"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs font-semibold text-text-primary">{student.whatsapp || "—"}</td>
                              <td className="px-4 py-3 text-xs font-bold text-[#c9a84c]">{student.batchName || "—"}</td>
                              <td className="px-4 py-3 text-xs text-right">
                                <button
                                  onClick={() => setSelectedStudentForDetails(student)}
                                  className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
                                >
                                  Full Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>
          );
        })()
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-border-light rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-text-primary text-base">Schedule New Class</h2>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary text-xl font-bold">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Class Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" placeholder="e.g. Tax Filing Basics" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Batch</label>
                <select
                  value={form.batchName}
                  onChange={(e) => {
                    const name = e.target.value;
                    const foundBatch = batchesList.find((b) => b.name === name);
                    setSelectedBatch(foundBatch || null);
                    setForm({ ...form, batchName: name, courseName: "" }); // Reset course selection
                  }}
                  className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                >
                  <option value="">Select a batch</option>
                  {batchesList.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Course</label>
                <select
                  value={form.courseName}
                  onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                  disabled={!form.batchName}
                  className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary disabled:opacity-60"
                >
                  <option value="">Select a course</option>
                  {selectedBatch?.courses?.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Start Time</label>
                  <input type="datetime-local" value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">End Time</label>
                  <input type="datetime-local" value={form.scheduledEnd} onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                </div>
              </div>

              {form.batchName && form.scheduledStart && (() => {
                const weekClassesCount = getWeeklyClassCount();
                const targetClasses = batchesHierarchy.find(b => b.name === form.batchName)?.classesPerWeek || 3;
                const limitReached = weekClassesCount >= targetClasses;
                return (
                  <div className={`text-xs font-semibold rounded-lg p-2.5 flex items-center justify-between border ${
                    limitReached
                      ? "text-yellow-600 bg-yellow-50 border-yellow-200"
                      : "text-brand-green bg-brand-green/5 border-brand-green/10"
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${limitReached ? "bg-yellow-500 animate-pulse" : "bg-brand-green"}`} />
                      Weekly target tracking:
                    </span>
                    <span>{weekClassesCount} of {targetClasses} class(es) scheduled this week</span>
                  </div>
                );
              })()}

              {/* Student Permissions Section */}
              <div className="border-t border-border-light pt-4 space-y-3">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Student Permissions</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-text-primary">Microphone Access</span>
                    <span className="text-[10px] text-text-secondary">Allow students to unmute their mic</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.allowStudentMic} 
                    onChange={(e) => setForm({ ...form, allowStudentMic: e.target.checked })}
                    className="w-4 h-4 text-brand-green border-border-light rounded focus:ring-brand-green cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-text-primary">Camera Access</span>
                    <span className="text-[10px] text-text-secondary">Allow students to turn on camera</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.allowStudentCamera} 
                    onChange={(e) => setForm({ ...form, allowStudentCamera: e.target.checked })}
                    className="w-4 h-4 text-brand-green border-border-light rounded focus:ring-brand-green cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-text-primary">Screen Sharing</span>
                    <span className="text-[10px] text-text-secondary">Allow students to share screen</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.allowStudentScreenshare} 
                    onChange={(e) => setForm({ ...form, allowStudentScreenshare: e.target.checked })}
                    className="w-4 h-4 text-brand-green border-border-light rounded focus:ring-brand-green cursor-pointer"
                  />
                </div>
              </div>

              <button onClick={handleCreate} className="btn-signup w-full py-2.5 text-sm cursor-pointer">Schedule Class</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Recorded Lecture Modal */}
      {showRecordedLectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-border-light rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-text-primary text-base">
                {selectedLectureForEdit ? "Edit Recorded Lecture" : "Add Recorded Lecture"}
              </h2>
              <button 
                onClick={() => setShowRecordedLectureModal(false)} 
                className="text-text-secondary hover:text-text-primary text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Course</label>
                <select
                  value={lectureCourseId}
                  onChange={(e) => {
                    const newCourseId = e.target.value;
                    setLectureCourseId(newCourseId);
                    const siblingLectures = coursesRecordings.filter(
                      (l: any) => l.courseId === newCourseId || l.course?.id === newCourseId
                    );
                    const maxClassNo = siblingLectures.reduce((max: number, l: any) => {
                      const num = parseInt(l.classNo, 10);
                      return !isNaN(num) && num > max ? num : max;
                    }, 0);
                    setLectureClassNo((maxClassNo + 1).toString());
                  }}
                  disabled={selectedCourseForRecordings !== null}
                  className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-[#c9a84c] disabled:opacity-75 disabled:bg-gray-50"
                >
                  <option value="">Select a course</option>
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Class/Lecture Number</label>
                <input 
                  type="number"
                  min="1"
                  step="1"
                  value={lectureClassNo} 
                  onChange={(e) => setLectureClassNo(e.target.value)} 
                  className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-[#c9a84c]" 
                  placeholder="e.g. 1" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Lecture Title</label>
                <input 
                  type="text"
                  value={lectureTitle} 
                  onChange={(e) => setLectureTitle(e.target.value)} 
                  className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-[#c9a84c]" 
                  placeholder="e.g. Lecture 1: Introduction to FBR Portal" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">YouTube Video URL</label>
                <input 
                  type="text"
                  value={lectureUrl} 
                  onChange={(e) => setLectureUrl(e.target.value)} 
                  className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-[#c9a84c]" 
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Duration</label>
                <div className="flex gap-4">
                  <div className="flex-1 flex items-center gap-2">
                    <input 
                      type="number"
                      min="0"
                      value={lectureDurationHours} 
                      onChange={(e) => setLectureDurationHours(e.target.value)} 
                      className="w-full px-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-[#c9a84c]" 
                      placeholder="Hours" 
                    />
                    <span className="text-xs text-text-secondary font-bold">hrs</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input 
                      type="number"
                      min="0"
                      max="59"
                      value={lectureDurationMinutes} 
                      onChange={(e) => setLectureDurationMinutes(e.target.value)} 
                      className="w-full px-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:outline-none focus:ring-1 focus:ring-[#c9a84c]" 
                      placeholder="Minutes" 
                    />
                    <span className="text-xs text-text-secondary font-bold">mins</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox"
                  id="lecture-live"
                  checked={lectureLive}
                  onChange={(e) => setLectureLive(e.target.checked)}
                  className="w-4.5 h-4.5 text-brand-green border-border-light rounded focus:ring-brand-green cursor-pointer"
                />
                <label htmlFor="lecture-live" className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                  Make Live / Publish Immediately
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border-light">
                <button 
                  onClick={handleSaveRecordedLecture} 
                  className="btn-signup flex-1 py-2.5 text-sm cursor-pointer"
                >
                  Save Lecture
                </button>
                <button 
                  onClick={() => setShowRecordedLectureModal(false)} 
                  className="px-4 py-2.5 bg-transparent border border-border-light hover:bg-gray-50 text-text-secondary font-semibold rounded-lg text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-border-light rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
              <h2 className="font-bold text-text-primary text-base">Student Admission &amp; Profile Details</h2>
              <button 
                onClick={() => setSelectedStudentForDetails(null)} 
                className="text-text-secondary hover:text-text-primary text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-text-secondary">Full Name</span>
                  <span className="text-sm font-bold text-text-primary">{selectedStudentForDetails.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-text-secondary">Email</span>
                  <span className="text-sm font-bold text-text-primary">{selectedStudentForDetails.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-text-secondary">Father&apos;s Name</span>
                  <span className="text-sm font-semibold text-text-primary">{selectedStudentForDetails.fatherName || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-text-secondary">WhatsApp</span>
                  <span className="text-sm font-semibold text-text-primary">{selectedStudentForDetails.whatsapp || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-text-secondary">CNIC</span>
                  <span className="text-sm font-semibold text-text-primary">{selectedStudentForDetails.cnic || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-text-secondary">Gender</span>
                  <span className="text-sm font-semibold text-text-primary capitalize">{selectedStudentForDetails.gender || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-text-secondary">Date of Birth</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {selectedStudentForDetails.dateOfBirth ? new Date(selectedStudentForDetails.dateOfBirth).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-text-secondary">Enrollment Batch</span>
                  <span className="text-sm font-semibold text-brand-green">{selectedStudentForDetails.batchName || "—"}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <span className="block text-[10px] uppercase font-bold text-text-secondary mb-1">Postal Address</span>
                <p className="text-xs text-text-primary bg-bg-light border border-border-light p-2.5 rounded-lg">
                  {selectedStudentForDetails.postalAddress || "No postal address provided"}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase mb-2">Academic Information</h4>
                <div className="grid grid-cols-3 gap-2 bg-bg-light border border-border-light p-3 rounded-lg text-center">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-text-secondary">Qualification</span>
                    <span className="text-xs font-bold text-text-primary">{selectedStudentForDetails.lastQualification || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-text-secondary">Passing Year</span>
                    <span className="text-xs font-bold text-text-primary">{selectedStudentForDetails.passingYear || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-text-secondary">Institute</span>
                    <span className="text-xs font-bold text-text-primary truncate block" title={selectedStudentForDetails.institute}>{selectedStudentForDetails.institute || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-gray-100">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(selectedStudentForDetails.email);
                  showAlert("Copied!", `Email "${selectedStudentForDetails.email}" copied.`);
                }}
                className="btn-signup text-xs px-4 py-2 bg-neutral-900 border-neutral-900 text-white hover:bg-neutral-800"
              >
                Copy Email
              </button>
              <button 
                onClick={() => setSelectedStudentForDetails(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {actionLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/25 backdrop-blur-[2px]">
          <div className="bg-white border border-border-light rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xl">
            <div className="w-10 h-10 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Processing Request...</p>
          </div>
        </div>
      )}
    </div>
  );
}
