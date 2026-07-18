"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useModal } from "@/lib/ModalContext";

type Tab = "basic" | "curriculum" | "instructor" | "outcomes" | "reviews";

export default function AdminCourseBuilderPage() {
  const params = useParams();
  const { showAlert } = useModal();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("basic");

  // Form State
  const [courseData, setCourseData] = useState({
    name: "",
    originalFee: 50000,
    discountedFee: 30000,
    isActive: true,
    description: "",
    longDescription: "",
    category: "",
    level: "Intermediate",
    duration: 36,
    language: "Urdu & English",
    badge: "",
    thumbnail: "",
    instructorName: "",
    instructorTitle: "",
    instructorBio: "",
    instructorImage: "",
    whatYouWillLearn: [] as string[],
    requirements: [] as string[],
    lecturesPerLiveClass: 1,
  });

  // Curriculum & Reviews lists state
  const [modules, setModules] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Temp Review Form State
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 5,
    content: "",
    date: "Just now",
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        const c = res.data;
        setCourseData({
          name: c.name || "",
          originalFee: c.originalFee ?? 50000,
          discountedFee: c.discountedFee ?? 30000,
          isActive: c.isActive ?? true,
          description: c.description || "",
          longDescription: c.longDescription || "",
          category: c.category || "",
          level: c.level || "Intermediate",
          duration: c.duration ?? 36,
          language: c.language || "Urdu & English",
          badge: c.badge || "",
          thumbnail: c.thumbnail || "",
          instructorName: c.instructorName || "",
          instructorTitle: c.instructorTitle || "",
          instructorBio: c.instructorBio || "",
          instructorImage: c.instructorImage || "",
          whatYouWillLearn: c.whatYouWillLearn || [],
          requirements: c.requirements || [],
          lecturesPerLiveClass: c.lecturesPerLiveClass ?? 1,
        });
        setModules(c.modules || []);
        setReviews(c.reviews || []);
      } catch (err) {
        console.error("Failed to load course", err);
        showAlert("Error", "Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...courseData,
        badge: courseData.badge || null,
        modules: modules.map((m: any, mIdx: number) => ({
          title: m.title,
          sortOrder: mIdx,
          lessons: m.lessons.map((l: any, lIdx: number) => ({
            title: l.title,
            duration: Number(l.duration),
            isPreview: l.isPreview || false,
            sortOrder: lIdx,
          })),
        })),
        reviews: reviews.map((r: any) => ({
          name: r.name,
          rating: Number(r.rating),
          content: r.content,
          date: r.date,
        })),
      };

      await api.patch(`/courses/${id}`, payload);
      showAlert("Success", "Course details saved successfully!");
    } catch (err: any) {
      console.error(err);
      showAlert("Error", err.response?.data?.message || "Failed to save course changes");
    } finally {
      setSaving(false);
    }
  };

  // List Management Helpers
  const addOutcome = () => {
    setCourseData((prev) => ({
      ...prev,
      whatYouWillLearn: [...prev.whatYouWillLearn, ""],
    }));
  };

  const removeOutcome = (idx: number) => {
    setCourseData((prev) => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== idx),
    }));
  };

  const updateOutcome = (idx: number, val: string) => {
    setCourseData((prev) => {
      const arr = [...prev.whatYouWillLearn];
      arr[idx] = val;
      return { ...prev, whatYouWillLearn: arr };
    });
  };

  const addRequirement = () => {
    setCourseData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const removeRequirement = (idx: number) => {
    setCourseData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== idx),
    }));
  };

  const updateRequirement = (idx: number, val: string) => {
    setCourseData((prev) => {
      const arr = [...prev.requirements];
      arr[idx] = val;
      return { ...prev, requirements: arr };
    });
  };

  // Module & Lesson Helpers
  const addModule = () => {
    setModules((prev) => [
      ...prev,
      { title: `New Module ${prev.length + 1}`, lessons: [] },
    ]);
  };

  const updateModuleTitle = (mIdx: number, title: string) => {
    setModules((prev) => {
      const arr = [...prev];
      arr[mIdx] = { ...arr[mIdx], title };
      return arr;
    });
  };

  const removeModule = (mIdx: number) => {
    setModules((prev) => prev.filter((_, i) => i !== mIdx));
  };

  const addLesson = (mIdx: number) => {
    setModules((prev) => {
      const arr = [...prev];
      arr[mIdx].lessons = [
        ...arr[mIdx].lessons,
        { title: `New Lesson ${arr[mIdx].lessons.length + 1}`, duration: 15, isPreview: false },
      ];
      return arr;
    });
  };

  const updateLessonField = (mIdx: number, lIdx: number, field: string, val: any) => {
    setModules((prev) => {
      const arr = [...prev];
      const lessons = [...arr[mIdx].lessons];
      lessons[lIdx] = { ...lessons[lIdx], [field]: val };
      arr[mIdx] = { ...arr[mIdx], lessons };
      return arr;
    });
  };

  const removeLesson = (mIdx: number, lIdx: number) => {
    setModules((prev) => {
      const arr = [...prev];
      arr[mIdx].lessons = arr[mIdx].lessons.filter((_: any, i: number) => i !== lIdx);
      return arr;
    });
  };

  // Review Helpers
  const addReview = () => {
    if (!newReview.name.trim() || !newReview.content.trim()) {
      showAlert("Alert", "Please enter a name and content for the review.");
      return;
    }
    setReviews((prev) => [...prev, { ...newReview }]);
    setNewReview({ name: "", rating: 5, content: "", date: "Just now" });
  };

  const removeReview = (rIdx: number) => {
    setReviews((prev) => prev.filter((_, i) => i !== rIdx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Dynamic Header */}
      <div className="sticky top-0 bg-bg-light/95 backdrop-blur-md z-30 flex flex-col md:flex-row md:items-center justify-between border-b border-border-light pb-4 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
            <Link href="/admin/courses" className="text-brand-green hover:underline no-underline">
              Courses
            </Link>
            <span>/</span>
            <span>Edit Details</span>
          </div>
          <h1 className="text-xl font-extrabold text-text-primary mt-2">{courseData.name || "Course Builder"}</h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={courseData.isActive}
              onChange={(e) => setCourseData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green accent-brand-green"
            />
            <span className="text-sm font-semibold text-text-secondary uppercase">Active Status</span>
          </label>

          <button onClick={handleSave} className="btn-signup px-5 py-2.5 text-xs">
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex gap-1 border-b border-border-light mb-8 overflow-x-auto">
        {(
          [
            { id: "basic", label: "Basic Info" },
            { id: "curriculum", label: "Curriculum Builder" },
            { id: "instructor", label: "Instructor Profile" },
            { id: "outcomes", label: "Outcomes & Requirements" },
            { id: "reviews", label: "Reviews & Ratings" },
          ] as const
        ).map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-brand-green text-brand-green"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === "basic" && (
        <div className="space-y-6 bg-white border border-border-light rounded-xl p-6 shadow-sm animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Course Title
              </label>
              <input
                type="text"
                value={courseData.name}
                onChange={(e) => setCourseData((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                placeholder="e.g. Certified Tax Practitioner (CTP)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={courseData.category}
                onChange={(e) => setCourseData((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                placeholder="e.g. Income Tax"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Original Fee (PKR)
              </label>
              <input
                type="number"
                value={courseData.originalFee}
                onChange={(e) => setCourseData((p) => ({ ...p, originalFee: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Discounted Fee (PKR) <span className="text-[10px] text-text-secondary">(Enter 0 for FREE)</span>
              </label>
              <input
                type="number"
                value={courseData.discountedFee}
                onChange={(e) => setCourseData((p) => ({ ...p, discountedFee: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Difficulty Level
              </label>
              <select
                value={courseData.level}
                onChange={(e) => setCourseData((p) => ({ ...p, level: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Badge / Ribbons
              </label>
              <select
                value={courseData.badge || ""}
                onChange={(e) => setCourseData((p) => ({ ...p, badge: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
              >
                <option value="">No Badge</option>
                <option value="new">New</option>
                <option value="bestseller">Bestseller</option>
                <option value="free">Free Badge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Recorded Classes to Unlock per Live Class
              </label>
              <input
                type="number"
                value={courseData.lecturesPerLiveClass}
                onChange={(e) => setCourseData((p) => ({ ...p, lecturesPerLiveClass: Number(e.target.value) || 1 }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                min={1}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Total Duration (Hours)
              </label>
              <input
                type="number"
                value={courseData.duration}
                onChange={(e) => setCourseData((p) => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Language
              </label>
              <input
                type="text"
                value={courseData.language}
                onChange={(e) => setCourseData((p) => ({ ...p, language: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                placeholder="e.g. Urdu & English"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
              Course Thumbnail URL
            </label>
            <input
              type="text"
              value={courseData.thumbnail}
              onChange={(e) => setCourseData((p) => ({ ...p, thumbnail: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
              Short Description (Card Overview)
            </label>
            <input
              type="text"
              value={courseData.description}
              onChange={(e) => setCourseData((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
              placeholder="e.g. Master the complete process of filing income tax returns..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
              Long Description (About Section)
            </label>
            <textarea
              rows={4}
              value={courseData.longDescription}
              onChange={(e) => setCourseData((p) => ({ ...p, longDescription: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary resize-y"
              placeholder="Enter detailed long description..."
            />
          </div>
        </div>
      )}

      {/* Curriculum Builder Tab */}
      {activeTab === "curriculum" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">Curriculum Modules &amp; Lessons</h2>
            <button
              onClick={addModule}
              className="btn-signup text-xs px-4 py-2 bg-brand-green text-white hover:bg-brand-green-dark"
            >
              + Add Module
            </button>
          </div>

          {modules.map((mod: any, mIdx: number) => (
            <div key={mIdx} className="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
              <div className="bg-bg-light border-b border-border-light px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <span className="text-xs font-bold text-brand-green uppercase bg-white px-2.5 py-1 border border-border-light rounded">
                    Module {mIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm font-bold border border-border-light rounded-lg bg-white text-text-primary"
                    placeholder="Enter module title"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addLesson(mIdx)}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-border-light text-brand-green hover:bg-bg-light rounded-lg transition-colors"
                  >
                    + Add Lesson
                  </button>
                  <button
                    onClick={() => removeModule(mIdx)}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete Module
                  </button>
                </div>
              </div>

              {/* Lessons list inside module */}
              <div className="divide-y divide-border-light">
                {mod.lessons.map((lesson: any, lIdx: number) => (
                  <div key={lIdx} className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap hover:bg-bg-light/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                      <span className="text-[10px] font-semibold text-text-secondary">Lesson {lIdx + 1}</span>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLessonField(mIdx, lIdx, "title", e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                        placeholder="Enter lesson title"
                      />
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">Duration (mins)</label>
                        <input
                          type="number"
                          value={lesson.duration}
                          onChange={(e) => updateLessonField(mIdx, lIdx, "duration", e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-border-light rounded bg-white text-text-primary text-center"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lesson.isPreview || false}
                          onChange={(e) => updateLessonField(mIdx, lIdx, "isPreview", e.target.checked)}
                          className="w-3.5 h-3.5 text-brand-green border-gray-300 rounded focus:ring-brand-green accent-brand-green"
                        />
                        <span className="text-xs text-text-secondary select-none font-medium">Free Preview</span>
                      </label>
                      <button
                        onClick={() => removeLesson(mIdx, lIdx)}
                        className="text-text-secondary hover:text-red-600 transition-colors text-lg font-bold"
                        title="Delete lesson"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                {mod.lessons.length === 0 && (
                  <div className="text-center py-6 text-xs text-text-secondary italic">
                    No lessons in this module. Click &quot;+ Add Lesson&quot; to begin.
                  </div>
                )}
              </div>
            </div>
          ))}

          {modules.length === 0 && (
            <div className="bg-white border border-border-light rounded-xl p-12 text-center text-text-secondary text-sm italic">
              No modules built. Click &quot;+ Add Module&quot; to build your curriculum outline.
            </div>
          )}
        </div>
      )}

      {/* Instructor Profile Tab */}
      {activeTab === "instructor" && (
        <div className="space-y-6 bg-white border border-border-light rounded-xl p-6 shadow-sm animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Instructor Name
              </label>
              <input
                type="text"
                value={courseData.instructorName}
                onChange={(e) => setCourseData((p) => ({ ...p, instructorName: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                placeholder="e.g. Barrister Ahmed Khan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                Instructor Professional Title
              </label>
              <input
                type="text"
                value={courseData.instructorTitle}
                onChange={(e) => setCourseData((p) => ({ ...p, instructorTitle: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                placeholder="e.g. Senior Tax Consultant & SC Advocate"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
              Instructor Profile Photo URL
            </label>
            <input
              type="text"
              value={courseData.instructorImage}
              onChange={(e) => setCourseData((p) => ({ ...p, instructorImage: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
              Instructor Biography (Bio)
            </label>
            <textarea
              rows={5}
              value={courseData.instructorBio}
              onChange={(e) => setCourseData((p) => ({ ...p, instructorBio: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary resize-y"
              placeholder="Enter details about the instructor's background, qualifications, and accomplishments..."
            />
          </div>
        </div>
      )}

      {/* Outcomes & Requirements Tab */}
      {activeTab === "outcomes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          {/* Learning Outcomes */}
          <div className="bg-white border border-border-light rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <h3 className="font-bold text-text-primary text-sm">What You&apos;ll Learn</h3>
              <button
                onClick={addOutcome}
                className="px-2.5 py-1 text-xs font-bold text-brand-green border border-brand-green/20 bg-brand-green/5 hover:bg-brand-green/10 rounded-lg transition-colors"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {courseData.whatYouWillLearn.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateOutcome(idx, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                    placeholder="Enter learning objective"
                  />
                  <button
                    onClick={() => removeOutcome(idx)}
                    className="text-red-500 hover:text-red-700 font-bold text-xl px-2"
                  >
                    ×
                  </button>
                </div>
              ))}

              {courseData.whatYouWillLearn.length === 0 && (
                <div className="text-center py-6 text-xs text-text-secondary italic">
                  No learning outcomes listed. Add items using the button above.
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white border border-border-light rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <h3 className="font-bold text-text-primary text-sm">Requirements</h3>
              <button
                onClick={addRequirement}
                className="px-2.5 py-1 text-xs font-bold text-brand-green border border-brand-green/20 bg-brand-green/5 hover:bg-brand-green/10 rounded-lg transition-colors"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {courseData.requirements.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateRequirement(idx, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                    placeholder="Enter prerequisite / requirement"
                  />
                  <button
                    onClick={() => removeRequirement(idx)}
                    className="text-red-500 hover:text-red-700 font-bold text-xl px-2"
                  >
                    ×
                  </button>
                </div>
              ))}

              {courseData.requirements.length === 0 && (
                <div className="text-center py-6 text-xs text-text-secondary italic">
                  No prerequisites listed. Add items using the button above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <div className="space-y-6 animate-fade-in">
          {/* Add Review Panel */}
          <div className="bg-white border border-border-light rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-text-primary text-sm border-b border-border-light pb-2">
              Add Mock / Custom Review
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Reviewer Name
                </label>
                <input
                  type="text"
                  value={newReview.name}
                  onChange={(e) => setNewReview((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                  placeholder="e.g. Ali Raza"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Rating
                </label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview((p) => ({ ...p, rating: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Date Label
                </label>
                <input
                  type="text"
                  value={newReview.date}
                  onChange={(e) => setNewReview((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary"
                  placeholder="e.g. 2 weeks ago"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                Review Content
              </label>
              <textarea
                rows={3}
                value={newReview.content}
                onChange={(e) => setNewReview((p) => ({ ...p, content: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary resize-y"
                placeholder="Write the reviewer's testimonial..."
              />
            </div>

            <button
              onClick={addReview}
              className="btn-signup text-xs px-5 py-2 bg-brand-green text-white hover:bg-brand-green-dark"
            >
              Add Review Record
            </button>
          </div>

          {/* Reviews List */}
          <div className="bg-white border border-border-light rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-text-primary text-sm border-b border-border-light pb-2">
              Reviews List ({reviews.length})
            </h3>
            <div className="divide-y divide-border-light">
              {reviews.map((rev: any, idx: number) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-text-primary">{rev.name}</span>
                      <span className="text-xs text-text-secondary">{rev.date}</span>
                    </div>
                    <div className="flex items-center text-amber-500 text-xs">
                      {Array.from({ length: 5 }).map((_: any, i: number) => (
                        <span key={i}>{i < rev.rating ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{rev.content}</p>
                  </div>
                  <button
                    onClick={() => removeReview(idx)}
                    className="text-red-500 hover:text-red-700 font-medium text-xs self-start px-2 py-1 border border-red-200 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="text-center py-6 text-xs text-text-secondary italic">
                  No reviews recorded for this course.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Save loading backdrop */}
      {saving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px] animate-fade-in">
          <div className="bg-white border border-border-light rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xl">
            <div className="w-10 h-10 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Saving course details...</p>
          </div>
        </div>
      )}
    </div>
  );
}
