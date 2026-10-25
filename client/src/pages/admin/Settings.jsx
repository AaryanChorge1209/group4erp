import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building, BookOpen, GraduationCap, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import FormField from '../../components/ui/FormField';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);

  // College Details
  const [collegeDetails, setCollegeDetails] = useState({
    collegeName: 'VVIT College of Engineering',
    collegeCode: 'VVIT-045',
    academicYear: '2024-25',
    principalEmail: 'principal@vvit.edu'
  });

  // Library Settings
  const [librarySettings, setLibrarySettings] = useState({
    loanPeriodDays: 14,
    finePerDay: 2,
    maxBooksPerStudent: 3,
    reservationHoldHours: 48
  });

  // Academic Settings
  const [academicSettings, setAcademicSettings] = useState({
    currentSemester: 5,
    gradingScale: '10.0',
    passingCgpa: 5.0
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.get('/admin/settings');
        const map = res.data.settings || {};

        if (map.collegeName) {
          setCollegeDetails((prev) => ({
            ...prev,
            collegeName: map.collegeName || prev.collegeName,
            academicYear: map.academicYear || prev.academicYear
          }));
        }

        if (map.loanPeriodDays || map.finePerDay) {
          setLibrarySettings((prev) => ({
            ...prev,
            loanPeriodDays: parseInt(map.loanPeriodDays) || prev.loanPeriodDays,
            finePerDay: parseFloat(map.finePerDay) || prev.finePerDay
          }));
        }
      } catch {
        toast.error('Failed to load current system settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const saveSettings = async (sectionName, payload) => {
    try {
      setSavingSection(sectionName);
      await api.put('/admin/settings', { settings: payload });
      toast.success(`${sectionName} saved successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to update ${sectionName}`);
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Settings" subtitle="Loading institutional configurations..." />
        <SkeletonLoader rows={4} cols={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution Configuration & Policies"
        subtitle="Global defaults governing academic terms, library circulation rules, and organizational identity"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: College Details */}
        <div className="card p-6 flex flex-col justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSettings('College Identity', collegeDetails);
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Building className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">College Details</h3>
            </div>

            <FormField label="College Name" required>
              <input
                type="text"
                required
                value={collegeDetails.collegeName}
                onChange={(e) => setCollegeDetails({ ...collegeDetails, collegeName: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Institutional Code">
              <input
                type="text"
                value={collegeDetails.collegeCode}
                onChange={(e) => setCollegeDetails({ ...collegeDetails, collegeCode: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Active Academic Year" required>
              <select
                value={collegeDetails.academicYear}
                onChange={(e) => setCollegeDetails({ ...collegeDetails, academicYear: e.target.value })}
                className="input"
              >
                <option value="2024-25">2024-25 (Current)</option>
                <option value="2023-24">2023-24</option>
              </select>
            </FormField>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSection === 'College Identity'}
                className="btn btn-primary btn-sm w-full justify-center"
              >
                <Save className="w-4 h-4" />
                <span>{savingSection === 'College Identity' ? 'Saving...' : 'Save College Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Library Policies */}
        <div className="card p-6 flex flex-col justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSettings('Library Policies', librarySettings);
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <BookOpen className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Circulation & Fines</h3>
            </div>

            <FormField label="Standard Loan Period (Days)" required hint="Default borrowing window">
              <input
                type="number"
                min={1}
                required
                value={librarySettings.loanPeriodDays}
                onChange={(e) => setLibrarySettings({ ...librarySettings, loanPeriodDays: parseInt(e.target.value) || 14 })}
                className="input"
              />
            </FormField>

            <FormField label="Fine Rate (₹ per Day Overdue)" required>
              <input
                type="number"
                min={0}
                step="0.5"
                required
                value={librarySettings.finePerDay}
                onChange={(e) => setLibrarySettings({ ...librarySettings, finePerDay: parseFloat(e.target.value) || 2 })}
                className="input"
              />
            </FormField>

            <FormField label="Reservation Pickup Window (Hours)" hint="Hold duration before next waitlist notified">
              <input
                type="number"
                min={12}
                value={librarySettings.reservationHoldHours}
                onChange={(e) => setLibrarySettings({ ...librarySettings, reservationHoldHours: parseInt(e.target.value) || 48 })}
                className="input"
              />
            </FormField>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSection === 'Library Policies'}
                className="btn btn-primary btn-sm w-full justify-center"
              >
                <Save className="w-4 h-4" />
                <span>{savingSection === 'Library Policies' ? 'Saving...' : 'Save Library Policies'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 3: Academic Term Settings */}
        <div className="card p-6 flex flex-col justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSettings('Academic Term', academicSettings);
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <GraduationCap className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Academic Term</h3>
            </div>

            <FormField label="Active Engineering Semester">
              <select
                value={academicSettings.currentSemester}
                onChange={(e) => setAcademicSettings({ ...academicSettings, currentSemester: parseInt(e.target.value) || 5 })}
                className="input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Institutional Grading Scale">
              <input
                type="text"
                disabled
                value="10.0 Absolute Grade Point (CGPA)"
                className="input bg-gray-50 dark:bg-navy-900 opacity-80 cursor-not-allowed"
              />
            </FormField>

            <FormField label="Minimum Placement Eligibility CGPA">
              <input
                type="number"
                step="0.1"
                value={academicSettings.passingCgpa}
                onChange={(e) => setAcademicSettings({ ...academicSettings, passingCgpa: parseFloat(e.target.value) || 5.0 })}
                className="input"
              />
            </FormField>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSection === 'Academic Term'}
                className="btn btn-primary btn-sm w-full justify-center"
              >
                <Save className="w-4 h-4" />
                <span>{savingSection === 'Academic Term' ? 'Saving...' : 'Save Academic Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Settings;
