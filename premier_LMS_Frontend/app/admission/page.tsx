'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useModal } from '@/lib/ModalContext';

export default function AdmissionPage() {
  const { user } = useAuth();
  const { showAlert } = useModal();

  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  // Form State
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [postalAddress, setPostalAddress] = useState("");
  const [lastQualification, setLastQualification] = useState("");
  const [passingYear, setPassingYear] = useState("");
  const [institute, setInstitute] = useState("");

  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Single course selection (radio)
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");

  // Files Upload filenames
  const [cnicFile, setCnicFile] = useState("");
  const [photoFile, setPhotoFile] = useState("");
  const [paymentProof, setPaymentProof] = useState("");

  // Loading / Feedback status
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Enrollment status checks
  const [hasActiveEnrollment, setHasActiveEnrollment] = useState(false);
  const [activeCourseName, setActiveCourseName] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      setFullName(user.name);
      setEmail(user.email);

      // Check if user already has active enrollment
      if (user.enrolledCourses && user.enrolledCourses.length > 0) {
        setHasActiveEnrollment(true);
        setActiveCourseName(user.enrolledCourses[0]);
      }
    }
    setCheckingStatus(false);
  }, [user]);

  useEffect(() => {
    // Attempt to load batches dynamically from backend
    api.get('/batches/public')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setBatchesList(res.data);
          // Pre-select first batch if available
          setSelectedBatchId(res.data[0].id);
          setCoursesList(res.data[0].courses || []);
        } else {
          // If no batches, fallback to all courses
          fetchFallbackCourses();
        }
      })
      .catch((err) => {
        console.log('Error fetching batches list, using fallback courses:', err);
        fetchFallbackCourses();
      });
  }, []);

  const fetchFallbackCourses = () => {
    api.get('/courses')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setCoursesList(res.data);
        }
      })
      .catch((err) => {
        console.log('Error fetching courses list:', err);
      });
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const selectedBatch = batchesList.find((b) => b.id === batchId);
    if (selectedBatch) {
      setCoursesList(selectedBatch.courses || []);
      setSelectedCourse(""); // Reset selection on batch change
    }
  };

  // Calculate Total Fee (single course)
  const totalAmount = (() => {
    if (!selectedCourse) return 0;
    const course = coursesList.find((c) => c.name === selectedCourse);
    return course ? course.discountedFee : 30000;
  })();

  // File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setter(res.data.filename);
    } catch (err: any) {
      showAlert('Upload Failed', err.response?.data?.message || 'File upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedCourse) {
      setErrorMsg("Please select a course to enroll in.");
      return;
    }

    if (!cnicFile || !photoFile || !paymentProof) {
      setErrorMsg("Please upload all required files (CNIC Copy, Portrait Photo, Payment Proof).");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admissions', {
        fullName,
        fatherName,
        cnic,
        dateOfBirth,
        gender,
        whatsapp,
        email,
        postalAddress,
        lastQualification,
        passingYear,
        institute,
        emergencyName,
        emergencyRelation,
        emergencyContact,
        cnicFile,
        photoFile,
        paymentProof,
        selectedCourses: [selectedCourse], // Send as array for backward compat
        totalAmount,
        paymentMethod,
        batchId: selectedBatchId || undefined,
      });

      setSuccessMsg("Your application has been submitted successfully! An administrator will review your payment and approve your enrollment shortly.");

      // Reset form
      setFatherName("");
      setCnic("");
      setDateOfBirth("");
      setWhatsapp("");
      setPostalAddress("");
      setLastQualification("");
      setPassingYear("");
      setInstitute("");
      setEmergencyName("");
      setEmergencyRelation("");
      setEmergencyContact("");
      setSelectedCourse("");
      setCnicFile("");
      setPhotoFile("");
      setPaymentProof("");
      setSelectedBatchId("");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="w-10 h-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </main>
    );
  }

  // Block if student already has active enrollment
  if (hasActiveEnrollment) {
    return (
      <main className="min-h-screen bg-bg-light py-10 md:py-16">
        <div className="container-main max-w-lg">
          <div className="bg-white border border-border-light rounded-2xl p-8 md:p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Already Enrolled</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              You are currently enrolled in <strong className="text-brand-green">{activeCourseName}</strong>. 
              You can only take one course at a time.
            </p>
            <p className="text-xs text-text-secondary">
              Complete or finish your current course before applying for a new one.
            </p>
            <Link href="/dashboard" className="btn-signup inline-block no-underline px-8 mt-4">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-light py-10 md:py-16">
      <div className="container-main max-w-3xl">

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary">
            {user ? 'Course Enrollment Application' : 'Online Admission Application'}
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            {user
              ? 'Select a course and submit your documents to enroll at Premier Academy.'
              : 'Submit your application with details and payment proof to register at Premier Academy.'}
          </p>
          {!user && (
            <p className="text-xs text-text-secondary mt-3">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-green font-semibold hover:underline no-underline">
                Sign in first
              </Link>{' '}
              to pre-fill your details.
            </p>
          )}
        </div>

        {successMsg ? (
          <div className="bg-green-50 border border-green-200 text-green-700 p-8 rounded-2xl text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">Application Received!</h2>
            <p className="text-sm leading-relaxed">{successMsg}</p>
            <Link href={user ? "/dashboard" : "/auth/login"} className="btn-signup inline-block no-underline px-6 mt-4">
              {user ? 'Go to Dashboard' : 'Go to Login Page'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-border-light rounded-2xl p-6 md:p-10 shadow-sm">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {errorMsg}
              </div>
            )}

            {/* Pre-fill notice for logged in users */}
            {user && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Your name and email are pre-filled from your account and cannot be changed.
              </div>
            )}

            {/* Section 1: Personal Details */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-text-primary border-b border-border-light pb-2">1. Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    readOnly={!!user}
                    className={`w-full px-4 py-2.5 text-sm border border-border-light rounded-lg text-text-primary focus:border-brand-green ${
                      user ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="e.g. Ali Ahmed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Father&apos;s Name</label>
                  <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="e.g. Muhammad Ahmed" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">CNIC Number</label>
                  <input type="text" required value={cnic} onChange={(e) => setCnic(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="e.g. 37405-1234567-1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Date of Birth</label>
                  <input type="date" required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">WhatsApp Contact</label>
                  <input type="text" required value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="e.g. 0300-1234567" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!user}
                    className={`w-full px-4 py-2.5 text-sm border border-border-light rounded-lg text-text-primary focus:border-brand-green ${
                      user ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                    placeholder="e.g. you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Postal Address</label>
                <textarea required value={postalAddress} onChange={(e) => setPostalAddress(e.target.value)} rows={2} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="Enter complete home/office mailing address" />
              </div>
            </div>

            {/* Section 2: Educational Background */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-text-primary border-b border-border-light pb-2">2. Educational Background</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Last Qualification</label>
                  <input type="text" value={lastQualification} onChange={(e) => setLastQualification(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="e.g. MBA, B.Com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Passing Year</label>
                  <input type="text" value={passingYear} onChange={(e) => setPassingYear(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="e.g. 2024" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Institute / Board</label>
                  <input type="text" value={institute} onChange={(e) => setInstitute(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="e.g. University of Peshawar" />
                </div>
              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-text-primary border-b border-border-light pb-2">3. Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Name</label>
                  <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Relation</label>
                  <input type="text" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="e.g. Father, Brother" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Contact Number</label>
                  <input type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green" placeholder="e.g. 0300-1234567" />
                </div>
              </div>
            </div>

            {/* Section 4: Course Selection (SINGLE) */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-text-primary border-b border-border-light pb-2">4. Batch &amp; Course Selection</h2>

              {batchesList.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Select Academic Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green font-medium"
                  >
                    {batchesList.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} (Starts: {new Date(batch.startDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-4 py-2.5 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You can select <strong>one course</strong> at a time. After completing it, you may apply for another.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coursesList.map((course) => (
                  <div key={course.name} onClick={() => setSelectedCourse(course.name)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      selectedCourse === course.name
                        ? "border-brand-green bg-brand-green/5 ring-2 ring-brand-green/20"
                        : "border-border-light bg-white hover:border-gray-300"
                    }`}>
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="courseSelect"
                        checked={selectedCourse === course.name}
                        readOnly
                        className="mt-1 accent-brand-green"
                      />
                      <span className="text-xs font-bold text-text-primary">{course.name}</span>
                    </div>
                    <div className="mt-3 text-xs text-text-secondary">
                      <span className="line-through mr-2">PKR {course.originalFee?.toLocaleString()}</span>
                      <span className="text-brand-green font-bold">PKR {course.discountedFee?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedCourse && (
                <div className="bg-bg-light rounded-xl p-4 flex justify-between items-center border border-border-light">
                  <span className="text-xs font-bold text-text-secondary uppercase">Total Admission Fee:</span>
                  <span className="text-lg font-extrabold text-brand-green">PKR {totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Section 5: Document Upload */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-text-primary border-b border-border-light pb-2">5. Document Uploads</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-dashed border-border-light rounded-xl p-4 text-center">
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-2">CNIC Front &amp; Back</span>
                    <input type="file" required onChange={(e) => handleFileUpload(e, setCnicFile)} className="w-full text-xs text-text-secondary" />
                    {cnicFile && <span className="text-[10px] text-green-600 block mt-1">✓ File ready</span>}
                  </div>
                  <div className="border border-dashed border-border-light rounded-xl p-4 text-center">
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-2">Passport Size Photo</span>
                    <input type="file" required onChange={(e) => handleFileUpload(e, setPhotoFile)} className="w-full text-xs text-text-secondary" />
                    {photoFile && <span className="text-[10px] text-green-600 block mt-1">✓ File ready</span>}
                  </div>
                  <div className="border border-dashed border-border-light rounded-xl p-4 text-center">
                    <span className="block text-xs font-bold text-text-secondary uppercase mb-2">Payment Receipt</span>
                    <input type="file" required onChange={(e) => handleFileUpload(e, setPaymentProof)} className="w-full text-xs text-text-secondary" />
                    {paymentProof && <span className="text-[10px] text-green-600 block mt-1">✓ File ready</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Payment Info */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-text-primary border-b border-border-light pb-2">6. Payment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-border-light rounded-lg bg-white text-text-primary focus:border-brand-green">
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                  </select>
                </div>
                <div className="md:col-span-2 bg-gray-50 border border-border-light rounded-xl p-4 text-xs space-y-1">
                  <p className="font-bold text-text-primary">Official Academy Account Details:</p>
                  {paymentMethod === "Bank Transfer" ? (
                    <>
                      <p><strong>Bank:</strong> Habib Bank Limited (HBL)</p>
                      <p><strong>Account Title:</strong> Premier Tax School</p>
                      <p><strong>Account Number:</strong> 1234-56789012-03</p>
                    </>
                  ) : paymentMethod === "JazzCash" ? (
                    <>
                      <p><strong>Mobile Wallet:</strong> JazzCash</p>
                      <p><strong>Account Title:</strong> Raja Gulfam Kayani</p>
                      <p><strong>Number:</strong> 0300-1234567</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Mobile Wallet:</strong> EasyPaisa</p>
                      <p><strong>Account Title:</strong> Raja Gulfam Kayani</p>
                      <p><strong>Number:</strong> 0345-1234567</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-signup w-full py-3.5 text-base font-bold disabled:opacity-50">
              {submitting ? 'Submitting Application...' : 'Submit Application & Request Enrollment'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
