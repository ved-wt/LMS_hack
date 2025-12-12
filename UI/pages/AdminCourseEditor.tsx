import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Training, Module, Lesson, Question, TrainingType, TrainingStatus, CurrentUser, UserRole } from '../types';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface AdminCourseEditorProps {
  user?: CurrentUser;
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const AdminCourseEditor: React.FC<AdminCourseEditorProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [training, setTraining] = useState<Training | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const found = await api.trainings.get(id);
        if (found) {
          setTraining(JSON.parse(JSON.stringify(found))); // Deep copy
        } else {
          alert('Course not found or invalid ID.');
          navigate('/admin-trainings');
        }
      } else {
        setTraining({
          id: generateId('training'),
          title: 'New Training Course',
          description: '',
          category: 'Technical',
          type: TrainingType.ONLINE,
          duration_hours: 1,
          instructor: '',
          start_date: new Date().toISOString().split('T')[0],
          status: TrainingStatus.DRAFT,
          is_mandatory: false,
          enrolled_count: 0,
          max_participants: 100,
          image: 'https://picsum.photos/400/225',
          modules: []
        });
      }
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);

  if (loading || !training) return <div className="p-8 flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      let trainingId = training?.id;

      // 1. Save Training Shell
      if (isNew) {
        const newTraining = await api.trainings.create(training!);
        trainingId = newTraining.id;
      } else {
        await api.trainings.update(training!.id, training!);
      }

      // 2. Save Modules & Lessons
      if (training?.modules) {
        for (let mIdx = 0; mIdx < training.modules.length; mIdx++) {
          const module = training.modules[mIdx];
          let moduleId = module.id;

          // Create or Update Module
          if (module.id.startsWith('m-')) {
            const newModule = await api.content.createModule(trainingId!, module.title, mIdx);
            moduleId = newModule.id;
          } else {
            await api.content.updateModule(module.id, { title: module.title, order: mIdx });
          }

          // Save Lessons
          if (module.lessons) {
            for (let lIdx = 0; lIdx < module.lessons.length; lIdx++) {
              const lesson = module.lessons[lIdx];

              if (lesson.id.startsWith('l-')) {
                await api.content.createLesson(moduleId, {
                  ...lesson,
                  order: lIdx
                });
              } else {
                await api.content.updateLesson(lesson.id, {
                  ...lesson,
                  order: lIdx
                });
              }
            }
          }
        }
      }

      alert('Training saved successfully!');
      navigate('/admin-trainings');
    } catch (e) {
      console.error(e);
      alert('Error saving training');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!training) return;
    setSaving(true);
    try {
      await api.trainings.approve(training.id);
      alert('Training Approved & Published!');
      navigate('/admin-trainings');
    } catch (e) {
      alert('Error approving training');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!training) return;
    setSaving(true);
    try {
      await api.trainings.reject(training.id, "Rejected by Admin");
      alert('Training Rejected and moved to Drafts.');
      navigate('/admin-trainings');
    } catch (e) {
      alert('Error rejecting training');
    } finally {
      setSaving(false);
    }
  };

  // --- Module Management ---
  const addModule = () => {
    const newModule: Module = {
      id: generateId('m'),
      title: 'New Module',
      lessons: []
    };
    setTraining(prev => {
      if (!prev) return null;
      const currentModules = prev.modules || [];
      return { ...prev, modules: [...currentModules, newModule] };
    });
    setActiveModuleId(newModule.id);
  };

  const deleteModule = async (moduleId: string) => {
    if (window.confirm('Are you sure you want to delete this module? All lessons within it will be lost.')) {
      // If it's a real module, delete from backend immediately
      if (!moduleId.startsWith('m-')) {
        try {
          await api.content.deleteModule(moduleId);
        } catch (e) {
          alert('Failed to delete module from server');
          return;
        }
      }

      setTraining(prev => {
        if (!prev) return null;
        return {
          ...prev,
          modules: (prev.modules || []).filter(m => m.id !== moduleId)
        };
      });
      if (activeModuleId === moduleId) setActiveModuleId(null);
      setActiveLessonId(null);
    }
  };

  const updateModuleTitle = (moduleId: string, newTitle: string) => {
    setTraining(prev => {
      if (!prev) return null;
      return {
        ...prev,
        modules: (prev.modules || []).map(m => m.id === moduleId ? { ...m, title: newTitle } : m)
      };
    });
  };

  // --- Lesson Management ---
  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: generateId('l'),
      title: 'New Lesson',
      type: 'VIDEO',
      duration_minutes: 10,
      content_url: ''
    };
    setTraining(prev => {
      if (!prev) return null;
      return {
        ...prev,
        modules: (prev.modules || []).map(m => {
          if (m.id === moduleId) {
            const currentLessons = m.lessons || [];
            return { ...m, lessons: [...currentLessons, newLesson] };
          }
          return m;
        })
      };
    });
    setActiveLessonId(newLesson.id);
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (window.confirm('Delete this lesson?')) {
      // If real lesson, delete from backend
      if (!lessonId.startsWith('l-')) {
        try {
          await api.content.deleteLesson(lessonId);
        } catch (e) {
          alert('Failed to delete lesson from server');
          return;
        }
      }

      setTraining(prev => {
        if (!prev) return null;
        return {
          ...prev,
          modules: (prev.modules || []).map(m => {
            if (m.id === moduleId) {
              return {
                ...m,
                lessons: (m.lessons || []).filter(l => l.id !== lessonId)
              };
            }
            return m;
          })
        };
      });
      if (activeLessonId === lessonId) setActiveLessonId(null);
    }
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    setTraining(prev => {
      if (!prev) return null;
      return {
        ...prev,
        modules: (prev.modules || []).map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: (m.lessons || []).map(l => l.id === lessonId ? { ...l, ...updates } : l)
            };
          }
          return m;
        })
      };
    });
  };

  // --- Quiz Management ---
  const addQuestion = (moduleId: string, lessonId: string) => {
    const newQuestion: Question = {
      id: generateId('q'),
      text: 'New Question',
      options: ['Option 1', 'Option 2'],
      correctAnswer: 0
    };

    const module = training?.modules?.find(m => m.id === moduleId);
    const lesson = module?.lessons.find(l => l.id === lessonId);
    const currentQuestions = lesson?.questions || [];

    updateLesson(moduleId, lessonId, { questions: [...currentQuestions, newQuestion] });
  };

  const updateQuestion = (moduleId: string, lessonId: string, questionId: string, updates: Partial<Question>) => {
    const module = training?.modules?.find(m => m.id === moduleId);
    const lesson = module?.lessons.find(l => l.id === lessonId);

    if (!lesson) return;

    const updatedQuestions = lesson.questions?.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ) || [];

    updateLesson(moduleId, lessonId, { questions: updatedQuestions });
  };

  const deleteQuestion = (moduleId: string, lessonId: string, questionId: string) => {
    const module = training?.modules?.find(m => m.id === moduleId);
    const lesson = module?.lessons.find(l => l.id === lessonId);

    if (!lesson) return;

    const updatedQuestions = lesson.questions?.filter(q => q.id !== questionId) || [];
    updateLesson(moduleId, lessonId, { questions: updatedQuestions });
  };


  // --- Render Helpers ---
  const activeModule = training?.modules?.find(m => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons?.find(l => l.id === activeLessonId);

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] -m-4 md:-m-8 bg-slate-50">

      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin-trainings')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isNew ? 'Create New Course' : 'Edit Course'}</h1>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${training.status === TrainingStatus.PENDING_APPROVAL ? 'bg-amber-100 text-amber-800' :
                (training.status === TrainingStatus.PUBLISHED || training.status === TrainingStatus.APPROVED) ? 'bg-emerald-100 text-emerald-800' :
                  'bg-slate-100 text-slate-600'
                }`}>
                {training.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === UserRole.SUPER_ADMIN && training.status === TrainingStatus.PENDING_APPROVAL && (
            <>
              <button
                onClick={handleReject}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <X size={18} /> Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Approve & Publish
              </button>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel: Course Structure (Modules & Lessons) */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
            <span>Syllabus</span>
            <button
              onClick={addModule}
              className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
              title="Add New Module"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {(training.modules || []).map((module, mIdx) => (
              <div key={module.id} className="border-b border-slate-100">
                <div
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${activeModuleId === module.id ? 'bg-slate-50' : ''}`}
                  onClick={() => setActiveModuleId(module.id === activeModuleId ? null : module.id)}
                >
                  <div className="flex items-center gap-2 font-medium text-slate-700 text-sm overflow-hidden">
                    {activeModuleId === module.id ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
                    <span className="truncate">{module.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addLesson(module.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Add Lesson"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteModule(module.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Module"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {activeModuleId === module.id && (
                  <div className="bg-slate-50/50 pb-2">
                    {(module.lessons || []).map((lesson, lIdx) => (
                      <div
                        key={lesson.id}
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`pl-10 pr-2 py-2 flex items-center justify-between cursor-pointer text-sm group ${activeLessonId === lesson.id ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {lesson.type === 'VIDEO' && <Video size={14} className="shrink-0" />}
                          {lesson.type === 'QUIZ' && <HelpCircle size={14} className="shrink-0" />}
                          {lesson.type === 'TEXT' && <FileText size={14} className="shrink-0" />}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteLesson(module.id, lesson.id);
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete Lesson"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {(module.lessons || []).length === 0 && (
                      <div className="pl-10 pr-4 py-2 text-xs text-slate-400 italic">No lessons. Click + to add.</div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {(training.modules || []).length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No modules yet.<br />Click + above to start.
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Content Editor */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Banner for Pending Approval */}
            {training.status === TrainingStatus.PENDING_APPROVAL && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-amber-800">Pending Approval</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    This course is currently awaiting Super Admin approval before it can be published.
                  </p>
                </div>
              </div>
            )}

            {/* Context Awareness */}
            {!activeModuleId && !activeLessonId && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Course Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Course Title</label>
                    <input
                      type="text"
                      value={training.title}
                      onChange={(e) => setTraining(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Instructor Name</label>
                    <input
                      type="text"
                      value={training.instructor}
                      onChange={(e) => setTraining(prev => prev ? ({ ...prev, instructor: e.target.value }) : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      value={training.description}
                      onChange={(e) => setTraining(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select
                      value={training.category}
                      onChange={(e) => setTraining(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option>Technical</option>
                      <option>Soft Skills</option>
                      <option>Compliance</option>
                      <option>Leadership</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Cover Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={training.image}
                        onChange={(e) => setTraining(prev => prev ? ({ ...prev, image: e.target.value }) : null)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <div className="w-10 h-10 rounded bg-slate-100 shrink-0 border border-slate-200 overflow-hidden">
                        <img src={training.image} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Duration (Hours)</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={training.duration_hours}
                      onChange={(e) => setTraining(prev => prev ? ({ ...prev, duration_hours: parseFloat(e.target.value) }) : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Max Participants</label>
                    <input
                      type="number"
                      min="1"
                      value={training.max_participants}
                      onChange={(e) => setTraining(prev => prev ? ({ ...prev, max_participants: parseInt(e.target.value) }) : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <input
                      type="checkbox"
                      id="is_mandatory"
                      checked={training.is_mandatory}
                      onChange={(e) => setTraining(prev => prev ? ({ ...prev, is_mandatory: e.target.checked }) : null)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="is_mandatory" className="text-sm font-medium text-slate-700">Mandatory Course</label>
                  </div>
                </div>
              </div>
            )}

            {activeModuleId && !activeLessonId && activeModule && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Edit Module</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Module Title</label>
                    <input
                      type="text"
                      value={activeModule.title}
                      onChange={(e) => updateModuleTitle(activeModuleId, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500">
                    <p>Contains {(activeModule.lessons || []).length} lessons.</p>
                    <p className="mt-1">Select a lesson from the sidebar to edit its content.</p>
                  </div>
                </div>
              </div>
            )}

            {activeModuleId && activeLessonId && activeModule && activeLesson && (
              <div className="space-y-6">

                {/* Lesson Metadata Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    Edit Lesson: <span className="text-indigo-600">{activeLesson.title}</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Lesson Title</label>
                      <input
                        type="text"
                        value={activeLesson.title}
                        onChange={(e) => updateLesson(activeModuleId, activeLessonId, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Lesson Type</label>
                      <select
                        value={activeLesson.type}
                        onChange={(e) => updateLesson(activeModuleId, activeLessonId, { type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                        <option value="VIDEO">Video</option>
                        <option value="QUIZ">Quiz / Test</option>
                        <option value="TEXT">Text / Article</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Duration (Minutes)</label>
                      <input
                        type="number"
                        value={activeLesson.duration_minutes}
                        onChange={(e) => updateLesson(activeModuleId, activeLessonId, { duration_minutes: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Content Editor */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  {activeLesson.type === 'VIDEO' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-slate-800">Video Configuration</h3>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Video URL (MP4)</label>
                        <input
                          type="text"
                          value={activeLesson.content_url || ''}
                          onChange={(e) => updateLesson(activeModuleId, activeLessonId, { content_url: e.target.value })}
                          placeholder="https://example.com/video.mp4"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description / Context</label>
                        <textarea
                          value={activeLesson.content_text || ''}
                          onChange={(e) => updateLesson(activeModuleId, activeLessonId, { content_text: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Description of what the student will watch..."
                        />
                      </div>
                      {activeLesson.content_url && (
                        <div className="mt-4 rounded-lg overflow-hidden bg-black aspect-video">
                          <video src={activeLesson.content_url} controls className="w-full h-full" />
                        </div>
                      )}
                    </div>
                  )}

                  {activeLesson.type === 'TEXT' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-slate-800">Article Content</h3>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Content (Markdown supported)</label>
                        <textarea
                          value={activeLesson.content_text || ''}
                          onChange={(e) => updateLesson(activeModuleId, activeLessonId, { content_text: e.target.value })}
                          rows={12}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                          placeholder="# Lesson Header&#10;&#10;Write your content here..."
                        />
                      </div>
                    </div>
                  )}

                  {activeLesson.type === 'QUIZ' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="text-indigo-600" size={20} />
                          <h3 className="font-bold text-slate-800">Quiz Builder</h3>
                        </div>
                        <button
                          onClick={() => addQuestion(activeModuleId, activeLessonId)}
                          className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100"
                        >
                          + Add Question
                        </button>
                      </div>

                      {(!activeLesson.questions || activeLesson.questions.length === 0) && (
                        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400">
                          No questions added yet.
                        </div>
                      )}

                      <div className="space-y-6">
                        {activeLesson.questions?.map((q, qIndex) => (
                          <div key={q.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-sm font-bold text-slate-500 uppercase">Question {qIndex + 1}</span>
                              <button
                                onClick={() => deleteQuestion(activeModuleId, activeLessonId, q.id)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => updateQuestion(activeModuleId, activeLessonId, q.id, { text: e.target.value })}
                              placeholder="Enter question text..."
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg mb-4 bg-white"
                            />

                            <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                              <p className="text-xs font-semibold text-slate-500 mb-2">Options (Select the radio button for the correct answer)</p>
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${q.id}`}
                                    checked={q.correctAnswer === optIndex}
                                    onChange={() => updateQuestion(activeModuleId, activeLessonId, q.id, { correctAnswer: optIndex })}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newOptions = [...q.options];
                                      newOptions[optIndex] = e.target.value;
                                      updateQuestion(activeModuleId, activeLessonId, q.id, { options: newOptions });
                                    }}
                                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md text-sm"
                                  />
                                  <button
                                    onClick={() => {
                                      const newOptions = q.options.filter((_, i) => i !== optIndex);
                                      updateQuestion(activeModuleId, activeLessonId, q.id, { options: newOptions });
                                    }}
                                    className="text-slate-400 hover:text-red-500"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => updateQuestion(activeModuleId, activeLessonId, q.id, { options: [...q.options, 'New Option'] })}
                                className="text-xs text-indigo-600 hover:underline mt-2 flex items-center gap-1"
                              >
                                <Plus size={12} /> Add Option
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Empty State Guide */}
            {training.modules?.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-slate-900 font-medium">Start building your course</h3>
                <p className="text-slate-500 mb-4">Add your first module to begin organizing content.</p>
                <button onClick={addModule} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Add Module
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseEditor;